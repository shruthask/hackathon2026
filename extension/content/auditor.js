/**
 * Lantern – Advanced In-Browser DOM Accessibility Auditor (WAVE-Inspired)
 *
 * Runs directly in the live webpage context to audit ANY website:
 * - Traverses Shadow DOM roots (YouTube, Polymer, Web Components, Custom Elements)
 * - Details Categories: Errors, Contrast Errors, Alerts, Features, Structure, ARIA
 * - Tab 3 Order: Keyboard focus order analysis & positive tabindex detection
 * - Tab 4 Structure: Hierarchical heading & landmark outline tree
 * - Tab 5 Contrast: Live computed contrast, WCAG AA/AAA compliance, & automated color suggestions
 * - Capped rule-based scoring (like Lighthouse) to prevent false-positive score zeroing
 */

(function () {
  window.__LANTERN_AUDITOR_LOADED__ = true;

  let issueCounter = 0;
  function getUniqueLanternId() {
    issueCounter += 1;
    return `lantern-node-${Date.now()}-${issueCounter}`;
  }

  // ── Ultra-Fast Deep Shadow-DOM Element Querying ─────────────────
  function querySelectorAllDeep(selector, root = document) {
    const results = [];
    const rootsToSearch = [root];
    const visitedRoots = new Set();

    while (rootsToSearch.length > 0) {
      const current = rootsToSearch.shift();
      if (!current || visitedRoots.has(current)) continue;
      visitedRoots.add(current);

      // 1. Native query on this root
      try {
        const matches = current.querySelectorAll(selector);
        for (let i = 0; i < matches.length; i++) {
          const el = matches[i];
          if (
            !el.id?.startsWith("lantern-") &&
            !el.classList?.contains("lantern-injected-badge") &&
            !el.classList?.contains("lantern-injected-overlay") &&
            !el.classList?.contains("lantern-interactive-tooltip") &&
            !el.classList?.contains("lantern-order-badge")
          ) {
            results.push(el);
          }
        }
      } catch (e) {}

      // 2. Discover open shadow roots inside this root
      try {
        const allElements = current.querySelectorAll("*");
        for (let i = 0; i < allElements.length; i++) {
          if (allElements[i].shadowRoot) {
            rootsToSearch.push(allElements[i].shadowRoot);
          }
        }
      } catch (e) {}
    }

    return results;
  }

  // ── Visibility & Element Filtering ──────────────────────────────
  function isElementVisible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    // Filter out inactive templates or noscripts
    if (el.closest("template, noscript, [inert]")) return false;
    if (el.hasAttribute("hidden")) return false;

    // Filter out elements hidden explicitly with aria-hidden="true"
    if (el.getAttribute("aria-hidden") === "true") return false;

    try {
      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        parseFloat(style.opacity) === 0
      ) {
        return false;
      }
    } catch (e) {}

    // Note: Do not discard elements with width/height 0 if they are links, buttons, or images,
    // because empty links/buttons and missing alt images ARE the accessibility violations!
    return true;
  }

  function getReadableSnippet(el, maxLen = 160) {
    if (!el || !el.outerHTML) return "";
    const clone = el.cloneNode(false);
    let html = clone.outerHTML;
    if (el.innerHTML && el.innerHTML.trim().length > 0) {
      const text = (el.innerText || el.textContent || "").trim().slice(0, 35);
      if (text) {
        html = html.replace(/><\/[a-zA-Z0-9_-]+>$/, `>${text}...</${el.tagName.toLowerCase()}>`);
      }
    }
    if (html.length > maxLen) {
      html = html.slice(0, maxLen) + "...>";
    }
    return html;
  }

  function generateSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const path = [];
    let curr = el;
    let depth = 0;
    while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== document.documentElement && depth < 5) {
      depth++;
      let selector = curr.tagName.toLowerCase();
      if (curr.id) {
        selector += `#${CSS.escape(curr.id)}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = curr;
        let nth = 1;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.tagName === curr.tagName) nth++;
        }
        selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      curr = curr.parentElement;
    }
    return path.join(" > ");
  }

  function getAccessibleName(el) {
    if (!el) return "";
    if (el.getAttribute("aria-label")?.trim()) {
      return el.getAttribute("aria-label").trim();
    }
    if (el.getAttribute("aria-labelledby")?.trim()) {
      const ids = el.getAttribute("aria-labelledby").trim().split(/\s+/);
      const textParts = ids
        .map((id) => document.getElementById(id)?.innerText || "")
        .filter(Boolean);
      if (textParts.length) return textParts.join(" ").trim();
    }
    if (el.getAttribute("title")?.trim()) return el.getAttribute("title").trim();
    if (el.getAttribute("alt")?.trim()) return el.getAttribute("alt").trim();
    if (el.getAttribute("value")?.trim()) return el.getAttribute("value").trim();
    if (el.getAttribute("placeholder")?.trim()) return el.getAttribute("placeholder").trim();
    const inner = (el.innerText || el.textContent || "").trim();
    if (inner) return inner.slice(0, 50);
    return "";
  }

  // ── Color & Contrast Engine ─────────────────────────────────────
  function parseRgba(colorStr) {
    if (!colorStr) return null;
    const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) {
      return {
        r: parseInt(m[1], 10),
        g: parseInt(m[2], 10),
        b: parseInt(m[3], 10),
        a: m[4] !== undefined ? parseFloat(m[4]) : 1.0,
      };
    }
    return null;
  }

  function rgbToHex(rgb) {
    const toHex = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  function blendColors(fg, bg) {
    const alpha = fg.a;
    return {
      r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
      g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
      b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
      a: 1.0,
    };
  }

  function getEffectiveBackgroundColor(el) {
    let curr = el;
    const bgStack = [];

    while (curr && curr.nodeType === Node.ELEMENT_NODE) {
      try {
        const style = window.getComputedStyle(curr);
        const parsed = parseRgba(style.backgroundColor);
        if (parsed && parsed.a > 0) {
          bgStack.unshift(parsed);
          if (parsed.a === 1.0) break;
        }
      } catch (e) {}
      curr = curr.parentElement;
    }

    let finalBg = { r: 255, g: 255, b: 255, a: 1.0 };
    for (const bg of bgStack) {
      finalBg = blendColors(bg, finalBg);
    }
    return finalBg;
  }

  function relativeLuminance(rgb) {
    const sRGB = [rgb.r, rgb.g, rgb.b].map((val) => {
      const c = val / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  function getContrastRatio(fgColor, bgColor) {
    const l1 = relativeLuminance(fgColor);
    const l2 = relativeLuminance(bgColor);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function calculateSuggestedColor(fg, bg, targetRatio = 4.5) {
    const bgLum = relativeLuminance(bg);
    const darken = bgLum >= 0.5;
    let r = fg.r, g = fg.g, b = fg.b;
    let bestColor = { r, g, b, a: 1 };
    let bestRatio = getContrastRatio(bestColor, bg);

    for (let step = 0; step <= 255; step += 4) {
      if (bestRatio >= targetRatio) break;
      if (darken) {
        r = Math.max(0, r - 4);
        g = Math.max(0, g - 4);
        b = Math.max(0, b - 4);
      } else {
        r = Math.min(255, r + 4);
        g = Math.min(255, g + 4);
        b = Math.min(255, b + 4);
      }
      const testFg = { r, g, b, a: 1 };
      const ratio = getContrastRatio(testFg, bg);
      bestColor = testFg;
      bestRatio = ratio;
    }
    return {
      hex: rgbToHex(bestColor),
      ratio: bestRatio,
    };
  }

  // ── AUDIT RULESETS ──────────────────────────────────────────────
  const genericAltPattern = /^(image|graphic|photo|picture|icon|screenshot|banner|logo)(\.(png|jpg|jpeg|gif|webp|svg))?$/i;
  const fileExtAltPattern = /\.(png|jpg|jpeg|gif|webp|svg)$/i;

  function auditImages(issues, features) {
    const images = querySelectorAllDeep("img, [role='img'], svg, input[type='image']");
    let flaggedCount = 0;
    const maxFlagged = 40;

    for (const el of images) {
      if (flaggedCount >= maxFlagged) break;
      if (!isElementVisible(el)) continue;

      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role");
      const isAriaHidden = el.getAttribute("aria-hidden") === "true";
      const hasPresentationRole = role === "presentation" || role === "none";

      if (isAriaHidden || hasPresentationRole) continue;

      if (tag === "img") {
        const alt = el.getAttribute("alt");
        const parentLink = el.closest("a");
        const isSoleLinkContent =
          parentLink &&
          (parentLink.innerText || parentLink.textContent || "").trim() === "" &&
          parentLink.querySelectorAll("img").length === 1;

        const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
        el.setAttribute("data-lantern-id", id);

        if (alt === null) {
          flaggedCount++;
          issues.push({
            rule_id: "img-alt-missing",
            category: "images",
            wave_category: "errors",
            severity: "critical",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: isSoleLinkContent
              ? "Image inside link has no alt attribute, making the link destination invisible to screen readers."
              : "Image is missing the required `alt` attribute.",
            how_to_fix: isSoleLinkContent
              ? 'Add an alt attribute describing the link destination, e.g. alt="Go to Homepage".'
              : 'Add alt="descriptive text" describing the image content, or alt="" if purely decorative.',
            wcag_criteria: "1.1.1 Non-text Content (Level A)",
          });
        } else if (alt.trim() === "" && isSoleLinkContent) {
          flaggedCount++;
          issues.push({
            rule_id: "img-alt-empty-link",
            category: "images",
            wave_category: "errors",
            severity: "critical",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: 'Image has empty alt="" but is the only content inside a link.',
            how_to_fix: 'Provide descriptive alt text for the link destination, e.g. alt="Home page".',
            wcag_criteria: "1.1.1 Non-text Content / 2.4.4 Link Purpose",
          });
        } else if (alt.trim() !== "" && (genericAltPattern.test(alt.trim()) || fileExtAltPattern.test(alt.trim()))) {
          flaggedCount++;
          issues.push({
            rule_id: "img-alt-uninformative",
            category: "images",
            wave_category: "alerts",
            severity: "moderate",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: `Image alt text "${alt}" is generic or is just a file name.`,
            how_to_fix: "Replace generic placeholder alt text with meaningful words describing the image.",
            wcag_criteria: "1.1.1 Non-text Content (Level A)",
          });
        } else if (alt.trim().length > 2 && features.length < 25) {
          features.push({
            rule_id: "feature-alt-text",
            category: "images",
            wave_category: "features",
            severity: "feature",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: `Image has descriptive alt text: "${alt.slice(0, 40)}${alt.length > 40 ? "..." : ""}"`,
            how_to_fix: "Maintained good practice. Ensure alt text stays up-to-date with image changes.",
            wcag_criteria: "1.1.1 Non-text Content (Level A)",
          });
        }
      } else if (tag === "svg") {
        const hasAriaLabel = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
        const hasTitleChild = Boolean(el.querySelector("title"));
        if (!hasAriaLabel && !hasTitleChild && role !== "presentation" && role !== "none") {
          const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
          el.setAttribute("data-lantern-id", id);
          issues.push({
            rule_id: "svg-missing-accessible-name",
            category: "images",
            wave_category: "alerts",
            severity: "moderate",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: "SVG graphic has no accessible label or title.",
            how_to_fix: 'Add aria-label="description" or a <title> element inside the SVG, or add aria-hidden="true" if decorative.',
            wcag_criteria: "1.1.1 Non-text Content (Level A)",
          });
        }
      }
    }
  }

  function auditHeadings(issues, features) {
    const headings = querySelectorAllDeep("h1, h2, h3, h4, h5, h6, [role='heading']").filter(
      isElementVisible
    );

    if (headings.length === 0) {
      issues.push({
        rule_id: "heading-missing-all",
        category: "headings",
        wave_category: "errors",
        severity: "serious",
        element_id: null,
        element: "<body>",
        selector: "body",
        message: "The page has no headings (h1 - h6). Screen reader users cannot skim content structure.",
        how_to_fix: "Add an <h1> heading to identify the page topic, and use hierarchical <h2> - <h3> sections.",
        wcag_criteria: "1.3.1 Info and Relationships / 2.4.6 Headings and Labels",
      });
      return;
    }

    const h1s = headings.filter((h) => {
      const tag = h.tagName.toLowerCase();
      const level = h.getAttribute("aria-level");
      return tag === "h1" || level === "1";
    });

    if (h1s.length === 0) {
      const first = headings[0];
      const id = first.getAttribute("data-lantern-id") || getUniqueLanternId();
      first.setAttribute("data-lantern-id", id);
      issues.push({
        rule_id: "heading-missing-h1",
        category: "headings",
        wave_category: "alerts",
        severity: "serious",
        element_id: id,
        element: getReadableSnippet(first),
        selector: generateSelector(first),
        message: `Page is missing an <h1> main heading. Headings start with <${first.tagName.toLowerCase()}>.`,
        how_to_fix: "Add an <h1> at the top of the main content area or promote the first heading to <h1>.",
        wcag_criteria: "1.3.1 Info and Relationships (Level A)",
      });
    } else if (h1s.length === 1 && features.length < 25) {
      features.push({
        rule_id: "feature-h1-present",
        category: "headings",
        wave_category: "features",
        severity: "feature",
        element_id: h1s[0].getAttribute("data-lantern-id") || getUniqueLanternId(),
        element: getReadableSnippet(h1s[0]),
        selector: generateSelector(h1s[0]),
        message: `Primary <h1> heading present: "${getAccessibleName(h1s[0]) || "Page Title"}"`,
        how_to_fix: "Good document outline practice.",
        wcag_criteria: "1.3.1 Info and Relationships (Level A)",
      });
    }

    let prevLevel = 0;
    headings.forEach((h) => {
      const text = (h.innerText || h.textContent || "").trim();
      const id = h.getAttribute("data-lantern-id") || getUniqueLanternId();
      h.setAttribute("data-lantern-id", id);

      let level = parseInt(h.tagName.substring(1), 10);
      if (isNaN(level) && h.getAttribute("aria-level")) {
        level = parseInt(h.getAttribute("aria-level"), 10);
      }

      if (!text) {
        issues.push({
          rule_id: "heading-empty",
          category: "headings",
          wave_category: "errors",
          severity: "serious",
          element_id: id,
          element: getReadableSnippet(h),
          selector: generateSelector(h),
          message: `Heading <${h.tagName.toLowerCase()}> is empty or contains no readable text.`,
          how_to_fix: "Provide text inside the heading or remove the empty heading element.",
          wcag_criteria: "1.3.1 Info and Relationships / 2.4.6 Headings",
        });
      }

      if (level && prevLevel > 0 && level > prevLevel + 1) {
        issues.push({
          rule_id: "heading-order-skip",
          category: "headings",
          wave_category: "alerts",
          severity: "serious",
          element_id: id,
          element: getReadableSnippet(h),
          selector: generateSelector(h),
          message: `Heading level jumped from <h${prevLevel}> to <h${level}>, skipping <h${prevLevel + 1}>.`,
          how_to_fix: `Change this heading to <h${prevLevel + 1}> or insert a preceding <h${prevLevel + 1}> to preserve document hierarchy.`,
          wcag_criteria: "1.3.1 Info and Relationships (Level A)",
        });
      }
      if (level) prevLevel = level;
    });
  }

  function auditForms(issues, features) {
    const controls = querySelectorAllDeep("input, select, textarea");
    const exemptTypes = new Set(["hidden", "submit", "button", "reset", "image"]);

    controls.forEach((el) => {
      if (!isElementVisible(el)) return;
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute("type") || "text").toLowerCase();

      if (tag === "input" && exemptTypes.has(type)) return;

      const idAttr = el.id;
      let hasLabel = false;
      let labelType = "";

      if (el.getAttribute("aria-label")?.trim()) {
        hasLabel = true;
        labelType = "aria-label";
      } else if (el.getAttribute("aria-labelledby")?.trim()) {
        const labelEl = document.getElementById(el.getAttribute("aria-labelledby").trim());
        if (labelEl && (labelEl.innerText || labelEl.textContent || "").trim()) {
          hasLabel = true;
          labelType = "aria-labelledby";
        }
      }

      if (!hasLabel && idAttr) {
        const matchingLabel = document.querySelector(`label[for="${CSS.escape(idAttr)}"]`);
        if (matchingLabel && (matchingLabel.innerText || matchingLabel.textContent || "").trim()) {
          hasLabel = true;
          labelType = "label-for";
        }
      }

      if (!hasLabel) {
        const parentLabel = el.closest("label");
        if (parentLabel && (parentLabel.innerText || parentLabel.textContent || "").trim()) {
          hasLabel = true;
          labelType = "wrapping-label";
        }
      }

      if (!hasLabel && el.getAttribute("title")?.trim()) {
        hasLabel = true;
        labelType = "title";
      }

      const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
      el.setAttribute("data-lantern-id", id);

      if (!hasLabel) {
        const placeholder = el.getAttribute("placeholder");
        if (placeholder) {
          issues.push({
            rule_id: "form-label-placeholder-only",
            category: "forms",
            wave_category: "alerts",
            severity: "serious",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: `Control uses placeholder="${placeholder}" as its only label. Placeholders disappear when typing and low-contrast placeholders are unreadable.`,
            how_to_fix: `Add a persistent <label for="${idAttr || "field-id"}">${placeholder}</label> or aria-label="${placeholder}".`,
            wcag_criteria: "3.3.2 Labels or Instructions / 1.3.1 Info and Relationships",
          });
        } else {
          issues.push({
            rule_id: "form-label-missing",
            category: "forms",
            wave_category: "errors",
            severity: "critical",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: `Form control <${tag}${type !== "text" ? ` type="${type}"` : ""}> has no accessible label.`,
            how_to_fix: `Associate a <label for="${idAttr || "id"}"> element or add an aria-label attribute.`,
            wcag_criteria: "1.3.1 Info and Relationships / 3.3.2 Labels or Instructions",
          });
        }
      } else if (features.length < 25) {
        features.push({
          rule_id: "feature-form-label",
          category: "forms",
          wave_category: "features",
          severity: "feature",
          element_id: id,
          element: getReadableSnippet(el),
          selector: generateSelector(el),
          message: `Form control <${tag}> has accessible label via ${labelType}: "${getAccessibleName(el)}"`,
          how_to_fix: "Maintained good practice.",
          wcag_criteria: "3.3.2 Labels or Instructions (Level A)",
        });
      }
    });

    // Buttons
    const buttons = querySelectorAllDeep("button, [role='button'], input[type='button'], input[type='submit']");
    buttons.forEach((btn) => {
      if (!isElementVisible(btn)) return;
      const text = (btn.innerText || btn.textContent || "").trim();
      const ariaLabel = btn.getAttribute("aria-label")?.trim();
      const ariaLabelledby = btn.getAttribute("aria-labelledby")?.trim();
      const title = btn.getAttribute("title")?.trim();
      const value = btn.getAttribute("value")?.trim();
      const imgAlt = btn.querySelector("img")?.getAttribute("alt")?.trim();
      const svgTitle = btn.querySelector("svg title")?.textContent?.trim();

      const id = btn.getAttribute("data-lantern-id") || getUniqueLanternId();
      btn.setAttribute("data-lantern-id", id);

      if (!text && !ariaLabel && !ariaLabelledby && !title && !value && !imgAlt && !svgTitle) {
        issues.push({
          rule_id: "button-missing-accessible-name",
          category: "forms",
          wave_category: "errors",
          severity: "critical",
          element_id: id,
          element: getReadableSnippet(btn),
          selector: generateSelector(btn),
          message: "Button has no visible text or accessible name (e.g. icon-only button).",
          how_to_fix: 'Add visible text, an aria-label="Description", or alt text to the icon inside the button.',
          wcag_criteria: "4.1.2 Name, Role, Value (Level A)",
        });
      } else if ((ariaLabel || text) && features.length < 25) {
        features.push({
          rule_id: "feature-button-name",
          category: "forms",
          wave_category: "features",
          severity: "feature",
          element_id: id,
          element: getReadableSnippet(btn),
          selector: generateSelector(btn),
          message: `Button has accessible name: "${(ariaLabel || text).slice(0, 35)}"`,
          how_to_fix: "Good interactive control accessibility.",
          wcag_criteria: "4.1.2 Name, Role, Value (Level A)",
        });
      }
    });
  }

  function auditLinks(issues, features) {
    const links = querySelectorAllDeep("a[href]");
    const genericPhrases = new Set([
      "click here", "click", "here", "read more", "more", "learn more", "link", "view", "details", "continue"
    ]);

    links.forEach((a) => {
      if (!isElementVisible(a)) return;

      const text = (a.innerText || a.textContent || "").trim().toLowerCase();
      const ariaLabel = (a.getAttribute("aria-label") || "").trim().toLowerCase();
      const effectiveText = ariaLabel || text;

      const id = a.getAttribute("data-lantern-id") || getUniqueLanternId();
      a.setAttribute("data-lantern-id", id);

      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") && (text.includes("skip") || ariaLabel.includes("skip"))) {
        features.push({
          rule_id: "feature-skip-link",
          category: "navigation",
          wave_category: "features",
          severity: "feature",
          element_id: id,
          element: getReadableSnippet(a),
          selector: generateSelector(a),
          message: `Skip navigation link found: "${a.innerText || href}"`,
          how_to_fix: "Essential keyboard navigation feature for bypass blocks.",
          wcag_criteria: "2.4.1 Bypass Blocks (Level A)",
        });
      }

      if (!effectiveText && !a.querySelector("img[alt]:not([alt='']), svg[aria-label]")) {
        issues.push({
          rule_id: "link-empty",
          category: "navigation",
          wave_category: "errors",
          severity: "critical",
          element_id: id,
          element: getReadableSnippet(a),
          selector: generateSelector(a),
          message: "Link has no discernible text or accessible name.",
          how_to_fix: "Add link text or an aria-label explaining where this link leads.",
          wcag_criteria: "2.4.4 Link Purpose (In Context) (Level A)",
        });
      } else if (genericPhrases.has(effectiveText)) {
        issues.push({
          rule_id: "link-generic-text",
          category: "navigation",
          wave_category: "alerts",
          severity: "moderate",
          element_id: id,
          element: getReadableSnippet(a),
          selector: generateSelector(a),
          message: `Link uses generic text "${effectiveText}". Out of context, screen reader users cannot tell where it navigates.`,
          how_to_fix: `Update the link text to describe its destination or add aria-label="Read more about ...".`,
          wcag_criteria: "2.4.4 Link Purpose (In Context) (Level A)",
        });
      }
    });
  }

  function auditContrastAndBuildItems(issues) {
    const candidates = querySelectorAllDeep(
      "p, span, h1, h2, h3, h4, h5, h6, a, button, label, li, td, th, div"
    );

    let contrastIssuesFound = 0;
    const maxContrastIssues = 35;
    const contrastItems = [];

    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];

      // Find text content
      const text = (el.innerText || el.textContent || "").trim();
      if (!text || text.length < 2) continue;
      // Skip large containers that have many child elements
      if (el.children && el.children.length > 3) continue;
      if (!isElementVisible(el)) continue;

      let style;
      try {
        style = window.getComputedStyle(el);
      } catch (e) {
        continue;
      }

      const fgParsed = parseRgba(style.color);
      if (!fgParsed || fgParsed.a === 0) continue;

      const effectiveBg = getEffectiveBackgroundColor(el);
      const effectiveFg = blendColors(fgParsed, effectiveBg);
      const ratio = getContrastRatio(effectiveFg, effectiveBg);

      const fontSizePx = parseFloat(style.fontSize) || 16;
      const fontWeight = parseInt(style.fontWeight, 10) || (style.fontWeight === "bold" ? 700 : 400);
      const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
      const requiredRatioAA = isLarge ? 3.0 : 4.5;
      const requiredRatioAAA = isLarge ? 4.5 : 7.0;

      const passesAA = ratio >= requiredRatioAA;
      const passesAAA = ratio >= requiredRatioAAA;

      const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
      el.setAttribute("data-lantern-id", id);

      const fgHex = rgbToHex(effectiveFg);
      const bgHex = rgbToHex(effectiveBg);

      const suggested = calculateSuggestedColor(effectiveFg, effectiveBg, requiredRatioAA);

      const item = {
        element_id: id,
        text: text.slice(0, 60),
        element: getReadableSnippet(el),
        selector: generateSelector(el),
        fg_hex: fgHex,
        bg_hex: bgHex,
        ratio: parseFloat(ratio.toFixed(2)),
        ratio_formatted: `${ratio.toFixed(2)}:1`,
        required_ratio: requiredRatioAA,
        is_large: isLarge,
        passes_aa: passesAA,
        passes_aaa: passesAAA,
        suggested_color: suggested.hex,
        suggested_ratio: parseFloat(suggested.ratio.toFixed(2)),
      };

      if (!passesAA && contrastIssuesFound < maxContrastIssues) {
        contrastIssuesFound++;
        issues.push({
          rule_id: "contrast-low",
          category: "contrast",
          wave_category: "contrast_errors",
          severity: ratio < 2.5 ? "serious" : "moderate",
          element_id: id,
          element: getReadableSnippet(el),
          selector: generateSelector(el),
          message: `Text contrast ratio is ${ratio.toFixed(2)}:1 (${fgHex} on ${bgHex}). Minimum required is ${requiredRatioAA}:1.`,
          how_to_fix: `Change text color to ${suggested.hex} (achieves ${suggested.ratio.toFixed(2)}:1) to satisfy WCAG AA.`,
          wcag_criteria: "1.4.3 Contrast (Minimum) (Level AA)",
        });
      }

      if (contrastItems.length < 50) {
        contrastItems.push(item);
      }
    }

    contrastItems.sort((a, b) => (a.passes_aa === b.passes_aa ? a.ratio - b.ratio : a.passes_aa ? 1 : -1));
    return contrastItems;
  }

  function auditDocumentMeta(issues, features) {
    const html = document.documentElement;
    const lang = html.getAttribute("lang");
    if (!lang || !lang.trim()) {
      issues.push({
        rule_id: "doc-missing-lang",
        category: "general",
        wave_category: "alerts",
        severity: "serious",
        element_id: null,
        element: "<html>",
        selector: "html",
        message: 'The <html> element is missing a `lang` attribute. Screen readers cannot choose the correct pronunciation.',
        how_to_fix: 'Add a language tag to the html element, e.g. <html lang="en">.',
        wcag_criteria: "3.1.1 Language of Page (Level A)",
      });
    } else {
      features.push({
        rule_id: "feature-page-lang",
        category: "general",
        wave_category: "features",
        severity: "feature",
        element_id: null,
        element: `<html lang="${lang}">`,
        selector: "html",
        message: `Primary document language specified: lang="${lang}"`,
        how_to_fix: "Maintained good practice for internationalization and screen readers.",
        wcag_criteria: "3.1.1 Language of Page (Level A)",
      });
    }

    if (!document.title || !document.title.trim()) {
      issues.push({
        rule_id: "doc-missing-title",
        category: "general",
        wave_category: "errors",
        severity: "serious",
        element_id: null,
        element: "<title></title>",
        selector: "title",
        message: "The document is missing a descriptive <title> in <head>.",
        how_to_fix: "Add a concise, descriptive <title> to the document <head>.",
        wcag_criteria: "2.4.2 Page Titled (Level A)",
      });
    }

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      const content = (viewportMeta.getAttribute("content") || "").toLowerCase();
      if (content.includes("user-scalable=no") || content.includes("maximum-scale=1")) {
        issues.push({
          rule_id: "viewport-zoom-disabled",
          category: "general",
          wave_category: "errors",
          severity: "critical",
          element_id: null,
          element: getReadableSnippet(viewportMeta),
          selector: 'meta[name="viewport"]',
          message: "Viewport meta disables pinch-to-zoom (user-scalable=no). Visually impaired users cannot zoom in.",
          how_to_fix: 'Remove user-scalable=no constraints from <meta name="viewport">.',
          wcag_criteria: "1.4.4 Resize Text (Level AA)",
        });
      }
    }
  }

  // ── Tab 3: Reading & Keyboard Focus Order ────────────────────────
  function buildFocusOrder(issues) {
    const focusableSelector =
      'a[href], area[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex], [contenteditable="true"], summary';
    const elements = querySelectorAllDeep(focusableSelector);

    const validElements = [];
    elements.forEach((el, domIdx) => {
      if (!isElementVisible(el)) return;

      const rawTabindex = el.getAttribute("tabindex");
      let tabindexNum = rawTabindex !== null ? parseInt(rawTabindex, 10) : 0;
      if (isNaN(tabindexNum)) tabindexNum = 0;

      if (tabindexNum < 0) return;

      const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
      el.setAttribute("data-lantern-id", id);

      const isSuspicious = tabindexNum > 0;
      if (isSuspicious) {
        issues.push({
          rule_id: "tabindex-positive",
          category: "navigation",
          wave_category: "alerts",
          severity: "moderate",
          element_id: id,
          element: getReadableSnippet(el),
          selector: generateSelector(el),
          message: `Element has positive tabindex="${tabindexNum}". Positive tabindex disrupts the natural reading and keyboard navigation sequence.`,
          how_to_fix: 'Change to tabindex="0" to keep element in natural DOM order, or remove tabindex if naturally focusable.',
          wcag_criteria: "2.4.3 Focus Order (Level A)",
        });
      }

      validElements.push({
        dom_order: domIdx + 1,
        tabindex: tabindexNum,
        is_suspicious_tabindex: isSuspicious,
        tag: el.tagName.toLowerCase(),
        accessible_name: getAccessibleName(el) || "(unnamed interactive control)",
        element_id: id,
        selector: generateSelector(el),
        element: getReadableSnippet(el),
      });
    });

    const positiveGroup = validElements
      .filter((item) => item.tabindex > 0)
      .sort((a, b) => (a.tabindex === b.tabindex ? a.dom_order - b.dom_order : a.tabindex - b.tabindex));

    const standardGroup = validElements
      .filter((item) => item.tabindex === 0)
      .sort((a, b) => a.dom_order - b.dom_order);

    const combined = [...positiveGroup, ...standardGroup].slice(0, 100);
    combined.forEach((item, idx) => {
      item.order = idx + 1;
    });

    return combined;
  }

  // ── Tab 4: Webpage Structure Tree (Headings & Landmarks) ──────────
  function buildStructureTree() {
    const selector =
      "h1, h2, h3, h4, h5, h6, [role='heading'], header, [role='banner'], nav, [role='navigation'], main, [role='main'], footer, [role='contentinfo'], aside, [role='complementary'], section[aria-label]";
    const nodes = querySelectorAllDeep(selector).filter(isElementVisible);

    const tree = [];
    let prevHeadingLevel = 0;

    nodes.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const role = (el.getAttribute("role") || "").toLowerCase();
      const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
      el.setAttribute("data-lantern-id", id);

      const isHeading = /^h[1-6]$/.test(tag) || role === "heading";
      let level = null;
      let type = "landmark";
      let landmarkType = tag;

      if (isHeading) {
        type = "heading";
        level = parseInt(tag.substring(1), 10);
        if (isNaN(level) && el.getAttribute("aria-level")) {
          level = parseInt(el.getAttribute("aria-level"), 10);
        }
        level = level || 1;
      } else {
        if (role) landmarkType = role;
        else if (tag === "header") landmarkType = "banner";
        else if (tag === "nav") landmarkType = "navigation";
        else if (tag === "main") landmarkType = "main";
        else if (tag === "footer") landmarkType = "contentinfo";
        else if (tag === "aside") landmarkType = "complementary";
      }

      let skippedLevel = false;
      if (type === "heading" && level && prevHeadingLevel > 0 && level > prevHeadingLevel + 1) {
        skippedLevel = true;
      }
      if (type === "heading" && level) {
        prevHeadingLevel = level;
      }

      const name = getAccessibleName(el) || el.getAttribute("aria-label") || landmarkType.toUpperCase();

      tree.push({
        type,
        tag,
        level,
        landmark_type: landmarkType,
        text: name.slice(0, 50),
        skipped_level: skippedLevel,
        element_id: id,
        selector: generateSelector(el),
        element: getReadableSnippet(el),
      });
    });

    return tree;
  }

  // ── Extract ARIA Elements ─────────────────────────────────────────
  function extractAriaElements() {
    const ariaCandidates = querySelectorAllDeep(
      "[role], [aria-label], [aria-labelledby], [aria-expanded], [aria-hidden], [aria-haspopup], [aria-live], [aria-controls]"
    ).filter(isElementVisible);

    const ariaList = [];
    ariaCandidates.slice(0, 50).forEach((el) => {
      const id = el.getAttribute("data-lantern-id") || getUniqueLanternId();
      el.setAttribute("data-lantern-id", id);
      const role = el.getAttribute("role") || "";
      const label = el.getAttribute("aria-label") || "";
      const live = el.getAttribute("aria-live") || "";
      const expanded = el.getAttribute("aria-expanded") || "";

      let desc = [];
      if (role) desc.push(`role="${role}"`);
      if (label) desc.push(`aria-label="${label.slice(0, 30)}"`);
      if (live) desc.push(`aria-live="${live}"`);
      if (expanded) desc.push(`aria-expanded="${expanded}"`);

      ariaList.push({
        element_id: id,
        tag: el.tagName.toLowerCase(),
        attributes: desc.join(", ") || "aria",
        element: getReadableSnippet(el),
        selector: generateSelector(el),
      });
    });

    return ariaList;
  }

  // ── Realistic Rule-Capped Health Scoring ────────────────────────
  function calculateScore(issues) {
    let score = 100;
    const ruleDeductions = {};
    const severityWeights = { critical: 8, serious: 5, moderate: 2, minor: 1 };
    const maxPerRule = { critical: 24, serious: 15, moderate: 8, minor: 4 };

    for (const issue of issues) {
      const rid = issue.rule_id;
      ruleDeductions[rid] = (ruleDeductions[rid] || 0) + (severityWeights[issue.severity] || 2);
    }

    for (const [rid, totalDeduction] of Object.entries(ruleDeductions)) {
      const sample = issues.find((i) => i.rule_id === rid);
      const cap = maxPerRule[sample?.severity || "moderate"] || 15;
      score -= Math.min(totalDeduction, cap);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let grade = "A";
    if (score < 60) grade = "F";
    else if (score < 70) grade = "D";
    else if (score < 80) grade = "C";
    else if (score < 90) grade = "B";

    return { score, grade };
  }

  // ── Main Audit Function (Protected with try-catches) ─────────────
  window.lanternRunAudit = function () {
    const startTime = performance.now();
    const issues = [];
    const features = [];
    let contrastItems = [];
    let focusOrder = [];
    let structureTree = [];
    let ariaElements = [];

    try { auditDocumentMeta(issues, features); } catch (e) { console.error("Lantern meta audit error:", e); }
    try { auditImages(issues, features); } catch (e) { console.error("Lantern images audit error:", e); }
    try { auditHeadings(issues, features); } catch (e) { console.error("Lantern headings audit error:", e); }
    try { auditForms(issues, features); } catch (e) { console.error("Lantern forms audit error:", e); }
    try { auditLinks(issues, features); } catch (e) { console.error("Lantern links audit error:", e); }
    try { contrastItems = auditContrastAndBuildItems(issues); } catch (e) { console.error("Lantern contrast audit error:", e); }
    try { focusOrder = buildFocusOrder(issues); } catch (e) { console.error("Lantern focus order error:", e); }
    try { structureTree = buildStructureTree(); } catch (e) { console.error("Lantern structure tree error:", e); }
    try { ariaElements = extractAriaElements(); } catch (e) { console.error("Lantern ARIA elements error:", e); }

    // Summary calculation
    const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const issue of issues) {
      summary[issue.severity] = (summary[issue.severity] || 0) + 1;
    }

    const { score, grade } = calculateScore(issues);
    const durationMs = Math.round(performance.now() - startTime);

    // Grouping for WAVE Details Tab
    const detailsCategories = {
      errors: issues.filter((i) => i.wave_category === "errors" || i.severity === "critical"),
      contrast_errors: issues.filter((i) => i.wave_category === "contrast_errors" || i.category === "contrast"),
      alerts: issues.filter(
        (i) => (i.wave_category === "alerts" || i.severity === "serious" || i.severity === "moderate") &&
               i.category !== "contrast" &&
               i.severity !== "critical"
      ),
      features: features,
      structure: structureTree,
      aria: ariaElements,
    };

    return {
      source: "live-dom",
      url: window.location.href,
      page_title: document.title || window.location.hostname,
      hostname: window.location.hostname,
      total_issues: issues.length,
      score,
      grade,
      duration_ms: durationMs,
      summary,
      issues,
      features,
      details_categories: detailsCategories,
      focus_order: focusOrder,
      structure_tree: structureTree,
      contrast_items: contrastItems,
      aria_elements: ariaElements,
      disclaimer:
        "⚠️ This automated scan checks essential WCAG 2.1 Level A/AA criteria on the live rendered DOM. It does NOT replace manual testing with screen readers (VoiceOver, NVDA) or keyboard-only navigation.",
    };
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "run-dom-audit") {
      try {
        const report = window.lanternRunAudit();
        sendResponse({ success: true, data: report });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });
})();

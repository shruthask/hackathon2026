/**
 * Lantern – Advanced In-Browser DOM Accessibility Auditor
 *
 * Runs directly in the live webpage context to audit ANY website:
 * - Traverses Shadow DOM roots (YouTube, Polymer, Web Components, Custom Elements)
 * - Strict visibility detection: filters out templates, skeletons, and tracking pixels
 * - Live computed contrast with alpha-blending
 * - Capped rule-based scoring (like Lighthouse) to prevent false-positive score zeroing
 */

(function () {
  // Allow re-audit on subsequent button clicks
  window.__LANTERN_AUDITOR_LOADED__ = true;

  let issueCounter = 0;
  function getUniqueLanternId() {
    issueCounter += 1;
    return `lantern-node-${Date.now()}-${issueCounter}`;
  }

  // ── Deep Shadow-DOM Element Querying ────────────────────────────
  function querySelectorAllDeep(selector, root = document) {
    const results = [];
    function traverse(node) {
      if (!node) return;
      if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          if (node.matches && node.matches(selector)) {
            results.push(node);
          }
        } catch (e) {}

        if (node.shadowRoot) {
          traverse(node.shadowRoot);
        }
      }
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        traverse(children[i]);
      }
    }
    traverse(root);
    return results;
  }

  // ── Visibility & Element Filtering ──────────────────────────────
  function isElementVisible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    // Filter out inactive templates or noscripts
    if (el.closest("template, noscript, [inert]")) return false;
    if (el.hasAttribute("hidden")) return false;

    // Filter out elements hidden from assistive tech
    if (el.closest('[aria-hidden="true"]')) return false;

    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      parseFloat(style.opacity) === 0
    ) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    // Element must have non-zero geometry or non-empty visible text
    if (rect.width <= 1 && rect.height <= 1) {
      return false;
    }

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

  function blendColors(fg, bg) {
    const alpha = fg.a;
    return {
      r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
      g: Math.round(fg.g * alpha + bg.r * (1 - alpha)),
      b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
      a: 1.0,
    };
  }

  function getEffectiveBackgroundColor(el) {
    let curr = el;
    const bgStack = [];

    while (curr && curr.nodeType === Node.ELEMENT_NODE) {
      const style = window.getComputedStyle(curr);
      const parsed = parseRgba(style.backgroundColor);
      if (parsed && parsed.a > 0) {
        bgStack.unshift(parsed);
        if (parsed.a === 1.0) break;
      }
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

  // ── AUDIT RULESETS ──────────────────────────────────────────────
  const genericAltPattern = /^(image|graphic|photo|picture|icon|screenshot|banner|logo)(\.(png|jpg|jpeg|gif|webp|svg))?$/i;
  const fileExtAltPattern = /\.(png|jpg|jpeg|gif|webp|svg)$/i;

  function auditImages(issues) {
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
        const src = (el.getAttribute("src") || "").trim();
        const dataSrc = el.getAttribute("data-src");
        const srcset = el.getAttribute("srcset");

        // Filter out empty skeleton template placeholders
        if (!src && !dataSrc && !srcset) continue;
        if (src.includes("data:image/gif;base64,R0lGODlhAQAB")) continue;

        const alt = el.getAttribute("alt");
        const parentLink = el.closest("a");
        const isSoleLinkContent =
          parentLink &&
          (parentLink.innerText || parentLink.textContent || "").trim() === "" &&
          parentLink.querySelectorAll("img").length === 1;

        const id = getUniqueLanternId();
        el.setAttribute("data-lantern-id", id);

        if (alt === null) {
          flaggedCount++;
          issues.push({
            rule_id: "img-alt-missing",
            category: "images",
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
            severity: "moderate",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: `Image alt text "${alt}" is generic or is just a file name.`,
            how_to_fix: "Replace generic placeholder alt text with meaningful words describing the image.",
            wcag_criteria: "1.1.1 Non-text Content (Level A)",
          });
        }
      } else if (tag === "svg") {
        const hasAriaLabel = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
        const hasTitleChild = Boolean(el.querySelector("title"));
        if (!hasAriaLabel && !hasTitleChild && role !== "presentation" && role !== "none") {
          const rect = el.getBoundingClientRect();
          if (rect.width > 12 && rect.height > 12) {
            flaggedCount++;
            const id = getUniqueLanternId();
            el.setAttribute("data-lantern-id", id);
            issues.push({
              rule_id: "svg-missing-accessible-name",
              category: "images",
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
  }

  function auditHeadings(issues) {
    const headings = querySelectorAllDeep("h1, h2, h3, h4, h5, h6, [role='heading']").filter(
      isElementVisible
    );

    if (headings.length === 0) {
      issues.push({
        rule_id: "heading-missing-all",
        category: "headings",
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
      const id = getUniqueLanternId();
      first.setAttribute("data-lantern-id", id);
      issues.push({
        rule_id: "heading-missing-h1",
        category: "headings",
        severity: "serious",
        element_id: id,
        element: getReadableSnippet(first),
        selector: generateSelector(first),
        message: `Page is missing an <h1> main heading. Headings start with <${first.tagName.toLowerCase()}>.`,
        how_to_fix: "Add an <h1> at the top of the main content area or promote the first heading to <h1>.",
        wcag_criteria: "1.3.1 Info and Relationships (Level A)",
      });
    }

    let prevLevel = 0;
    headings.forEach((h) => {
      const text = (h.innerText || h.textContent || "").trim();
      const id = getUniqueLanternId();
      h.setAttribute("data-lantern-id", id);

      let level = parseInt(h.tagName.substring(1), 10);
      if (isNaN(level) && h.getAttribute("aria-level")) {
        level = parseInt(h.getAttribute("aria-level"), 10);
      }

      if (!text) {
        issues.push({
          rule_id: "heading-empty",
          category: "headings",
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

  function auditForms(issues) {
    const controls = querySelectorAllDeep("input, select, textarea");
    const exemptTypes = new Set(["hidden", "submit", "button", "reset", "image"]);

    controls.forEach((el) => {
      if (!isElementVisible(el)) return;
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute("type") || "text").toLowerCase();

      if (tag === "input" && exemptTypes.has(type)) return;

      const idAttr = el.id;
      let hasLabel = false;

      // 1. ARIA label or labelledby
      if (el.getAttribute("aria-label")?.trim()) {
        hasLabel = true;
      } else if (el.getAttribute("aria-labelledby")?.trim()) {
        const labelEl = document.getElementById(el.getAttribute("aria-labelledby").trim());
        if (labelEl && (labelEl.innerText || labelEl.textContent || "").trim()) {
          hasLabel = true;
        }
      }

      // 2. <label for="...">
      if (!hasLabel && idAttr) {
        const matchingLabel = document.querySelector(`label[for="${CSS.escape(idAttr)}"]`);
        if (matchingLabel && (matchingLabel.innerText || matchingLabel.textContent || "").trim()) {
          hasLabel = true;
        }
      }

      // 3. Wrapping <label>
      if (!hasLabel) {
        const parentLabel = el.closest("label");
        if (parentLabel && (parentLabel.innerText || parentLabel.textContent || "").trim()) {
          hasLabel = true;
        }
      }

      // 4. Title attribute
      if (!hasLabel && el.getAttribute("title")?.trim()) {
        hasLabel = true;
      }

      const id = getUniqueLanternId();
      el.setAttribute("data-lantern-id", id);

      if (!hasLabel) {
        const placeholder = el.getAttribute("placeholder");
        if (placeholder) {
          issues.push({
            rule_id: "form-label-placeholder-only",
            category: "forms",
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
            severity: "critical",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: `Form control <${tag}${type !== "text" ? ` type="${type}"` : ""}> has no accessible label.`,
            how_to_fix: `Associate a <label for="${idAttr || "id"}"> element or add an aria-label attribute.`,
            wcag_criteria: "1.3.1 Info and Relationships / 3.3.2 Labels or Instructions",
          });
        }
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

      if (!text && !ariaLabel && !ariaLabelledby && !title && !value && !imgAlt && !svgTitle) {
        const id = getUniqueLanternId();
        btn.setAttribute("data-lantern-id", id);
        issues.push({
          rule_id: "button-missing-accessible-name",
          category: "forms",
          severity: "critical",
          element_id: id,
          element: getReadableSnippet(btn),
          selector: generateSelector(btn),
          message: "Button has no visible text or accessible name (e.g. icon-only button).",
          how_to_fix: 'Add visible text, an aria-label="Description", or alt text to the icon inside the button.',
          wcag_criteria: "4.1.2 Name, Role, Value (Level A)",
        });
      }
    });
  }

  function auditLinks(issues) {
    const links = querySelectorAllDeep("a[href]");
    const genericPhrases = new Set([
      "click here", "click", "here", "read more", "more", "learn more", "link", "view", "details", "continue"
    ]);

    links.forEach((a) => {
      if (!isElementVisible(a)) return;

      const text = (a.innerText || a.textContent || "").trim().toLowerCase();
      const ariaLabel = (a.getAttribute("aria-label") || "").trim().toLowerCase();
      const effectiveText = ariaLabel || text;

      const id = getUniqueLanternId();
      a.setAttribute("data-lantern-id", id);

      if (!effectiveText && !a.querySelector("img[alt]:not([alt='']), svg[aria-label]")) {
        issues.push({
          rule_id: "link-empty",
          category: "navigation",
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

  function auditContrast(issues) {
    const candidates = querySelectorAllDeep(
      "p, span, h1, h2, h3, h4, h5, h6, a, button, label, li, td, th"
    );

    let contrastIssuesFound = 0;
    const maxContrastIssues = 30;

    for (let i = 0; i < candidates.length; i++) {
      if (contrastIssuesFound >= maxContrastIssues) break;
      const el = candidates[i];

      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join(" ");

      if (!directText || directText.length < 2) continue;
      if (!isElementVisible(el)) continue;

      const style = window.getComputedStyle(el);
      const fgParsed = parseRgba(style.color);
      if (!fgParsed || fgParsed.a === 0) continue;

      const effectiveBg = getEffectiveBackgroundColor(el);
      const effectiveFg = blendColors(fgParsed, effectiveBg);
      const ratio = getContrastRatio(effectiveFg, effectiveBg);

      const fontSizePx = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight, 10) || (style.fontWeight === "bold" ? 700 : 400);
      const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
      const requiredRatio = isLarge ? 3.0 : 4.5;

      if (ratio < requiredRatio) {
        contrastIssuesFound++;
        const id = getUniqueLanternId();
        el.setAttribute("data-lantern-id", id);

        const fgHex = `rgb(${effectiveFg.r},${effectiveFg.g},${effectiveFg.b})`;
        const bgHex = `rgb(${effectiveBg.r},${effectiveBg.g},${effectiveBg.b})`;

        issues.push({
          rule_id: "contrast-low",
          category: "contrast",
          severity: ratio < 2.5 ? "serious" : "moderate",
          element_id: id,
          element: getReadableSnippet(el),
          selector: generateSelector(el),
          message: `Text contrast ratio is ${ratio.toFixed(2)}:1 (${fgHex} on ${bgHex}). Minimum required is ${requiredRatio}:1.`,
          how_to_fix: `Adjust text color or background color to achieve at least ${requiredRatio}:1 contrast ratio.`,
          wcag_criteria: "1.4.3 Contrast (Minimum) (Level AA)",
        });
      }
    }
  }

  function auditDocumentMeta(issues) {
    const html = document.documentElement;
    const lang = html.getAttribute("lang");
    if (!lang || !lang.trim()) {
      issues.push({
        rule_id: "doc-missing-lang",
        category: "general",
        severity: "serious",
        element_id: null,
        element: "<html>",
        selector: "html",
        message: 'The <html> element is missing a `lang` attribute. Screen readers cannot choose the correct pronunciation.',
        how_to_fix: 'Add a language tag to the html element, e.g. <html lang="en">.',
        wcag_criteria: "3.1.1 Language of Page (Level A)",
      });
    }

    if (!document.title || !document.title.trim()) {
      issues.push({
        rule_id: "doc-missing-title",
        category: "general",
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
          severity: "critical",
          element_id: null,
          element: getReadableSnippet(viewportMeta),
          selector: 'meta[name="viewport"]',
          message: "Viewport meta disables pinch-to-zoom (user-scalable=no). Visually impaired users cannot zoom in.",
          how_to_fix: "Remove user-scalable=no constraints from <meta name=\"viewport\">.",
          wcag_criteria: "1.4.4 Resize Text (Level AA)",
        });
      }
    }
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

  // ── Main Audit Function ─────────────────────────────────────────
  window.lanternRunAudit = function () {
    const startTime = performance.now();
    const issues = [];

    auditDocumentMeta(issues);
    auditImages(issues);
    auditHeadings(issues);
    auditForms(issues);
    auditLinks(issues);
    auditContrast(issues);

    const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const issue of issues) {
      summary[issue.severity] = (summary[issue.severity] || 0) + 1;
    }

    const { score, grade } = calculateScore(issues);
    const durationMs = Math.round(performance.now() - startTime);

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

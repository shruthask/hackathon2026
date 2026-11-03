/**
 * Lantern – Advanced In-Browser DOM Accessibility Auditor
 *
 * Runs directly in the live webpage context to audit ANY website:
 * - Dynamic Single Page Applications (React, Vue, Angular, Next.js)
 * - Complex CSS-in-JS, Tailwind, and external stylesheets
 * - Computed contrast ratios with background color blending
 * - Accurate visibility and bounding rect checks (no false positives on hidden elements)
 * - Assigns stable data-lantern-id attributes for 100% reliable in-page highlighting
 */

(function () {
  if (window.__LANTERN_AUDITOR_LOADED__) return;
  window.__LANTERN_AUDITOR_LOADED__ = true;

  // ── UUID / Element ID Generator ─────────────────────────────────
  let issueCounter = 0;
  function getUniqueLanternId() {
    issueCounter += 1;
    return `lantern-node-${Date.now()}-${issueCounter}`;
  }

  // ── Visibility & Element Helpers ────────────────────────────────
  function isElementVisible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return false;
    }
    // Skip if hidden from assistive technologies
    if (el.closest('[aria-hidden="true"]')) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      // Check if it has non-zero children or scroll area
      return el.children.length > 0;
    }
    return true;
  }

  function getReadableSnippet(el, maxLen = 180) {
    if (!el || !el.outerHTML) return "";
    const clone = el.cloneNode(false); // shallow clone without children
    let html = clone.outerHTML;
    if (el.innerHTML && el.innerHTML.trim().length > 0) {
      const text = (el.innerText || el.textContent || "").trim().slice(0, 40);
      html = html.replace(/><\/[a-zA-Z0-9_-]+>$/, `>${text}...</${el.tagName.toLowerCase()}>`);
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
    while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== document.documentElement) {
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

  // ── Color & Contrast Engine with Alpha Blending ─────────────────
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
      g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
      b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
      a: 1.0,
    };
  }

  function getEffectiveBackgroundColor(el) {
    let curr = el;
    let bgStack = [];

    while (curr && curr.nodeType === Node.ELEMENT_NODE) {
      const style = window.getComputedStyle(curr);
      const parsed = parseRgba(style.backgroundColor);
      if (parsed && parsed.a > 0) {
        bgStack.unshift(parsed);
        if (parsed.a === 1.0) break; // fully opaque
      }
      curr = curr.parentElement;
    }

    // Default browser canvas background is white
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
    const images = document.querySelectorAll("img, [role='img'], svg, input[type='image']");
    images.forEach((el) => {
      if (!isElementVisible(el)) return;

      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role");
      const isAriaHidden = el.getAttribute("aria-hidden") === "true";
      const hasPresentationRole = role === "presentation" || role === "none";

      if (isAriaHidden || hasPresentationRole) return;

      if (tag === "img") {
        const alt = el.getAttribute("alt");
        const id = getUniqueLanternId();
        el.setAttribute("data-lantern-id", id);

        // Check if image is wrapped in a link with no other text
        const parentLink = el.closest("a");
        const isSoleLinkContent =
          parentLink &&
          (parentLink.innerText || parentLink.textContent || "").trim() === "" &&
          parentLink.querySelectorAll("img").length === 1;

        if (alt === null) {
          issues.push({
            rule_id: "img-alt-missing",
            category: "images",
            severity: "critical",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: isSoleLinkContent
              ? "Image inside link has no alt attribute, making the link invisible to screen readers."
              : "Image is missing the required `alt` attribute.",
            how_to_fix: isSoleLinkContent
              ? 'Add an alt attribute describing the destination link, e.g. alt="Go to Homepage".'
              : 'Add alt="descriptive text" describing the image content, or alt="" if purely decorative.',
            wcag_criteria: "1.1.1 Non-text Content (Level A)",
          });
        } else if (alt.trim() === "" && isSoleLinkContent) {
          issues.push({
            rule_id: "img-alt-empty-link",
            category: "images",
            severity: "critical",
            element_id: id,
            element: getReadableSnippet(el),
            selector: generateSelector(el),
            message: "Image has empty alt=\"\" but is the only content inside a link.",
            how_to_fix: 'Provide descriptive alt text for the link destination, e.g. alt="Home page".',
            wcag_criteria: "1.1.1 Non-text Content / 2.4.4 Link Purpose",
          });
        } else if (genericAltPattern.test(alt.trim()) || fileExtAltPattern.test(alt.trim())) {
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
    });
  }

  function auditHeadings(issues) {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']")).filter(
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
        message: `Page is missing an <h1> main heading. Content begins with <${first.tagName.toLowerCase()}>.`,
        how_to_fix: "Add an <h1> at the top of the main content area or promote the first heading to <h1>.",
        wcag_criteria: "1.3.1 Info and Relationships (Level A)",
      });
    } else if (h1s.length > 2) {
      const secondH1 = h1s[1];
      const id = getUniqueLanternId();
      secondH1.setAttribute("data-lantern-id", id);
      issues.push({
        rule_id: "heading-multiple-h1",
        category: "headings",
        severity: "minor",
        element_id: id,
        element: getReadableSnippet(secondH1),
        selector: generateSelector(secondH1),
        message: `Page has ${h1s.length} <h1> headings. Best practice is one primary <h1> per document.`,
        how_to_fix: "Consider demoting secondary <h1> tags to <h2> sections for clearer outline hierarchy.",
        wcag_criteria: "1.3.1 Info and Relationships (Best Practice)",
      });
    }

    // Check heading hierarchy skips
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
    const controls = document.querySelectorAll("input, select, textarea");
    const exemptTypes = new Set(["hidden", "submit", "button", "reset", "image"]);

    controls.forEach((el) => {
      if (!isElementVisible(el)) return;
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute("type") || "text").toLowerCase();

      if (tag === "input" && exemptTypes.has(type)) return;

      const idAttr = el.id;
      let hasLabel = false;
      let labelMethod = "";

      // 1. ARIA label or labelledby
      if (el.getAttribute("aria-label")?.trim()) {
        hasLabel = true;
        labelMethod = "aria-label";
      } else if (el.getAttribute("aria-labelledby")?.trim()) {
        const labelEl = document.getElementById(el.getAttribute("aria-labelledby").trim());
        if (labelEl && (labelEl.innerText || labelEl.textContent || "").trim()) {
          hasLabel = true;
          labelMethod = "aria-labelledby";
        }
      }

      // 2. <label for="...">
      if (!hasLabel && idAttr) {
        const matchingLabel = document.querySelector(`label[for="${CSS.escape(idAttr)}"]`);
        if (matchingLabel && (matchingLabel.innerText || matchingLabel.textContent || "").trim()) {
          hasLabel = true;
          labelMethod = "label-for";
        }
      }

      // 3. Wrapping <label>
      if (!hasLabel) {
        const parentLabel = el.closest("label");
        if (parentLabel && (parentLabel.innerText || parentLabel.textContent || "").trim()) {
          hasLabel = true;
          labelMethod = "parent-label";
        }
      }

      // 4. Title attribute (fallback)
      if (!hasLabel && el.getAttribute("title")?.trim()) {
        hasLabel = true;
        labelMethod = "title";
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
    const buttons = document.querySelectorAll("button, [role='button'], input[type='button'], input[type='submit']");
    buttons.forEach((btn) => {
      if (!isElementVisible(btn)) return;
      const text = (btn.innerText || btn.textContent || "").trim();
      const ariaLabel = btn.getAttribute("aria-label")?.trim();
      const ariaLabelledby = btn.getAttribute("aria-labelledby")?.trim();
      const title = btn.getAttribute("title")?.trim();
      const value = btn.getAttribute("value")?.trim();
      const imgAlt = btn.querySelector("img")?.getAttribute("alt")?.trim();

      if (!text && !ariaLabel && !ariaLabelledby && !title && !value && !imgAlt) {
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
    const links = document.querySelectorAll("a[href]");
    const genericPhrases = new Set([
      "click here", "click", "here", "read more", "more", "learn more", "link", "view", "details", "info", "continue"
    ]);

    links.forEach((a) => {
      if (!isElementVisible(a)) return;

      const text = (a.innerText || a.textContent || "").trim().toLowerCase();
      const ariaLabel = (a.getAttribute("aria-label") || "").trim().toLowerCase();
      const effectiveText = ariaLabel || text;
      const href = a.getAttribute("href")?.trim();

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
          how_to_fix: `Update the link text to describe its destination (e.g. "Read more about our pricing plans") or add aria-label="Read more about ...".`,
          wcag_criteria: "2.4.4 Link Purpose (In Context) (Level A)",
        });
      }

      if (href === "#" || href === "javascript:void(0)" || href === "javascript:;") {
        if (!a.getAttribute("role")) {
          issues.push({
            rule_id: "link-fake-button",
            category: "navigation",
            severity: "minor",
            element_id: id,
            element: getReadableSnippet(a),
            selector: generateSelector(a),
            message: 'Anchor tag is used as a button (`href="#"` or javascript: pseudo-protocol) without button semantics.',
            how_to_fix: 'Replace with a native <button type="button"> or add role="button" and keyboard handler.',
            wcag_criteria: "4.1.2 Name, Role, Value",
          });
        }
      }
    });
  }

  function auditContrast(issues) {
    // Audit text nodes across key elements
    const candidates = document.querySelectorAll(
      "p, span, h1, h2, h3, h4, h5, h6, a, button, label, li, td, th, blockquote"
    );

    let contrastIssuesFound = 0;
    const maxContrastIssues = 25; // prevent flooding on bad CSS pages

    for (let i = 0; i < candidates.length; i++) {
      if (contrastIssuesFound >= maxContrastIssues) break;
      const el = candidates[i];

      // Only check elements with direct text
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

      // Check if text is large (>= 18pt / 24px, or >= 14pt / 18.66px bold)
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
          message: `Text contrast ratio is ${ratio.toFixed(2)}:1 (Text: ${fgHex} on Background: ${bgHex}). Minimum required is ${requiredRatio}:1.`,
          how_to_fix: `Adjust text color or background color to achieve at least ${requiredRatio}:1 contrast ratio.`,
          wcag_criteria: "1.4.3 Contrast (Minimum) (Level AA)",
        });
      }
    }
  }

  function auditDocumentMeta(issues) {
    // 1. html lang
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

    // 2. document title
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

    // 3. Viewport zoom disabled
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
          message: "Viewport meta disables pinch-to-zoom (user-scalable=no or maximum-scale=1). Visually impaired users cannot zoom in.",
          how_to_fix: "Remove user-scalable=no and maximum-scale constraints from <meta name=\"viewport\">.",
          wcag_criteria: "1.4.4 Resize Text (Level AA)",
        });
      }
    }

    // 4. Positive tabindex
    const positiveTabindexes = document.querySelectorAll("[tabindex]");
    positiveTabindexes.forEach((el) => {
      const tabVal = parseInt(el.getAttribute("tabindex"), 10);
      if (tabVal > 0) {
        const id = getUniqueLanternId();
        el.setAttribute("data-lantern-id", id);
        issues.push({
          rule_id: "keyboard-positive-tabindex",
          category: "navigation",
          severity: "serious",
          element_id: id,
          element: getReadableSnippet(el),
          selector: generateSelector(el),
          message: `Element has positive tabindex="${tabVal}". Positive tab indices break standard keyboard navigation order.`,
          how_to_fix: "Set tabindex=\"0\" to place it in natural tab order, or use standard semantic interactive elements.",
          wcag_criteria: "2.4.3 Focus Order (Level A)",
        });
      }
    });
  }

  // ── Calculate Accessibility Health Score ────────────────────────
  function calculateScore(issues) {
    let score = 100;
    const deductions = {
      critical: 12,
      serious: 6,
      moderate: 3,
      minor: 1,
    };
    for (const issue of issues) {
      score -= deductions[issue.severity] || 2;
    }
    score = Math.max(0, Math.min(100, score));

    let grade = "A";
    if (score < 60) grade = "F";
    else if (score < 70) grade = "D";
    else if (score < 80) grade = "C";
    else if (score < 90) grade = "B";

    return { score, grade };
  }

  // ── MAIN RUNNER ─────────────────────────────────────────────────
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

  // ── Message Listener ────────────────────────────────────────────
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

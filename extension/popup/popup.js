/**
 * Lantern – Advanced Accessibility Evaluation Controller (WAVE-Inspired)
 *
 * Manages:
 * - 5 WAVE Tabs: Details, Reference, Order, Structure, Contrast
 * - Dynamic Domain detection & Styles ON/OFF Toggle
 * - Interactive In-Page Highlighting & Order Pins
 * - Rule Reference Encyclopedia with Bad vs Good HTML snippets
 * - Automated Contrast Color Corrections & CSV Export
 */

let currentReport = null;
let activeTabId = null;
let currentHostname = "current page";
let currentWaveTab = "details";
let currentDetailsCategory = "all";
let detailsSearchKeyword = "";
let referenceSearchKeyword = "";
let areHighlightsVisible = true;
let areOrderPinsVisible = true;
let currentOrderIndex = 0;

// ── WCAG Reference Rulebook Encyclopedia (Complete 18 Criteria) ───────
const RULE_ENCYCLOPEDIA = [
  {
    id: "img-alt-missing",
    name: "Missing Alternative Text on Image",
    category: "images",
    severity: "critical",
    wcagCode: "WCAG 1.1.1 (A)",
    wcag: "1.1.1 Non-text Content (Level A)",
    problem: "The <img> element has no `alt` attribute.",
    why: "Screen reader users cannot perceive images without alternative text. The screen reader may read out the raw file URL instead, which is confusing and unhelpful.",
    impact: "Blind and low-vision users cannot understand the meaning, function, or context of visual content on the page.",
    fix: 'Add a descriptive alt attribute, e.g. alt="Company founder giving keynote speech". If the image is purely decorative, specify alt="".',
    badHtml: '<img src="/assets/hero-banner.jpg">',
    goodHtml: '<img src="/assets/hero-banner.jpg" alt="Team collaborating in a modern office space">',
  },
  {
    id: "img-alt-empty-link",
    name: "Empty Image Alt in Standalone Link",
    category: "images",
    severity: "critical",
    wcagCode: "WCAG 1.1.1 / 2.4.4 (A)",
    wcag: "1.1.1 Non-text Content / 2.4.4 Link Purpose (Level A)",
    problem: 'An image inside a link has alt="" but no accompanying link text.',
    why: "Because alt is empty, screen readers treat the image as decorative. But since there is no other text inside the <a>, the entire link has no accessible name.",
    impact: "Screen reader users encounter an unnamed link and cannot know where it leads without clicking it blindly.",
    fix: 'Provide descriptive alt text that explains the destination of the link, e.g. alt="Go to Homepage".',
    badHtml: '<a href="/home"><img src="logo.png" alt=""></a>',
    goodHtml: '<a href="/home"><img src="logo.png" alt="Lantern Homepage"></a>',
  },
  {
    id: "img-alt-uninformative",
    name: "Uninformative or Placeholder Alt Text",
    category: "images",
    severity: "moderate",
    wcagCode: "WCAG 1.1.1 (A)",
    wcag: "1.1.1 Non-text Content (Level A)",
    problem: 'Image alt text contains generic words like "image", "photo", "icon", or just a file name.',
    why: "Screen readers already announce that an element is a graphic or image. Repeating words like 'photo of' or 'banner.png' adds noise without conveying information.",
    impact: "Users are forced to listen to redundant and useless text rather than understanding what the image depicts.",
    fix: "Replace placeholder words with specific descriptive information about the subject and purpose of the visual.",
    badHtml: '<img src="chart.png" alt="graphic.png">',
    goodHtml: '<img src="chart.png" alt="Bar chart showing 35% increase in user retention in Q3">',
  },
  {
    id: "svg-missing-accessible-name",
    name: "SVG Graphic Without Accessible Name",
    category: "images",
    severity: "moderate",
    wcagCode: "WCAG 1.1.1 (A)",
    wcag: "1.1.1 Non-text Content (Level A)",
    problem: "An inline <svg> element conveys visual meaning but lacks a <title>, aria-label, or aria-labelledby attribute.",
    why: "Screen readers skip inline SVGs or announce them as unlabelled objects unless an accessible name is explicitly defined.",
    impact: "Users with visual impairments cannot determine the meaning or function of charts, diagrams, or icon graphics.",
    fix: 'Add aria-label="Descriptive name", or include a <title> child element inside the <svg>. If purely decorative, mark with aria-hidden="true".',
    badHtml: '<svg viewBox="0 0 24 24"><path d="..."/></svg>',
    goodHtml: '<svg viewBox="0 0 24 24" aria-label="Satisfaction rating" role="img">\n  <title>Customer Satisfaction</title>\n  <path d="..."/>\n</svg>',
  },
  {
    id: "form-label-missing",
    name: "Missing Accessible Form Label",
    category: "forms",
    severity: "critical",
    wcagCode: "WCAG 1.3.1 / 3.3.2 (A)",
    wcag: "1.3.1 Info and Relationships / 3.3.2 Labels or Instructions (Level A)",
    problem: "A form control (<input>, <select>, <textarea>) is not associated with an accessible label.",
    why: "Assistive technologies cannot announce the purpose of an input field unless it is linked to a visible <label> or has an ARIA label.",
    impact: "Blind users navigating form fields using Tab will only hear 'edit text' or 'input' with no clue what information to enter.",
    fix: 'Use a <label for="field-id"> with matching id, wrap the control in a <label>, or provide aria-label="Label".',
    badHtml: '<input type="text" id="email">',
    goodHtml: '<label for="email">Email Address</label>\n<input type="email" id="email">',
  },
  {
    id: "form-label-placeholder-only",
    name: "Placeholder Used as Sole Label",
    category: "forms",
    severity: "serious",
    wcagCode: "WCAG 3.3.2 (A)",
    wcag: "3.3.2 Labels or Instructions (Level A)",
    problem: "A form input relies exclusively on the placeholder attribute instead of a permanent label.",
    why: "Placeholders disappear as soon as the user starts typing, making it difficult for users to review their inputs. Placeholders also commonly fail color contrast standards.",
    impact: "Users with cognitive impairments or memory limitations lose context while typing.",
    fix: "Provide a persistent visible <label> above or beside the input field in addition to or instead of the placeholder.",
    badHtml: '<input type="text" placeholder="Enter your full name">',
    goodHtml: '<label for="fullname">Full Name</label>\n<input type="text" id="fullname" placeholder="e.g. Jane Doe">',
  },
  {
    id: "button-missing-accessible-name",
    name: "Button Without Accessible Name",
    category: "forms",
    severity: "critical",
    wcagCode: "WCAG 4.1.2 (A)",
    wcag: "4.1.2 Name, Role, Value (Level A)",
    problem: "A button element contains no readable text, accessible label, or icon alt description.",
    why: "Icon-only buttons (such as search magnifying glasses or hamburger menu bars) have no default text content.",
    impact: "Screen reader users hear 'button' with no indication of what clicking it will do.",
    fix: 'Add visible text, an aria-label="Action description", or alt text to the icon SVG/image.',
    badHtml: '<button class="btn-search"><svg>...</svg></button>',
    goodHtml: '<button class="btn-search" aria-label="Search site">\n  <svg aria-hidden="true">...</svg>\n</button>',
  },
  {
    id: "link-empty",
    name: "Empty Link Without Text",
    category: "navigation",
    severity: "critical",
    wcagCode: "WCAG 2.4.4 (A)",
    wcag: "2.4.4 Link Purpose (In Context) (Level A)",
    problem: "An anchor <a> has an href attribute but no discernible text or accessible label.",
    why: "Links must convey their purpose so users can decide whether to follow them.",
    impact: "Assistive technologies announce 'link' or read raw URLs, leaving users stranded.",
    fix: 'Include descriptive text inside the link or add an aria-label="Destination description".',
    badHtml: '<a href="/settings"><span class="gear-icon"></span></a>',
    goodHtml: '<a href="/settings" aria-label="Account Settings">\n  <span class="gear-icon" aria-hidden="true"></span>\n</a>',
  },
  {
    id: "link-generic-text",
    name: "Generic or Ambiguous Link Text",
    category: "navigation",
    severity: "serious",
    wcagCode: "WCAG 2.4.4 (A)",
    wcag: "2.4.4 Link Purpose (In Context) (Level A)",
    problem: 'Link uses generic text such as "click here", "read more", "link", or "details".',
    why: "Screen reader users often browse pages by listening to a list of all links out of context.",
    impact: "Hearing twenty links that all say 'click here' makes navigation frustrating and impossible.",
    fix: 'Specify the specific topic in the link text or provide aria-label="Read more about our Q3 report".',
    badHtml: '<p>Learn about our pricing. <a href="/pricing">Click here</a></p>',
    goodHtml: '<p>Learn about our <a href="/pricing">pricing plans and options</a>.</p>',
  },
  {
    id: "contrast-low",
    name: "Low Text Color Contrast",
    category: "contrast",
    severity: "serious",
    wcagCode: "WCAG 1.4.3 (AA)",
    wcag: "1.4.3 Contrast (Minimum) (Level AA)",
    problem: "The contrast ratio between text foreground and its background is below the required 4.5:1 ratio (or 3:1 for large text).",
    why: "Sufficient visual contrast is vital for text readability across various lighting conditions and visual abilities.",
    impact: "Users with low vision, color blindness, or aging vision cannot comfortably read low-contrast text.",
    fix: "Darken the text color on light backgrounds or lighten the text color on dark backgrounds.",
    badHtml: '<!-- Contrast: 2.1:1 -->\n<p style="color: #94a3b8; background: #ffffff;">Light grey text</p>',
    goodHtml: '<!-- Contrast: 4.6:1 -->\n<p style="color: #475569; background: #ffffff;">Dark slate text</p>',
  },
  {
    id: "heading-missing-all",
    name: "No Headings Found on Webpage",
    category: "headings",
    severity: "serious",
    wcagCode: "WCAG 1.3.1 (A)",
    wcag: "1.3.1 Info and Relationships (Level A)",
    problem: "The webpage does not contain any heading tags (<h1> through <h6>).",
    why: "Headings allow assistive technology users to scan and jump between major document sections without reading every word linearly.",
    impact: "Users cannot quickly comprehend page organization or navigate to desired sections.",
    fix: "Structure document content into hierarchical sections using semantic <h1>, <h2>, and <h3> heading tags.",
    badHtml: '<div class="big-title">Welcome to Our Platform</div>\n<div class="section-title">Features</div>',
    goodHtml: '<h1>Welcome to Our Platform</h1>\n<h2>Key Features</h2>',
  },
  {
    id: "heading-missing-h1",
    name: "Missing Level 1 Heading (H1)",
    category: "headings",
    severity: "serious",
    wcagCode: "WCAG 1.3.1 (A)",
    wcag: "1.3.1 Info and Relationships (Level A)",
    problem: "The webpage does not have an <h1> heading.",
    why: "The <h1> serves as the primary landmark identifying the topic of the entire webpage.",
    impact: "Screen reader users cannot quickly verify they have navigated to the correct page or understand its main theme.",
    fix: "Add a meaningful <h1> heading at the start of the main content region.",
    badHtml: '<div class="banner"><h3>Welcome to Store</h3></div>',
    goodHtml: '<main>\n  <h1>Online Bakery Store</h1>\n  <h2>Fresh Pastries Today</h2>\n</main>',
  },
  {
    id: "heading-empty",
    name: "Empty Heading Tag Without Content",
    category: "headings",
    severity: "moderate",
    wcagCode: "WCAG 1.3.1 (A)",
    wcag: "1.3.1 Info and Relationships (Level A)",
    problem: "A heading tag (<h1-h6>) is present in the DOM but contains no text or accessible content.",
    why: "Screen readers announce headings during outline navigation. Empty headings announce a level with silence.",
    impact: "Users are left confused, wondering if content failed to load or if the page is broken.",
    fix: "Provide concise text describing the following section, or remove the empty heading element.",
    badHtml: '<h2></h2>',
    goodHtml: '<h2>User Profile Settings</h2>',
  },
  {
    id: "heading-order-skip",
    name: "Skipped Heading Level Hierarchy",
    category: "headings",
    severity: "moderate",
    wcagCode: "WCAG 1.3.1 (A)",
    wcag: "1.3.1 Info and Relationships (Level A)",
    problem: "A heading level jumped (e.g. from <h1> directly to <h3>, skipping <h2>).",
    why: "Headings form an outline structure. Skipping levels confuses screen reader navigation hierarchies.",
    impact: "Users may assume they missed an entire section of content.",
    fix: "Adjust heading tags so levels increase incrementally by one level at a time (H1 -> H2 -> H3).",
    badHtml: '<h1>Account Profile</h1>\n<h3>Personal Details</h3> <!-- Skipped H2 -->',
    goodHtml: '<h1>Account Profile</h1>\n<h2>Personal Details</h2>',
  },
  {
    id: "tabindex-positive",
    name: "Positive Tabindex Value",
    category: "navigation",
    severity: "serious",
    wcagCode: "WCAG 2.4.3 (A)",
    wcag: "2.4.3 Focus Order (Level A)",
    problem: 'An element has a positive tabindex attribute (e.g. tabindex="1" or "2").',
    why: "Positive tabindex values override natural document flow, causing focus to jump unpredictably across the page.",
    impact: "Keyboard users experience disorienting focus jumps that do not match the visual reading order.",
    fix: 'Use tabindex="0" to insert custom elements into natural document tab flow, or remove tabindex if element is naturally focusable.',
    badHtml: '<button tabindex="3">Submit</button>\n<input tabindex="1" name="first_name">',
    goodHtml: '<input name="first_name">\n<button type="submit">Submit</button>',
  },
  {
    id: "doc-missing-lang",
    name: "Missing Document Language Attribute",
    category: "structure",
    severity: "serious",
    wcagCode: "WCAG 3.1.1 (A)",
    wcag: "3.1.1 Language of Page (Level A)",
    problem: "The <html> element does not have a `lang` attribute.",
    why: "Screen readers use the language tag to load the correct speech synthesizer pronunciation rules.",
    impact: "Content may be pronounced using the wrong language phonetics, making text unintelligible.",
    fix: 'Add the primary language code to the root HTML element, e.g. <html lang="en">.',
    badHtml: '<html>\n  <head>...',
    goodHtml: '<html lang="en">\n  <head>...',
  },
  {
    id: "doc-missing-title",
    name: "Missing Document Page Title",
    category: "structure",
    severity: "serious",
    wcagCode: "WCAG 2.4.2 (A)",
    wcag: "2.4.2 Page Titled (Level A)",
    problem: "The <title> tag is missing inside <head> or is empty.",
    why: "The title is the first piece of information announced when a page loads and appears in browser tabs and search results.",
    impact: "Users with screen readers, multiple tabs, or cognitive disabilities cannot identify the active page.",
    fix: "Add a concise, descriptive <title> in <head>, e.g. <title>Dashboard – Lantern</title>.",
    badHtml: '<head>\n  <!-- Missing <title> -->\n</head>',
    goodHtml: '<head>\n  <title>Account Settings | MyApp</title>\n</head>',
  },
  {
    id: "viewport-zoom-disabled",
    name: "Pinch to Zoom Disabled in Viewport",
    category: "structure",
    severity: "serious",
    wcagCode: "WCAG 1.4.4 (AA)",
    wcag: "1.4.4 Resize Text (Level AA)",
    problem: 'The <meta name="viewport"> tag includes user-scalable=no or maximum-scale=1.',
    why: "Users with visual impairments must be able to zoom into text up to 200% on mobile and touchscreen devices.",
    impact: "Low-vision users cannot enlarge small text or interactive elements.",
    fix: 'Remove user-scalable=no and maximum-scale constraints from <meta name="viewport">.',
    badHtml: '<meta name="viewport" content="width=device-width, user-scalable=no">',
    goodHtml: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  },
];

// ── DOM References ──────────────────────────────────────────────────
let siteBadgeEl, welcomeSiteNameEl, startScanBtn, rescanBtn, resetViewBtn;
let stylesToggle, stylesToggleLabel;
let initialStateEl, loadingStateEl, loadingStepMsgEl, resultsDashboardEl;
let scoreValEl, scoreGradeEl, scoreTitleEl, statsSummaryEl;
let countCriticalEl, countSeriousEl, countModerateEl, countMinorEl;
let toggleHighlightsBtn, exportCsvBtn, detailsSearchInput;
let currentTabFavicon = "";

// ── Update Scanned Website Logo & Favicons ───────────────────────────
function updateWebsiteLogos(hostname, rawFavicon) {
  const logoImg = document.getElementById("scanned-site-logo");
  const fallbackBox = document.getElementById("scanned-site-fallback");
  const inlineFavicon = document.getElementById("stats-site-favicon");
  const headerFavicon = document.getElementById("header-site-favicon");
  const welcomeFavicon = document.getElementById("welcome-site-favicon");

  const cleanHost = (hostname || "").trim().toLowerCase();
  const isWebDomain = cleanHost && !cleanHost.includes("local") && cleanHost.includes(".");

  // 1. Determine best candidate URL
  let primaryUrl = "";
  if (rawFavicon && typeof rawFavicon === "string" && (rawFavicon.startsWith("http") || rawFavicon.startsWith("data:"))) {
    primaryUrl = rawFavicon;
  } else if (isWebDomain) {
    primaryUrl = `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=128`;
  }

  const googleFallbackUrl = isWebDomain ? `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=128` : "";

  if (primaryUrl) {
    // Score hero main logo emblem (44x44 card)
    if (logoImg) {
      logoImg.src = primaryUrl;
      logoImg.classList.remove("hidden");
      if (fallbackBox) fallbackBox.classList.add("hidden");

      logoImg.onerror = () => {
        if (googleFallbackUrl && logoImg.src !== googleFallbackUrl) {
          logoImg.src = googleFallbackUrl;
        } else {
          logoImg.classList.add("hidden");
          if (fallbackBox) fallbackBox.classList.remove("hidden");
        }
      };
    }

    // Inline favicon next to domain in score summary
    if (inlineFavicon) {
      inlineFavicon.src = primaryUrl;
      inlineFavicon.classList.remove("hidden");
      inlineFavicon.onerror = () => {
        if (googleFallbackUrl && inlineFavicon.src !== googleFallbackUrl) {
          inlineFavicon.src = googleFallbackUrl;
        } else {
          inlineFavicon.classList.add("hidden");
        }
      };
    }

    // Top header site badge favicon
    if (headerFavicon) {
      headerFavicon.src = primaryUrl;
      headerFavicon.classList.remove("hidden");
      headerFavicon.onerror = () => {
        if (googleFallbackUrl && headerFavicon.src !== googleFallbackUrl) {
          headerFavicon.src = googleFallbackUrl;
        } else {
          headerFavicon.classList.add("hidden");
        }
      };
    }

    // Welcome screen favicon
    if (welcomeFavicon) {
      welcomeFavicon.src = primaryUrl;
      welcomeFavicon.classList.remove("hidden");
      welcomeFavicon.onerror = () => {
        if (googleFallbackUrl && welcomeFavicon.src !== googleFallbackUrl) {
          welcomeFavicon.src = googleFallbackUrl;
        } else {
          welcomeFavicon.classList.add("hidden");
        }
      };
    }
  } else {
    // If no logo available (e.g. file:// or invalid host)
    if (logoImg) logoImg.classList.add("hidden");
    if (fallbackBox) fallbackBox.classList.remove("hidden");
    if (inlineFavicon) inlineFavicon.classList.add("hidden");
    if (headerFavicon) headerFavicon.classList.add("hidden");
    if (welcomeFavicon) welcomeFavicon.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Grab DOM elements
  siteBadgeEl = document.getElementById("site-badge");
  welcomeSiteNameEl = document.getElementById("welcome-site-name");
  startScanBtn = document.getElementById("start-scan-btn");
  rescanBtn = document.getElementById("rescan-btn");
  resetViewBtn = document.getElementById("reset-view-btn");
  stylesToggle = document.getElementById("styles-toggle");
  stylesToggleLabel = document.getElementById("styles-toggle-label");

  initialStateEl = document.getElementById("initial-state");
  loadingStateEl = document.getElementById("loading-state");
  loadingStepMsgEl = document.getElementById("loading-step-msg");
  resultsDashboardEl = document.getElementById("results-dashboard");

  scoreValEl = document.getElementById("score-val");
  scoreGradeEl = document.getElementById("score-grade");
  scoreTitleEl = document.getElementById("score-title");
  statsSummaryEl = document.getElementById("stats-summary");

  countCriticalEl = document.getElementById("count-critical");
  countSeriousEl = document.getElementById("count-serious");
  countModerateEl = document.getElementById("count-moderate");
  countMinorEl = document.getElementById("count-minor");

  toggleHighlightsBtn = document.getElementById("toggle-highlights-btn");
  exportCsvBtn = document.getElementById("export-csv-btn");
  detailsSearchInput = document.getElementById("details-search-input");

  // Determine active tab URL and tab favicon
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    currentTabFavicon = tab.favIconUrl || "";
    try {
      const urlObj = new URL(tab.url || "");
      currentHostname = urlObj.hostname || "local page";
    } catch (e) {
      currentHostname = "local page";
    }
  }

  const headerDomainEl = document.getElementById("header-site-domain");
  if (headerDomainEl) headerDomainEl.textContent = currentHostname;
  if (welcomeSiteNameEl) welcomeSiteNameEl.textContent = currentHostname;

  // Initialize logos across header and welcome screen
  updateWebsiteLogos(currentHostname, currentTabFavicon);

  // Scan triggers
  startScanBtn.addEventListener("click", triggerScan);
  rescanBtn.addEventListener("click", triggerScan);

  // Return to start screen
  resetViewBtn.addEventListener("click", () => {
    resultsDashboardEl.classList.add("hidden");
    loadingStateEl.classList.add("hidden");
    initialStateEl.classList.remove("hidden");
    rescanBtn.classList.add("hidden");
    resetViewBtn.classList.add("hidden");
    document.getElementById("more-details-header-btn")?.classList.add("hidden");
  });

  // "More Details" Expanded Dashboard Redirect Triggers
  const moreDetailsHeaderBtn = document.getElementById("more-details-header-btn");
  const moreDetailsHeroBtn = document.getElementById("more-details-hero-btn");
  const moreDetailsRefBtn = document.getElementById("more-details-ref-btn");

  [moreDetailsHeaderBtn, moreDetailsHeroBtn, moreDetailsRefBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", openExpandedWebDashboard);
    }
  });

  // Restore current Styles toggle state for active tab
  const storageArea = chrome.storage.session || chrome.storage.local;
  if (storageArea && activeTabId) {
    storageArea.get([`styles_state_${activeTabId}`], (result) => {
      if (result && result[`styles_state_${activeTabId}`] !== undefined) {
        const isEnabled = Boolean(result[`styles_state_${activeTabId}`]);
        stylesToggle.checked = isEnabled;
        stylesToggleLabel.textContent = isEnabled ? "Styles ON" : "Styles OFF";
      }
    });
  }

  // Styles ON/OFF Toggle
  stylesToggle.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    stylesToggleLabel.textContent = enabled ? "Styles ON" : "Styles OFF";
    if (activeTabId) {
      chrome.runtime.sendMessage({
        action: "toggle-styles",
        tabId: activeTabId,
        enable: enabled,
      });
    }
  });

  // 5 WAVE Navigation Tabs
  document.querySelectorAll(".wave-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".wave-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentWaveTab = btn.getAttribute("data-tab");
      switchWaveTab(currentWaveTab);
    });
  });

  // Details Category Cards click
  document.querySelectorAll(".wave-cat-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".wave-cat-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      currentDetailsCategory = card.getAttribute("data-cat");
      renderDetailsItems();
    });
  });

  // Details Search input
  detailsSearchInput.addEventListener("input", (e) => {
    detailsSearchKeyword = e.target.value.trim().toLowerCase();
    renderDetailsItems();
  });

  // Reference Search input
  const refSearchInput = document.getElementById("reference-search-input");
  if (refSearchInput) {
    refSearchInput.addEventListener("input", (e) => {
      referenceSearchKeyword = e.target.value.trim().toLowerCase();
      renderReferenceRulebook();
    });
  }

  // Scope Filter buttons (Detected on this page vs All rules library)
  const scopeDetectedBtn = document.getElementById("ref-scope-detected-btn");
  const scopeAllBtn = document.getElementById("ref-scope-all-btn");
  if (scopeDetectedBtn) {
    scopeDetectedBtn.addEventListener("click", () => setReferenceScope("detected"));
  }
  if (scopeAllBtn) {
    scopeAllBtn.addEventListener("click", () => setReferenceScope("all"));
  }

  // Toggle Overlays on page
  toggleHighlightsBtn.addEventListener("click", () => {
    areHighlightsVisible = !areHighlightsVisible;
    toggleHighlightsBtn.classList.toggle("active", areHighlightsVisible);
    const labelSpan = toggleHighlightsBtn.querySelector(".btn-label");
    if (labelSpan) {
      labelSpan.textContent = areHighlightsVisible ? "Outlines" : "Hidden";
    }

    if (activeTabId) {
      chrome.runtime.sendMessage({
        action: "toggle-highlights",
        tabId: activeTabId,
        visible: areHighlightsVisible,
      });
    }
  });

  // Order Tab Stepper & Toggle
  const orderPrevBtn = document.getElementById("order-prev-btn");
  const orderNextBtn = document.getElementById("order-next-btn");
  const orderToggleBadgesBtn = document.getElementById("order-toggle-badges-btn");

  if (orderPrevBtn) {
    orderPrevBtn.addEventListener("click", () => {
      if (!currentReport?.focus_order?.length) return;
      currentOrderIndex = Math.max(1, currentOrderIndex - 1);
      stepToOrderItem(currentOrderIndex);
    });
  }

  if (orderNextBtn) {
    orderNextBtn.addEventListener("click", () => {
      if (!currentReport?.focus_order?.length) return;
      currentOrderIndex = Math.min(currentReport.focus_order.length, currentOrderIndex + 1);
      stepToOrderItem(currentOrderIndex);
    });
  }

  if (orderToggleBadgesBtn) {
    orderToggleBadgesBtn.addEventListener("click", () => {
      areOrderPinsVisible = !areOrderPinsVisible;
      orderToggleBadgesBtn.classList.toggle("active", areOrderPinsVisible);
      const label = document.getElementById("order-toggle-label");
      if (label) label.textContent = areOrderPinsVisible ? "Pins: ON" : "Pins: OFF";

      if (activeTabId) {
        if (areOrderPinsVisible) {
          chrome.runtime.sendMessage({
            action: "show-focus-order",
            tabId: activeTabId,
            items: currentReport?.focus_order || [],
          });
        } else {
          chrome.runtime.sendMessage({
            action: "hide-focus-order",
            tabId: activeTabId,
          });
        }
      }
    });
  }

  // Export CSV
  exportCsvBtn.addEventListener("click", exportResultsToCSV);

  // Initial render of reference tab
  renderReferenceRulebook();
});

// ── Switch between 5 WAVE Tabs ──────────────────────────────────────
function switchWaveTab(tabName) {
  document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.add("hidden"));
  const target = document.getElementById(`tab-content-${tabName}`);
  if (target) {
    target.classList.remove("hidden");
  }

  if (tabName === "order") {
    renderOrderTab();
    if (areOrderPinsVisible && activeTabId && currentReport?.focus_order) {
      chrome.runtime.sendMessage({
        action: "show-focus-order",
        tabId: activeTabId,
        items: currentReport.focus_order,
      });
    }
  } else if (tabName === "structure") {
    renderStructureTab();
  } else if (tabName === "contrast") {
    renderContrastTab();
  } else if (tabName === "reference") {
    renderReferenceRulebook();
  } else if (tabName === "details") {
    renderDetailsItems();
  }
}

// ── Trigger Scan ────────────────────────────────────────────────────
async function triggerScan() {
  if (!activeTabId) return;

  initialStateEl.classList.add("hidden");
  resultsDashboardEl.classList.add("hidden");
  loadingStateEl.classList.remove("hidden");

  let step = 0;
  const steps = [
    "Traversing live DOM nodes and shadow roots…",
    "Computing relative luminance & color contrast ratios…",
    "Checking form labels and interactive controls…",
    "Verifying heading hierarchy and document landmarks…",
    "Building sequential keyboard focus order…",
  ];
  const stepInterval = setInterval(() => {
    step = (step + 1) % steps.length;
    if (loadingStepMsgEl) loadingStepMsgEl.textContent = steps[step];
  }, 400);

  chrome.runtime.sendMessage(
    { action: "scan-page", tabId: activeTabId },
    (response) => {
      clearInterval(stepInterval);
      loadingStateEl.classList.add("hidden");

      if (!response || !response.success) {
        initialStateEl.classList.remove("hidden");
        const msg = response?.error || "Could not complete scan.";
        alert(`Audit Error: ${msg}`);
        return;
      }

      currentReport = response.data;
      renderDashboard(currentReport);

      // Reveal header controls
      rescanBtn.classList.remove("hidden");
      resetViewBtn.classList.remove("hidden");
      document.getElementById("more-details-header-btn")?.classList.remove("hidden");
    }
  );
}

// ── Render Dashboard Summary ────────────────────────────────────────
function renderDashboard(report) {
  resultsDashboardEl.classList.remove("hidden");

  // Score hero
  const score = report.score ?? 100;
  const grade = report.grade ?? "A";
  scoreValEl.textContent = score;
  scoreGradeEl.textContent = grade;
  scoreGradeEl.className = `grade-badge grade-${grade.toLowerCase()}`;

  if (score >= 90) scoreTitleEl.textContent = "Excellent Accessibility";
  else if (score >= 80) scoreTitleEl.textContent = "Good Accessibility";
  else if (score >= 70) scoreTitleEl.textContent = "Needs Attention";
  else scoreTitleEl.textContent = "Significant Accessibility Barriers";

  const issuesPrefixEl = document.getElementById("stats-summary-prefix");
  const statsDomainEl = document.getElementById("stats-site-domain");
  if (issuesPrefixEl) issuesPrefixEl.textContent = `Found ${report.total_issues} issue(s) on`;
  if (statsDomainEl) statsDomainEl.textContent = report.hostname || currentHostname;

  // Update website logo avatar and favicons
  updateWebsiteLogos(report.hostname || currentHostname, report.favicon_url || currentTabFavicon);

  const durationTextEl = document.getElementById("audit-duration-text");
  if (durationTextEl) durationTextEl.textContent = `${report.duration_ms || 24}ms`;

  // Severity pill counts
  countCriticalEl.textContent = report.summary?.critical || 0;
  countSeriousEl.textContent = report.summary?.serious || 0;
  countModerateEl.textContent = report.summary?.moderate || 0;
  countMinorEl.textContent = report.summary?.minor || 0;

  // Category counts in Tab 1 (with bulletproof fallback)
  const cats = report.details_categories || {};
  const issues = report.issues || [];
  const features = report.features || [];

  const errorsList = cats.errors?.length ? cats.errors : issues.filter(i => i.wave_category === "errors" || i.severity === "critical");
  const contrastList = cats.contrast_errors?.length ? cats.contrast_errors : issues.filter(i => i.wave_category === "contrast_errors" || i.category === "contrast");
  const alertsList = cats.alerts?.length ? cats.alerts : issues.filter(i => (i.wave_category === "alerts" || i.severity === "serious" || i.severity === "moderate") && i.category !== "contrast" && i.severity !== "critical");
  const featuresList = features.length ? features : issues.filter(i => i.severity === "feature" || i.wave_category === "features");

  document.getElementById("count-all-issues").textContent = report.total_issues || issues.length;
  document.getElementById("count-cat-errors").textContent = errorsList.length;
  document.getElementById("count-cat-contrast").textContent = contrastList.length;
  document.getElementById("count-cat-alerts").textContent = alertsList.length;
  document.getElementById("count-cat-features").textContent = featuresList.length;
  document.getElementById("count-cat-structure").textContent = report.structure_tree?.length || 0;
  document.getElementById("count-cat-aria").textContent = report.aria_elements?.length || 0;

  // Set reference scope dynamically based on findings
  currentReferenceScope = (report.total_issues > 0) ? "detected" : "all";
  updateReferenceScopeButtons();

  // Render active tab view
  switchWaveTab(currentWaveTab);
}

// ── TAB 1: DETAILS ITEM LIST ────────────────────────────────────────
function renderDetailsItems() {
  if (!currentReport) return;

  const listEl = document.getElementById("details-item-list");
  const emptyMsgEl = document.getElementById("empty-filter-msg");
  listEl.innerHTML = "";

  const cats = currentReport.details_categories || {};
  const issues = currentReport.issues || [];
  const features = currentReport.features || [];

  const errorsList = cats.errors?.length ? cats.errors : issues.filter(i => i.wave_category === "errors" || i.severity === "critical");
  const contrastList = cats.contrast_errors?.length ? cats.contrast_errors : issues.filter(i => i.wave_category === "contrast_errors" || i.category === "contrast");
  const alertsList = cats.alerts?.length ? cats.alerts : issues.filter(i => (i.wave_category === "alerts" || i.severity === "serious" || i.severity === "moderate") && i.category !== "contrast" && i.severity !== "critical");
  const featuresList = features.length ? features : issues.filter(i => i.severity === "feature" || i.wave_category === "features");

  let itemsToRender = [];

  if (currentDetailsCategory === "all") {
    itemsToRender = [...issues, ...featuresList];
  } else if (currentDetailsCategory === "errors") {
    itemsToRender = errorsList;
  } else if (currentDetailsCategory === "contrast_errors") {
    itemsToRender = contrastList;
  } else if (currentDetailsCategory === "alerts") {
    itemsToRender = alertsList;
  } else if (currentDetailsCategory === "features") {
    itemsToRender = featuresList;
  } else if (currentDetailsCategory === "structure") {
    itemsToRender = (currentReport.structure_tree || []).map((s) => ({
      rule_id: `structure-${s.type}`,
      severity: "minor",
      message: `${s.type === "heading" ? `Heading level ${s.level}` : `Landmark <${s.tag}>`}: "${s.text}"`,
      element: s.element,
      element_id: s.element_id,
      how_to_fix: s.skipped_level ? "Heading levels should increase sequentially." : "Semantic structure element.",
      wcag_criteria: "1.3.1 Info and Relationships",
    }));
  } else if (currentDetailsCategory === "aria") {
    itemsToRender = (currentReport.aria_elements || []).map((a) => ({
      rule_id: "aria-attribute",
      severity: "minor",
      message: `Element <${a.tag}> with ARIA markup: ${a.attributes}`,
      element: a.element,
      element_id: a.element_id,
      how_to_fix: "Ensure ARIA state and roles match current DOM behavior.",
      wcag_criteria: "4.1.2 Name, Role, Value",
    }));
  }

  // Filter with search keyword
  if (detailsSearchKeyword) {
    itemsToRender = itemsToRender.filter((item) => {
      const haystack = `${item.rule_id} ${item.message} ${item.element || ""} ${item.how_to_fix || ""}`.toLowerCase();
      return haystack.includes(detailsSearchKeyword);
    });
  }

  if (!itemsToRender.length) {
    emptyMsgEl.classList.remove("hidden");
    return;
  }
  emptyMsgEl.classList.add("hidden");

  for (const item of itemsToRender) {
    const isFeature = item.severity === "feature";
    const li = document.createElement("li");
    li.className = `detail-card ${item.severity || "minor"}`;

    const sevTag = isFeature ? "FEATURE" : (item.severity || "minor").toUpperCase();

    li.innerHTML = `
      <div class="card-header-row">
        <div class="card-tags">
          <span class="card-badge ${item.severity || "minor"}">${sevTag}</span>
          <span class="card-rule-name">${escapeHtml(item.rule_id || "rule")}</span>
        </div>
      </div>
      <p class="card-message">${escapeHtml(item.message || "")}</p>
      ${item.element ? `<div class="card-snippet">${escapeHtml(item.element)}</div>` : ""}
      <div class="card-fix-box">
        <div class="card-fix-title">${isFeature ? "Benefit:" : "Suggested Fix:"}</div>
        <div>${escapeHtml(item.how_to_fix || "")}</div>
      </div>
      <div class="card-footer-row">
        <span class="card-wcag">${item.wcag_criteria ? `WCAG: ${escapeHtml(item.wcag_criteria)}` : ""}</span>
        <div class="card-actions">
          <button class="ref-link-btn" data-rule="${escapeHtml(item.rule_id || "")}" title="View rule explanation, user impact, and WCAG code fixes">📖 Rule Info</button>
          <button class="copy-fix-btn" data-fix="${escapeHtml(item.how_to_fix || "")}">Copy Fix</button>
          ${
            item.element_id
              ? `<button class="inspect-btn" data-id="${item.element_id}">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="22" x2="16.65" y2="16.65"/></svg>
                  Inspect
                </button>`
              : ""
          }
        </div>
      </div>
    `;

    // Rule Info button listener (switches to Reference tab and opens rule)
    const refBtn = li.querySelector(".ref-link-btn");
    if (refBtn) {
      refBtn.addEventListener("click", () => {
        const rid = refBtn.getAttribute("data-rule");
        switchWaveTab("reference");
        document.querySelectorAll(".wave-tab").forEach((b) => b.classList.remove("active"));
        document.querySelector('.wave-tab[data-tab="reference"]')?.classList.add("active");
        currentWaveTab = "reference";
        setReferenceScope("all");
        renderReferenceRulebook(rid);
      });
    }

    // Copy fix listener
    const copyBtn = li.querySelector(".copy-fix-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const text = copyBtn.getAttribute("data-fix");
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = "Copied!";
          setTimeout(() => { copyBtn.textContent = "Copy Fix"; }, 1600);
        });
      });
    }

    // Inspect listener
    const inspectBtn = li.querySelector(".inspect-btn");
    if (inspectBtn) {
      inspectBtn.addEventListener("click", () => {
        const elId = inspectBtn.getAttribute("data-id");
        if (activeTabId && elId) {
          chrome.runtime.sendMessage({
            action: "focus-issue",
            tabId: activeTabId,
            elementId: elId,
          });
        }
      });
    }

    listEl.appendChild(li);
  }
}

// ── TAB 2: DYNAMIC REFERENCE ENCYCLOPEDIA ────────────────────────────
let currentReferenceScope = "detected";

function getCategorySvg(category) {
  switch (category) {
    case "images":
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    case "forms":
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
    case "contrast":
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20a10 10 0 0 0 0-20z" fill="currentColor"/></svg>`;
    case "headings":
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18V6"/><path d="M20 18V6"/></svg>`;
    case "navigation":
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
  }
}

function updateReferenceScopeButtons() {
  document.getElementById("ref-scope-detected-btn")?.classList.toggle("active", currentReferenceScope === "detected");
  document.getElementById("ref-scope-all-btn")?.classList.toggle("active", currentReferenceScope === "all");
}

function setReferenceScope(scope) {
  currentReferenceScope = scope;
  updateReferenceScopeButtons();
  renderReferenceRulebook();
}

function renderReferenceRulebook(targetRuleIdToOpen = null) {
  const container = document.getElementById("reference-rule-list");
  if (!container) return;
  container.innerHTML = "";

  // 1. Gather detected rules and counts from current audit report
  const detectedCounts = {};
  if (currentReport && currentReport.issues) {
    for (const issue of currentReport.issues) {
      if (issue.rule_id) {
        detectedCounts[issue.rule_id] = (detectedCounts[issue.rule_id] || 0) + 1;
      }
    }
  }

  const detectedRuleIdList = Object.keys(detectedCounts);
  const detectedCountBadge = document.getElementById("ref-detected-count");
  if (detectedCountBadge) {
    detectedCountBadge.textContent = detectedRuleIdList.length;
  }

  // 2. Filter rules by scope and search keyword
  let list = RULE_ENCYCLOPEDIA;

  if (currentReferenceScope === "detected") {
    // If scanning hasn't occurred or no issues detected
    if (detectedRuleIdList.length === 0) {
      if (!currentReport) {
        container.innerHTML = `
          <div class="empty-state" style="padding: 24px 16px;">
            <p style="font-weight:700; color:#1e293b; margin-bottom:4px;">No Scan Completed Yet</p>
            <p style="font-size:11.5px; color:#64748b; margin-bottom:12px;">Run a scan or switch to the All Rules Library to browse WCAG guidelines.</p>
            <button id="ref-empty-browse-btn" class="tool-btn" style="margin:0 auto;">Browse All Rules (18)</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="empty-state" style="padding: 24px 16px;">
            <p style="font-size:20px; margin-bottom:6px;">🎉</p>
            <p style="font-weight:700; color:#15803d; margin-bottom:4px;">No Violations Detected on This Page!</p>
            <p style="font-size:11.5px; color:#64748b; margin-bottom:12px;">${escapeHtml(currentHostname)} passed all automated accessibility criteria evaluated by Lantern.</p>
            <button id="ref-empty-browse-btn" class="tool-btn" style="margin:0 auto;">Browse All Rules (18)</button>
          </div>
        `;
      }
      document.getElementById("ref-empty-browse-btn")?.addEventListener("click", () => {
        setReferenceScope("all");
      });
      return;
    }

    list = list.filter((r) => (detectedCounts[r.id] || 0) > 0);
  }

  if (referenceSearchKeyword) {
    list = list.filter((r) => {
      const haystack = `${r.name} ${r.wcagCode} ${r.problem} ${r.why} ${r.fix}`.toLowerCase();
      return haystack.includes(referenceSearchKeyword);
    });
  }

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state">No accessibility rules match your search.</div>';
    return;
  }

  list.forEach((rule, idx) => {
    const card = document.createElement("div");
    const countHere = detectedCounts[rule.id] || 0;
    const isDetected = countHere > 0;
    const shouldBeOpen = targetRuleIdToOpen ? targetRuleIdToOpen === rule.id : (idx === 0);

    card.className = `ref-rule-card ${rule.severity || "moderate"} ${shouldBeOpen ? "is-open" : ""}`;
    card.id = `ref-card-${rule.id}`;

    const catIconSvg = getCategorySvg(rule.category || "structure");

    card.innerHTML = `
      <div class="ref-rule-header" role="button" tabindex="0" title="Click to view explanation, user impact, and HTML examples">
        <div class="ref-header-left">
          <div class="ref-category-icon ${rule.category || 'structure'}" title="${rule.category || 'Rule'}">
            ${catIconSvg}
          </div>
          <div class="ref-title-group">
            <span class="ref-rule-title">${escapeHtml(rule.name)}</span>
            ${
              isDetected
                ? `<span class="ref-detected-tag">⚠️ Found ${countHere} time(s) on this page</span>`
                : ""
            }
          </div>
        </div>
        <div class="ref-header-right">
          <span class="ref-wcag-badge" title="${escapeHtml(rule.wcag)}">${escapeHtml(rule.wcagCode || rule.wcag)}</span>
          <svg class="ref-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      <div class="ref-rule-body">
        <div class="ref-section">
          <div class="ref-sec-label">What it means</div>
          <div class="ref-sec-text">${escapeHtml(rule.problem)}</div>
        </div>
        <div class="ref-section">
          <div class="ref-sec-label">Why it matters</div>
          <div class="ref-sec-text">${escapeHtml(rule.why)}</div>
        </div>
        <div class="ref-section">
          <div class="ref-sec-label">User Impact</div>
          <div class="ref-sec-text">${escapeHtml(rule.impact)}</div>
        </div>
        <div class="ref-section">
          <div class="ref-sec-label">Suggested Fix</div>
          <div class="ref-sec-text">${escapeHtml(rule.fix)}</div>
        </div>

        ${
          isDetected
            ? `<div style="margin: 8px 0;">
                <button class="ref-inspect-page-btn tool-btn" data-rule="${rule.id}">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;"><circle cx="12" cy="12" r="10"/><line x1="22" y1="22" x2="16.65" y2="16.65"/></svg>
                  View Affected Elements in Details Tab &rarr;
                </button>
              </div>`
            : ""
        }

        <div class="ref-examples-stack">
          <div class="ref-code-box ref-code-bad">
            <span class="ref-code-title">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Incorrect Implementation
            </span>
            <code>${escapeHtml(rule.badHtml)}</code>
          </div>
          <div class="ref-code-box ref-code-good">
            <span class="ref-code-title">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Correct Implementation
            </span>
            <code>${escapeHtml(rule.goodHtml)}</code>
          </div>
        </div>
      </div>
    `;

    // Accordion toggle click & keyboard Enter/Space
    const headerEl = card.querySelector(".ref-rule-header");
    headerEl.addEventListener("click", () => {
      card.classList.toggle("is-open");
    });
    headerEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("is-open");
      }
    });

    // Jump to details button
    const jumpBtn = card.querySelector(".ref-inspect-page-btn");
    if (jumpBtn) {
      jumpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        switchWaveTab("details");
        document.querySelectorAll(".wave-tab").forEach((b) => b.classList.remove("active"));
        document.querySelector('.wave-tab[data-tab="details"]')?.classList.add("active");
        currentWaveTab = "details";
        detailsSearchKeyword = rule.name.toLowerCase();
        if (detailsSearchInput) detailsSearchInput.value = rule.name;
        renderDetailsItems();
      });
    }

    container.appendChild(card);
  });

  if (targetRuleIdToOpen) {
    const el = document.getElementById(`ref-card-${targetRuleIdToOpen}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }
}

// ── TAB 3: ORDER (KEYBOARD NAVIGATION) ──────────────────────────────
function renderOrderTab() {
  if (!currentReport) return;

  const items = currentReport.focus_order || [];
  const listEl = document.getElementById("order-item-list");
  const counterEl = document.getElementById("order-current-step");
  const alertEl = document.getElementById("order-suspicious-alert");
  const alertCountEl = document.getElementById("order-suspicious-count");

  listEl.innerHTML = "";

  const suspiciousCount = items.filter((i) => i.is_suspicious_tabindex).length;
  if (suspiciousCount > 0) {
    alertEl.classList.remove("hidden");
    alertCountEl.textContent = suspiciousCount;
  } else {
    alertEl.classList.add("hidden");
  }

  counterEl.textContent = `Item ${currentOrderIndex || (items.length ? 1 : 0)} of ${items.length}`;

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = `order-row ${item.order === currentOrderIndex ? "active" : ""}`;
    li.setAttribute("data-order-num", item.order);

    li.innerHTML = `
      <div class="order-num-badge ${item.is_suspicious_tabindex ? "suspicious" : ""}">
        ${item.order}
      </div>
      <span class="order-tag">&lt;${item.tag}&gt;</span>
      <span class="order-name" title="${escapeHtml(item.accessible_name)}">${escapeHtml(item.accessible_name)}</span>
      ${
        item.is_suspicious_tabindex
          ? `<span class="order-tabindex" style="background:#fed7aa; color:#c2410c;">tabindex="${item.tabindex}"</span>`
          : `<span class="order-tabindex">tabindex="${item.tabindex}"</span>`
      }
    `;

    li.addEventListener("click", () => {
      stepToOrderItem(item.order);
    });

    listEl.appendChild(li);
  });
}

function stepToOrderItem(orderNumber) {
  currentOrderIndex = orderNumber;
  const items = currentReport?.focus_order || [];
  const counterEl = document.getElementById("order-current-step");
  if (counterEl) counterEl.textContent = `Item ${orderNumber} of ${items.length}`;

  // Update active styling in popup list
  document.querySelectorAll(".order-row").forEach((row) => {
    row.classList.toggle("active", parseInt(row.getAttribute("data-order-num"), 10) === orderNumber);
  });

  // Scroll active list item into view in popup
  const activeRow = document.querySelector(`.order-row[data-order-num="${orderNumber}"]`);
  if (activeRow) activeRow.scrollIntoView({ block: "nearest", behavior: "smooth" });

  // Send message to page to highlight item
  if (activeTabId) {
    chrome.runtime.sendMessage({
      action: "focus-order-item",
      tabId: activeTabId,
      orderNumber,
    });
  }
}

// ── TAB 4: STRUCTURE TREE ───────────────────────────────────────────
function renderStructureTab() {
  if (!currentReport) return;

  const tree = currentReport.structure_tree || [];
  const container = document.getElementById("structure-tree-container");
  container.innerHTML = "";

  if (!tree.length) {
    container.innerHTML = '<div class="empty-state">No headings or semantic landmarks detected.</div>';
    return;
  }

  tree.forEach((node) => {
    const div = document.createElement("div");
    div.className = "struct-node";

    // Indent based on heading level (H1 = 0px, H2 = 14px, H3 = 28px...)
    let indent = 0;
    if (node.type === "heading" && node.level) {
      indent = Math.max(0, (node.level - 1) * 14);
    }
    div.style.marginLeft = `${indent}px`;

    const badgeClass = node.type === "heading" ? `h${node.level}` : "landmark";
    const badgeLabel = node.type === "heading" ? `H${node.level}` : node.landmark_type.toUpperCase();

    div.innerHTML = `
      <span class="struct-badge ${badgeClass}">${badgeLabel}</span>
      <span class="struct-text" title="${escapeHtml(node.text)}">${escapeHtml(node.text)}</span>
      ${node.skipped_level ? `<span class="struct-skip-warning"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px; margin-right:2px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Level Skipped</span>` : ""}
    `;

    div.addEventListener("click", () => {
      if (activeTabId && node.element_id) {
        chrome.runtime.sendMessage({
          action: "focus-issue",
          tabId: activeTabId,
          elementId: node.element_id,
        });
      }
    });

    container.appendChild(div);
  });
}

// ── TAB 5: CONTRAST ANALYZER ────────────────────────────────────────
function renderContrastTab() {
  if (!currentReport) return;

  const items = currentReport.contrast_items || [];
  const container = document.getElementById("contrast-items-container");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = '<div class="empty-state">No text elements evaluated for contrast.</div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = `contrast-card ${item.passes_aa ? "pass" : "fail"}`;

    card.innerHTML = `
      <div class="contrast-header-row">
        <div class="contrast-gauge ${item.passes_aa ? "pass" : "fail"}">
          <span>${item.ratio_formatted}</span>
          <span style="font-size:11px; font-weight:500; color:#64748b;">(Req: ${item.required_ratio}:1)</span>
        </div>
        <div class="contrast-compliance-badges">
          <span class="wcag-compliance-pill ${item.passes_aa ? "pass" : "fail"}">AA ${item.passes_aa ? "PASS" : "FAIL"}</span>
          <span class="wcag-compliance-pill ${item.passes_aaa ? "pass" : "fail"}">AAA ${item.passes_aaa ? "PASS" : "FAIL"}</span>
        </div>
      </div>
      <div class="contrast-colors-row">
        <div class="color-swatch-group">
          <span class="color-swatch" style="background-color: ${item.fg_hex};"></span>
          <span class="color-code">Text: ${item.fg_hex}</span>
        </div>
        <div class="color-swatch-group">
          <span class="color-swatch" style="background-color: ${item.bg_hex};"></span>
          <span class="color-code">Bg: ${item.bg_hex}</span>
        </div>
      </div>
      <div class="contrast-text-sample" style="color: ${item.fg_hex}; background-color: ${item.bg_hex}; font-weight: ${item.is_large ? "bold" : "normal"};">
        "${escapeHtml(item.text)}"
      </div>
      ${
        !item.passes_aa && item.suggested_color
          ? `<div class="contrast-suggest-box">
              <span class="suggest-text">Suggested accessible color: <strong>${item.suggested_color}</strong> (${item.suggested_ratio}:1)</span>
              <button class="suggest-copy-btn" data-color="${item.suggested_color}">Copy Hex</button>
            </div>`
          : ""
      }
      <div style="display:flex; justify-content:flex-end; margin-top:6px;">
        <button class="inspect-btn" data-id="${item.element_id}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="22" x2="16.65" y2="16.65"/></svg>
          Inspect Element
        </button>
      </div>
    `;

    // Copy hex listener
    const copyBtn = card.querySelector(".suggest-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const hex = copyBtn.getAttribute("data-color");
        navigator.clipboard.writeText(hex).then(() => {
          copyBtn.textContent = "Copied!";
          setTimeout(() => { copyBtn.textContent = "Copy Hex"; }, 1600);
        });
      });
    }

    // Inspect listener
    const inspectBtn = card.querySelector(".inspect-btn");
    if (inspectBtn) {
      inspectBtn.addEventListener("click", () => {
        if (activeTabId && item.element_id) {
          chrome.runtime.sendMessage({
            action: "focus-issue",
            tabId: activeTabId,
            elementId: item.element_id,
          });
        }
      });
    }

    container.appendChild(card);
  });
}

// ── CSV Report Export ───────────────────────────────────────────────
function exportResultsToCSV() {
  if (!currentReport) return;

  const rows = [
    ["Type", "Category", "Severity", "Rule ID", "WCAG Criterion", "Element Selector", "Message", "Suggested Fix"],
  ];

  // 1. Add issues
  (currentReport.issues || []).forEach((i) => {
    rows.push([
      "Violation",
      i.category || "general",
      i.severity,
      i.rule_id,
      i.wcag_criteria || "",
      i.selector || "",
      i.message,
      i.how_to_fix,
    ]);
  });

  // 2. Add features
  (currentReport.features || []).forEach((f) => {
    rows.push([
      "Feature",
      f.category || "general",
      "feature",
      f.rule_id,
      f.wcag_criteria || "",
      f.selector || "",
      f.message,
      f.how_to_fix,
    ]);
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = (cell || "").toString().replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeHost = (currentReport.hostname || "lantern-audit").replace(/[^a-z0-9_-]/gi, "_");
  a.download = `lantern-accessibility-${safeHost}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── EXPANDED WEB DASHBOARD REDIRECT ─────────────────────────────────
async function openExpandedWebDashboard() {
  if (!currentReport) {
    alert("Please wait for or run a scan first!");
    return;
  }

  // 1. Sync live DOM audit report to FastAPI backend store
  try {
    fetch("http://localhost:8000/api/scan/audit-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentReport),
    }).catch(() => {});
  } catch (_) {}

  // 2. Open Vite React web dashboard in expanded view
  const targetUrl = "http://localhost:5173/?source=extension";
  chrome.tabs.create({ url: targetUrl }, (newTab) => {
    if (!newTab || !newTab.id) return;

    const pushReportToTab = () => {
      chrome.scripting.executeScript({
        target: { tabId: newTab.id },
        func: (reportData) => {
          try {
            localStorage.setItem("lantern_extension_report", JSON.stringify(reportData));
            window.dispatchEvent(new CustomEvent("lantern-report-loaded", { detail: reportData }));
          } catch (e) {
            console.error("Lantern: could not store report in localStorage", e);
          }
        },
        args: [currentReport],
      }).catch(() => {});
    };

    const updateListener = (tabId, changeInfo) => {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(updateListener);
        pushReportToTab();
      }
    };
    chrome.tabs.onUpdated.addListener(updateListener);

    // Also inject with timeout fallback
    setTimeout(pushReportToTab, 800);
  });
}


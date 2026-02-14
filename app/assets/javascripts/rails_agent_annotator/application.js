(function() {
  const APP_ID = "raa-toolbar";
  const LAUNCHER_ID = "raa-launcher";
  const HIGHLIGHT_ID = "raa-highlight";
  const ROUGH_COMPUTED_PROPERTIES = [
    "display",
    "position",
    "width",
    "height",
    "margin",
    "padding",
    "color",
    "background-color",
    "font-size",
    "font-weight",
    "line-height",
    "border",
    "border-radius"
  ];
  const ROUGH_RULE_PROPERTIES = new Set([
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "width",
    "height",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "color",
    "background",
    "background-color",
    "font-size",
    "font-weight",
    "line-height",
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-radius",
    "box-shadow",
    "opacity",
    "z-index",
    "flex",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "justify-content",
    "align-items",
    "gap",
    "grid-template-columns",
    "grid-template-rows"
  ]);
  const MAX_ROUGH_MATCHED_RULES = 6;
  const MAX_ROUGH_RULE_DECLARATIONS = 4;
  const MAX_ROUGH_RULE_INSPECTIONS = 3000;
  const CSS_EDIT_PROPERTY_SUGGESTIONS = [
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
    "border-width",
    "border-color",
    "border-style",
    "border-top-width",
    "border-top-style",
    "border-top-color",
    "border-right-width",
    "border-right-style",
    "border-right-color",
    "border-bottom-width",
    "border-bottom-style",
    "border-bottom-color",
    "border-left-width",
    "border-left-style",
    "border-left-color",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "font-size",
    "font-weight",
    "line-height",
    "letter-spacing",
    "color",
    "background-color",
    "width",
    "height",
    "max-width",
    "min-height",
    "display",
    "align-items",
    "justify-content",
    "gap",
    "box-shadow",
    "opacity"
  ];
  const DEFAULT_CSS_EDIT_PROPERTIES = [
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
    "padding",
    "font-size",
    "font-weight",
    "line-height",
    "color",
    "background-color"
  ];
  const ALLOWED_CSS_EDIT_PROPERTIES = new Set(CSS_EDIT_PROPERTY_SUGGESTIONS);
  const MAX_CSS_EDIT_VALUE_LENGTH = 120;
  const CSS_SCOPE_EXACT = "exact";
  const CSS_SCOPE_SIMILAR = "similar";
  const CSS_SCOPE_CONTAINER = "container";
  const CSS_SCOPE_VALUES = new Set([CSS_SCOPE_EXACT, CSS_SCOPE_SIMILAR, CSS_SCOPE_CONTAINER]);
  const SIMILAR_DEFAULT_TAGS = new Set(["li", "tr", "td", "th", "dt", "dd", "option"]);

  function scopeLabelFor(scope) {
    if (scope === CSS_SCOPE_SIMILAR) return "Similar siblings";
    if (scope === CSS_SCOPE_CONTAINER) return "Entire container";
    return "This item only";
  }

  function normalizedCssScope(scope) {
    return CSS_SCOPE_VALUES.has(scope) ? scope : CSS_SCOPE_EXACT;
  }

  function defaultCssScopeForElementTag(tagName) {
    const tag = (tagName || "").toString().trim().toLowerCase();
    if (!tag) return CSS_SCOPE_EXACT;
    return SIMILAR_DEFAULT_TAGS.has(tag) ? CSS_SCOPE_SIMILAR : CSS_SCOPE_EXACT;
  }

  function defaultCssScopeForElement(element) {
    return element && element.tagName ? defaultCssScopeForElementTag(element.tagName) : CSS_SCOPE_EXACT;
  }

  function cssPropertyDatalistMarkup() {
    return CSS_EDIT_PROPERTY_SUGGESTIONS.map((property) => `<option value="${property}"></option>`).join("");
  }

  function toolbarMarkup(debugPath) {
    return `
      <div class="raa-toolbar-shell" id="${APP_ID}">
        <div class="raa-toast" data-role="toast" hidden></div>
        <div class="raa-toolbar-row">
          <button class="raa-btn" type="button" data-action="toggle-select" aria-pressed="false">Select</button>
          <button class="raa-btn" type="button" data-action="copy">Copy Markdown</button>
          <a class="raa-btn" href="${debugPath}" target="_blank" rel="noopener noreferrer">Debug</a>
          <button class="raa-btn" type="button" data-action="close">Close</button>
          <button class="raa-btn raa-btn-danger" type="button" data-action="clear">Clear</button>
        </div>
        <div class="raa-panel" data-role="panel">
          <div data-role="annotations"></div>
        </div>
        <datalist id="raa-tag-suggestions">
          <option value="bug"></option>
          <option value="copy"></option>
          <option value="layout"></option>
          <option value="behavior"></option>
          <option value="feature"></option>
        </datalist>
        <datalist id="raa-css-property-suggestions">${cssPropertyDatalistMarkup()}</datalist>
      </div>
    `;
  }

  function parseContext() {
    const node = document.getElementById("raa-context");
    if (!node) return null;

    try {
      return JSON.parse(node.textContent || "{}");
    } catch (_error) {
      return null;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizedAppId(appId) {
    const raw = (appId || "rails_app").toString().trim();
    return raw.length > 0 ? raw.replace(/\s+/g, "_") : "rails_app";
  }

  function storageNamespacePrefix(storageKeyPrefix, appId) {
    return `${storageKeyPrefix}:${normalizedAppId(appId)}`;
  }

  function styleSheetSource(sheet) {
    if (!sheet || !sheet.href) return "inline style tag";

    try {
      const parsed = new URL(sheet.href, window.location.href);
      return parsed.pathname || sheet.href;
    } catch (_error) {
      return sheet.href;
    }
  }

  function collectRuleDeclarations(style, maxDeclarations) {
    const declarations = [];
    if (!style) return declarations;

    for (let i = 0; i < style.length && declarations.length < maxDeclarations; i += 1) {
      const property = style[i];
      if (!property) continue;

      const normalizedProperty = property.toLowerCase();
      if (!ROUGH_RULE_PROPERTIES.has(normalizedProperty)) continue;

      const value = style.getPropertyValue(property).trim();
      if (!value) continue;

      const priority = style.getPropertyPriority(property);
      declarations.push(`${normalizedProperty}: ${value}${priority ? ` !${priority}` : ""}`);
    }

    return declarations;
  }

  function matchesSelectorSafely(element, selectorText) {
    if (!selectorText) return false;

    try {
      return element.matches(selectorText);
    } catch (_error) {
      return false;
    }
  }

  function collectRoughComputedStyles(element) {
    const computed = window.getComputedStyle ? window.getComputedStyle(element) : null;
    if (!computed) return [];

    return ROUGH_COMPUTED_PROPERTIES.map((property) => {
      const value = computed.getPropertyValue(property).trim();
      if (!value) return null;
      return `${property}: ${value}`;
    }).filter(Boolean);
  }

  function pushRoughRule(buffer, ruleData) {
    if (buffer.length >= MAX_ROUGH_MATCHED_RULES) buffer.shift();
    buffer.push(ruleData);
  }

  function collectRoughMatchedRules(element) {
    const matched = [];
    let inspected = 0;

    const visitRules = (rules, source) => {
      if (!rules) return;

      for (let i = 0; i < rules.length; i += 1) {
        if (inspected >= MAX_ROUGH_RULE_INSPECTIONS) return;

        const rule = rules[i];
        inspected += 1;

        if (!rule) continue;

        if (typeof rule.selectorText === "string" && rule.style) {
          if (!matchesSelectorSafely(element, rule.selectorText)) continue;
          const declarations = collectRuleDeclarations(rule.style, MAX_ROUGH_RULE_DECLARATIONS);
          if (!declarations.length) continue;

          pushRoughRule(matched, {
            selector: rule.selectorText.trim(),
            source,
            declarations
          });
          continue;
        }

        if (rule.cssRules && rule.cssRules.length) {
          visitRules(rule.cssRules, source);
        }
      }
    };

    Array.from(document.styleSheets || []).forEach((sheet) => {
      if (inspected >= MAX_ROUGH_RULE_INSPECTIONS) return;
      let rules = null;

      try {
        rules = sheet.cssRules;
      } catch (_error) {
        // Cross-origin stylesheets can be blocked; ignore quietly.
      }

      if (!rules || !rules.length) return;
      visitRules(rules, styleSheetSource(sheet));
    });

    const inlineDeclarations = collectRuleDeclarations(element.style, MAX_ROUGH_RULE_DECLARATIONS);
    if (inlineDeclarations.length) {
      pushRoughRule(matched, {
        selector: "(inline style)",
        source: "style attribute",
        declarations: inlineDeclarations
      });
    }

    return matched;
  }

  function captureRoughCss(element) {
    return {
      computed: collectRoughComputedStyles(element),
      matched_rules: collectRoughMatchedRules(element)
    };
  }

  function roughCssPreviewLines(cssRough) {
    if (!cssRough || typeof cssRough !== "object") return [];

    const lines = [];
    const computed = Array.isArray(cssRough.computed) ? cssRough.computed.filter(Boolean) : [];
    const matched = Array.isArray(cssRough.matched_rules) ? cssRough.matched_rules : [];

    if (computed.length) {
      lines.push("Computed snapshot:");
      computed.forEach((line) => lines.push(`  ${line}`));
    }

    if (matched.length) {
      if (lines.length) lines.push("");
      lines.push("Matched selectors (rough, last wins):");

      matched.forEach((rule) => {
        const selector = rule && rule.selector ? rule.selector : "(unknown selector)";
        const source = rule && rule.source ? ` [${rule.source}]` : "";
        const declarations = rule && Array.isArray(rule.declarations) ? rule.declarations : [];

        lines.push(`  ${selector}${source}`);
        if (declarations.length) lines.push(`    ${declarations.join("; ")}`);
      });
    }

    return lines;
  }

  function cssEditId() {
    return crypto.randomUUID ? crypto.randomUUID() : `raa-css-${Date.now()}-${Math.random()}`;
  }

  function normalizeCssProperty(property) {
    return (property || "").toString().trim().toLowerCase();
  }

  function hasBalancedParentheses(value) {
    let depth = 0;

    for (let i = 0; i < value.length; i += 1) {
      const character = value[i];
      if (character === "(") depth += 1;
      if (character === ")") {
        if (depth === 0) return false;
        depth -= 1;
      }
    }

    return depth === 0;
  }

  function isSafeCssValue(value) {
    const normalized = (value || "").toString().trim();
    if (!normalized) return false;
    if (normalized.length > MAX_CSS_EDIT_VALUE_LENGTH) return false;
    return hasBalancedParentheses(normalized);
  }

  function isAllowedCssProperty(property) {
    return ALLOWED_CSS_EDIT_PROPERTIES.has(property);
  }

  function isValidCssProperty(property) {
    if (!property) return false;
    if (!/^[a-z][a-z0-9-]*$/.test(property)) return false;
    return isAllowedCssProperty(property);
  }

  function computedCssValue(element, property) {
    if (!element || !property || !window.getComputedStyle) return "";

    try {
      return window.getComputedStyle(element).getPropertyValue(property).trim();
    } catch (_error) {
      return "";
    }
  }

  function createCssEdit(property, before, after, enabled, id) {
    return {
      id: id || cssEditId(),
      property: normalizeCssProperty(property),
      before: (before || "").toString(),
      after: (after || "").toString(),
      enabled: enabled !== false
    };
  }

  function initialCssEditsForElement(element) {
    if (!element) return [];

    return DEFAULT_CSS_EDIT_PROPERTIES.map((property) => {
      const baseline = computedCssValue(element, property);
      return createCssEdit(property, baseline, baseline, true);
    }).filter((edit) => edit.before.length > 0);
  }

  function normalizedCssEdits(rawEdits) {
    if (!Array.isArray(rawEdits)) return [];

    return rawEdits.map((row) => {
      if (!row || typeof row !== "object") return null;

      const property = normalizeCssProperty(row.property);
      const before = typeof row.before === "string" ? row.before : "";
      const defaultAfter = before;
      const after = typeof row.after === "string" ? row.after : defaultAfter;

      return createCssEdit(property, before, after, row.enabled !== false, row.id);
    }).filter(Boolean);
  }

  function changedCssEdits(annotation) {
    const edits = normalizedCssEdits(annotation && annotation.css_edits);

    return edits.filter((edit) => {
      if (edit.enabled === false) return false;
      if (!isValidCssProperty(edit.property)) return false;
      if (!isSafeCssValue(edit.after)) return false;

      const before = (edit.before || "").trim();
      const after = (edit.after || "").trim();
      return before !== after;
    });
  }

  function cssEditsMarkdownLines(annotation) {
    return changedCssEdits(annotation).map((edit) => {
      const before = edit.before && edit.before.trim().length > 0 ? edit.before : "(unset)";
      return `  - ${edit.property}: ${before} -> ${edit.after}`;
    });
  }

  function selectedCssScope(annotation) {
    const fallback = defaultCssScopeForElementTag(annotation && annotation.element_tag);
    if (!annotation || typeof annotation !== "object") return fallback;
    return CSS_SCOPE_VALUES.has(annotation.css_scope) ? annotation.css_scope : fallback;
  }

  function selectedScopeSelector(annotation) {
    if (!annotation || typeof annotation !== "object") return "";

    const scope = selectedCssScope(annotation);
    const exact = (annotation.selector_exact || annotation.selector || "").toString();
    const similar = (annotation.selector_similar || exact).toString();
    const container = (annotation.selector_container || similar || exact).toString();

    if (scope === CSS_SCOPE_CONTAINER) return container;
    if (scope === CSS_SCOPE_SIMILAR) return similar;
    return exact;
  }

  function selectorMatchCount(selector) {
    if (!selector) return 0;

    try {
      return document.querySelectorAll(selector).length;
    } catch (_error) {
      return 0;
    }
  }

  function normalizeStoredAnnotations(rawAnnotations) {
    if (!Array.isArray(rawAnnotations)) return [];

    return rawAnnotations.map((annotation) => {
      if (!annotation || typeof annotation !== "object") return null;
      const normalized = { ...annotation };
      normalized.selector_exact = (annotation.selector_exact || annotation.selector || "").toString();
      normalized.selector = normalized.selector_exact;
      normalized.selector_similar = (annotation.selector_similar || normalized.selector_exact || "").toString();
      normalized.selector_container = (annotation.selector_container || normalized.selector_similar || normalized.selector_exact || "").toString();
      normalized.css_scope = CSS_SCOPE_VALUES.has(annotation.css_scope) ? annotation.css_scope : defaultCssScopeForElementTag(annotation.element_tag);
      normalized.css_edits = normalizedCssEdits(annotation.css_edits);
      return normalized;
    }).filter(Boolean);
  }

  function resolveAnnotationElement(state, annotation) {
    if (!state || !annotation || !annotation.id) return null;

    const mapped = state.annotationTargets.get(annotation.id);
    if (mapped && mapped.isConnected) return mapped;

    const exactSelector = (annotation.selector_exact || annotation.selector || "").toString();
    if (exactSelector) {
      try {
        const found = document.querySelector(exactSelector);
        if (found) {
          state.annotationTargets.set(annotation.id, found);
          return found;
        }
      } catch (_error) {
        // Ignore invalid selectors from dynamic DOM changes.
      }
    }

    const fallbackSelector = selectedScopeSelector(annotation);
    if (!fallbackSelector) return null;

    try {
      return document.querySelector(fallbackSelector);
    } catch (_error) {
      return null;
    }
  }

  function resolveAnnotationElements(state, annotation) {
    if (!annotation) return [];

    const scope = selectedCssScope(annotation);
    if (scope === CSS_SCOPE_EXACT) {
      const exact = resolveAnnotationElement(state, annotation);
      return exact ? [exact] : [];
    }

    const selector = selectedScopeSelector(annotation);
    if (!selector) return [];

    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (_error) {
      return [];
    }
  }

  function primaryElementForAnnotation(state, annotation) {
    const exact = resolveAnnotationElement(state, annotation);
    if (exact) return exact;

    const elements = resolveAnnotationElements(state, annotation);
    return elements.length > 0 ? elements[0] : null;
  }

  function scopeMatchCountForAnnotation(state, annotation) {
    const scope = selectedCssScope(annotation);
    if (scope === CSS_SCOPE_EXACT) {
      if (state) return resolveAnnotationElements(state, annotation).length;
      return selectorMatchCount(selectedScopeSelector(annotation));
    }

    return selectorMatchCount(selectedScopeSelector(annotation));
  }

  function clearAppliedCssForAnnotation(state, annotation) {
    if (!state || !annotation || !annotation.id) return;

    const appliedState = state.appliedCssByAnnotationId.get(annotation.id);
    if (appliedState && Array.isArray(appliedState.elements) && Array.isArray(appliedState.properties)) {
      appliedState.elements.forEach((element) => {
        if (!element || !element.isConnected) return;
        appliedState.properties.forEach((property) => element.style.removeProperty(property));
      });
    }

    state.appliedCssByAnnotationId.delete(annotation.id);
    state.annotationTargets.delete(annotation.id);
  }

  function applyCssEditsForAnnotation(state, annotation) {
    if (!state || !annotation || !annotation.id) return;

    const appliedState = state.appliedCssByAnnotationId.get(annotation.id) || { elements: [], properties: [] };
    const previousElements = Array.isArray(appliedState.elements) ? appliedState.elements : [];
    const previousProperties = Array.isArray(appliedState.properties) ? appliedState.properties : [];

    previousElements.forEach((element) => {
      if (!element || !element.isConnected) return;
      previousProperties.forEach((property) => element.style.removeProperty(property));
    });

    const activeEdits = changedCssEdits(annotation);
    const targetElements = resolveAnnotationElements(state, annotation);
    if (!activeEdits.length || !targetElements.length) {
      state.appliedCssByAnnotationId.delete(annotation.id);
      return;
    }

    const nextProperties = new Set(activeEdits.map((edit) => edit.property));
    targetElements.forEach((element) => {
      activeEdits.forEach((edit) => element.style.setProperty(edit.property, edit.after));
    });

    state.appliedCssByAnnotationId.set(annotation.id, {
      elements: targetElements.filter((element) => element && element.isConnected),
      properties: Array.from(nextProperties)
    });
  }

  function applyCssEditsForAllAnnotations(state) {
    if (!state || !Array.isArray(state.annotations)) return;
    state.annotations.forEach((annotation) => applyCssEditsForAnnotation(state, annotation));
  }

  function selectorPart(element, options = {}) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";

    const preferId = options.preferId === true;
    const includeClasses = options.includeClasses !== false;
    const allowNth = options.allowNth === true;
    const maxClasses = options.maxClasses || 2;

    if (preferId && element.id) return `#${CSS.escape(element.id)}`;

    let part = element.tagName.toLowerCase();
    const classes = includeClasses ? Array.from(element.classList).filter(Boolean).slice(0, maxClasses) : [];
    const parent = element.parentElement;
    const siblingIndex = parent
      ? Array.from(parent.children).filter((child) => child.tagName === element.tagName).indexOf(element) + 1
      : 0;
    const hasTagSiblings = siblingIndex > 0
      ? Array.from(parent.children).filter((child) => child.tagName === element.tagName).length > 1
      : false;

    const siblingMatchCountForPart = (partSelector) => {
      if (!parent || !partSelector) return 0;

      return Array.from(parent.children).reduce((count, child) => {
        if (!child || child.nodeType !== Node.ELEMENT_NODE) return count;

        try {
          return child.matches(partSelector) ? count + 1 : count;
        } catch (_error) {
          return count;
        }
      }, 0);
    };

    if (classes.length > 0) {
      part += classes.map((name) => `.${CSS.escape(name)}`).join("");
      const ambiguousWithClasses = siblingMatchCountForPart(part) > 1;
      if (allowNth && hasTagSiblings && ambiguousWithClasses) return `${part}:nth-of-type(${siblingIndex})`;
      return part;
    }

    if (!allowNth) return part;
    if (!hasTagSiblings) return part;
    return `${part}:nth-of-type(${siblingIndex})`;
  }

  function selectorFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 5) {
      const part = selectorPart(current, { allowNth: true, includeClasses: true, maxClasses: 2 });
      path.unshift(part);

      if (current.parentElement && current.parentElement.id) {
        path.unshift(`#${CSS.escape(current.parentElement.id)}`);
        break;
      }

      current = current.parentElement;
    }

    return path.join(" > ");
  }

  function similarSelectorFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 6) {
      const part = selectorPart(current, { allowNth: false, includeClasses: true, maxClasses: 2 });
      path.unshift(part);

      if (current.parentElement && current.parentElement.id) {
        path.unshift(`#${CSS.escape(current.parentElement.id)}`);
        break;
      }

      current = current.parentElement;
    }

    return path.join(" > ");
  }

  function firstDataController(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    const raw = element.getAttribute("data-controller") || "";
    return raw.split(/\s+/).filter(Boolean)[0] || "";
  }

  function anchorSelectorFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;

    const controller = firstDataController(element);
    if (controller) return `${element.tagName.toLowerCase()}[data-controller~="${CSS.escape(controller)}"]`;

    return selectorPart(element, { allowNth: false, includeClasses: true, maxClasses: 2 });
  }

  function nearestContainerAnchor(element) {
    let current = element && element.parentElement ? element.parentElement : null;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      if (current.id) return current;
      if (firstDataController(current)) return current;
      current = current.parentElement;
    }

    return document.body;
  }

  function elementShapeSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;
    return selectorPart(element, { allowNth: false, includeClasses: true, maxClasses: 2 });
  }

  function containerSelectorFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;

    const anchor = nearestContainerAnchor(element);
    const anchorSelector = anchorSelectorFor(anchor);
    const shapeSelector = elementShapeSelector(element);
    if (!anchorSelector) return similarSelectorFor(element);
    if (!shapeSelector) return anchorSelector;

    if (anchor && anchor !== document.body) {
      if (anchor === element.parentElement) return `${anchorSelector} > ${shapeSelector}`;
      return `${anchorSelector} ${shapeSelector}`;
    }

    return `body ${shapeSelector}`;
  }

  function textSnippetFor(element) {
    const raw = (element.innerText || element.value || "").replace(/\s+/g, " ").trim();
    if (!raw) return "(input)";
    return raw.slice(0, 140);
  }

  function nearestStimulusControllers(element) {
    const controllers = new Set();
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const dataController = current.getAttribute("data-controller");
      if (dataController) {
        dataController.split(/\s+/).filter(Boolean).forEach((name) => controllers.add(name));
      }
      current = current.parentElement;
    }

    return Array.from(controllers);
  }

  function captureElement(element) {
    const rect = element.getBoundingClientRect();
    const turboFrame = element.closest("turbo-frame");
    const exactSelector = selectorFor(element);
    const similarSelector = similarSelectorFor(element) || exactSelector;
    const containerSelector = containerSelectorFor(element) || similarSelector || exactSelector;
    const defaultCssScope = defaultCssScopeForElement(element);

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `raa-${Date.now()}-${Math.random()}`,
      tag: "",
      priority: "",
      notes: "",
      selector: exactSelector,
      selector_exact: exactSelector,
      selector_similar: similarSelector,
      selector_container: containerSelector,
      css_scope: defaultCssScope,
      element_tag: element.tagName.toLowerCase(),
      element_id: element.id || null,
      classes: Array.from(element.classList),
      text: textSnippetFor(element),
      bbox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      },
      turbo_frame: turboFrame && turboFrame.id ? turboFrame.id : null,
      stimulus: nearestStimulusControllers(element),
      css_rough: captureRoughCss(element),
      css_edits: initialCssEditsForElement(element),
      created_at: nowIso()
    };
  }

  function markdownFor(context, annotations) {
    const lines = [];
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    lines.push("Annotator Notes", `**Viewport:** ${viewportWidth}×${viewportHeight}`, "", "Context:");
    lines.push(`- URL: ${context && context.url ? context.url : window.location.pathname}`);
    lines.push(`- Method: ${context && context.method ? context.method : "Unknown"}`);
    lines.push(`- Controller: ${context && context.controller ? context.controller : "Unknown"}`);
    lines.push(`- Route: ${context && context.route ? context.route : "Unknown"}`);
    lines.push(`- Timestamp: ${context && context.timestamp ? context.timestamp : nowIso()}`);
    lines.push("", "Annotations:");

    if (!annotations.length) {
      lines.push("1) [unlabeled] [P2]", "- Notes:", "  - No annotations captured.");
      return lines.join("\n");
    }

    annotations.forEach((annotation, index) => {
      const tag = annotation.tag || "unlabeled";
      const priority = annotation.priority || "P2";
      const exactSelector = annotation.selector_exact || annotation.selector || "Unknown";
      const scopeSelector = selectedScopeSelector(annotation) || "Unknown";

      lines.push(`${index + 1}) [${tag}] [${priority}]`);
      lines.push(`- Selector (Exact): ${exactSelector}`);
      lines.push(`- Text: ${annotation.text || "(input)"}`);

      const cssEditLines = cssEditsMarkdownLines(annotation);
      if (cssEditLines.length) {
        lines.push(`- CSS Scope Selector: ${scopeSelector}`);
        lines.push("- CSS Edits:");
        cssEditLines.forEach((line) => lines.push(line));
      }

      lines.push("- Notes:");
      if (annotation.notes && annotation.notes.trim().length > 0) {
        annotation.notes
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => lines.push(`  - ${line}`));
      } else {
        lines.push("  - (no notes)");
      }

      lines.push("");
    });

    return lines.join("\n").trim();
  }

  function renderAnnotationList(state, handlers, list) {
    if (!list) return;
    list.innerHTML = "";

    const persist = handlers && typeof handlers.persist === "function" ? handlers.persist : () => {};
    const saveOnly = handlers && typeof handlers.saveOnly === "function" ? handlers.saveOnly : () => {};

    state.annotations.forEach((annotation) => {
      annotation.css_edits = normalizedCssEdits(annotation.css_edits);
      annotation.css_scope = selectedCssScope(annotation);

      const item = document.createElement("div");
      item.className = "raa-item";

      const header = document.createElement("div");
      header.className = "raa-item-header";
      header.textContent = annotation.selector_exact || annotation.selector || annotation.element_tag;

      const meta = document.createElement("div");
      meta.className = "raa-item-meta";
      meta.textContent = `Text: ${annotation.text}`;

      const cssLines = roughCssPreviewLines(annotation.css_rough);
      const cssDetails = document.createElement("details");
      cssDetails.className = "raa-item-css";
      cssDetails.hidden = cssLines.length === 0;
      const cssSummary = document.createElement("summary");
      cssSummary.textContent = "Rough CSS impact";
      const cssPre = document.createElement("pre");
      cssPre.className = "raa-item-css-pre";
      cssPre.textContent = cssLines.join("\n");
      cssDetails.appendChild(cssSummary);
      cssDetails.appendChild(cssPre);

      const cssEditor = document.createElement("div");
      cssEditor.className = "raa-css-editor";

      const cssEditorHeader = document.createElement("div");
      cssEditorHeader.className = "raa-css-editor-header";
      cssEditorHeader.textContent = "CSS Edits (Live Preview)";

      const activeScope = selectedCssScope(annotation);
      const activeScopeSelector = selectedScopeSelector(annotation);
      const activeScopeMatchCount = scopeMatchCountForAnnotation(state, annotation);

      const cssScopeBlock = document.createElement("div");
      cssScopeBlock.className = "raa-css-scope";

      const cssScopeRow = document.createElement("div");
      cssScopeRow.className = "raa-css-scope-row";

      const cssScopeLabel = document.createElement("label");
      cssScopeLabel.className = "raa-css-scope-label";
      cssScopeLabel.textContent = "Scope:";

      const cssScopeSelect = document.createElement("select");
      [
        { value: CSS_SCOPE_EXACT, label: "This item only" },
        { value: CSS_SCOPE_SIMILAR, label: "Similar siblings" },
        { value: CSS_SCOPE_CONTAINER, label: "Entire container" }
      ].forEach((optionData) => {
        const option = document.createElement("option");
        option.value = optionData.value;
        option.textContent = optionData.label;
        if (optionData.value === activeScope) option.selected = true;
        cssScopeSelect.appendChild(option);
      });
      cssScopeSelect.addEventListener("change", (event) => {
        annotation.css_scope = normalizedCssScope(event.target.value);
        applyCssEditsForAnnotation(state, annotation);
        persist();
      });

      cssScopeRow.appendChild(cssScopeLabel);
      cssScopeRow.appendChild(cssScopeSelect);

      const cssScopeSelectorLine = document.createElement("div");
      cssScopeSelectorLine.className = "raa-css-scope-meta";
      cssScopeSelectorLine.textContent = "Scope selector: ";
      const cssScopeSelectorCode = document.createElement("code");
      cssScopeSelectorCode.textContent = activeScopeSelector || "(none)";
      cssScopeSelectorLine.appendChild(cssScopeSelectorCode);

      const cssScopeMatchesLine = document.createElement("div");
      cssScopeMatchesLine.className = "raa-css-scope-meta";
      cssScopeMatchesLine.textContent = `Matches now: ${activeScopeMatchCount}`;

      cssScopeBlock.appendChild(cssScopeRow);
      cssScopeBlock.appendChild(cssScopeSelectorLine);
      cssScopeBlock.appendChild(cssScopeMatchesLine);

      const cssEditorHint = document.createElement("div");
      cssEditorHint.className = "raa-css-editor-hint";
      cssEditorHint.textContent = activeScopeMatchCount > 0
        ? `Applying to ${activeScopeMatchCount} element(s) using ${scopeLabelFor(activeScope)}.`
        : `Preview target unavailable for ${scopeLabelFor(activeScope)} scope.`;

      const cssRows = document.createElement("div");
      cssRows.className = "raa-css-editor-rows";

      if (!annotation.css_edits.length) {
        const empty = document.createElement("div");
        empty.className = "raa-css-editor-empty";
        empty.textContent = "No CSS edit rows yet.";
        cssRows.appendChild(empty);
      } else {
        annotation.css_edits.forEach((edit) => {
          const row = document.createElement("div");
          row.className = "raa-css-edit-row";

          const propertyIsValid = !edit.property || isValidCssProperty(edit.property);
          const valueLooksValid = !edit.after || isSafeCssValue(edit.after);
          if (!propertyIsValid || !valueLooksValid) row.classList.add("raa-css-edit-row-invalid");
          if (edit.enabled === false) row.classList.add("raa-css-edit-row-disabled");

          const enabled = document.createElement("input");
          enabled.type = "checkbox";
          enabled.checked = edit.enabled !== false;
          enabled.title = "Enable this edit";
          enabled.addEventListener("change", (event) => {
            edit.enabled = event.target.checked;
            applyCssEditsForAnnotation(state, annotation);
            persist();
          });

          const propertyInput = document.createElement("input");
          propertyInput.type = "text";
          propertyInput.placeholder = "property";
          propertyInput.value = edit.property || "";
          propertyInput.setAttribute("list", "raa-css-property-suggestions");
          propertyInput.addEventListener("change", (event) => {
            const previousBefore = edit.before || "";
            const property = normalizeCssProperty(event.target.value);
            edit.property = property;

            const target = primaryElementForAnnotation(state, annotation);
            if (property && target) {
              const baseline = computedCssValue(target, property);
              edit.before = baseline;
              if (!edit.after || edit.after.trim().length === 0 || edit.after === previousBefore) {
                edit.after = baseline;
              }
            } else if (!property) {
              edit.before = "";
            }

            applyCssEditsForAnnotation(state, annotation);
            persist();
          });

          const valueInput = document.createElement("input");
          valueInput.type = "text";
          valueInput.placeholder = "value";
          valueInput.value = edit.after || "";
          valueInput.addEventListener("input", (event) => {
            edit.after = event.target.value;
            applyCssEditsForAnnotation(state, annotation);
            saveOnly();
          });
          valueInput.addEventListener("change", (event) => {
            edit.after = event.target.value;
            applyCssEditsForAnnotation(state, annotation);
            persist();
          });

          const removeCssEdit = document.createElement("button");
          removeCssEdit.type = "button";
          removeCssEdit.className = "raa-btn raa-btn-danger";
          removeCssEdit.textContent = "x";
          removeCssEdit.setAttribute("aria-label", "Remove CSS edit row");
          removeCssEdit.addEventListener("click", () => {
            annotation.css_edits = annotation.css_edits.filter((row2) => row2.id !== edit.id);
            applyCssEditsForAnnotation(state, annotation);
            persist();
          });

          const baseline = document.createElement("div");
          baseline.className = "raa-css-edit-baseline";
          baseline.textContent = `base: ${edit.before && edit.before.length ? edit.before : "(unset)"}`;

          row.appendChild(enabled);
          row.appendChild(propertyInput);
          row.appendChild(valueInput);
          row.appendChild(removeCssEdit);
          row.appendChild(baseline);
          cssRows.appendChild(row);
        });
      }

      const cssActions = document.createElement("div");
      cssActions.className = "raa-css-editor-actions";

      const addCssEdit = document.createElement("button");
      addCssEdit.type = "button";
      addCssEdit.className = "raa-btn";
      addCssEdit.textContent = "+ Add Property";
      addCssEdit.addEventListener("click", () => {
        annotation.css_edits.push(createCssEdit("", "", "", true));
        persist();
      });

      const resetCssEdits = document.createElement("button");
      resetCssEdits.type = "button";
      resetCssEdits.className = "raa-btn";
      resetCssEdits.textContent = "Reset CSS";
      resetCssEdits.addEventListener("click", () => {
        annotation.css_edits = normalizedCssEdits(annotation.css_edits).map((edit) => {
          const before = edit.before || "";
          return createCssEdit(edit.property, before, before, true, edit.id);
        });
        applyCssEditsForAnnotation(state, annotation);
        persist();
      });

      cssActions.appendChild(addCssEdit);
      cssActions.appendChild(resetCssEdits);

      cssEditor.appendChild(cssEditorHeader);
      cssEditor.appendChild(cssScopeBlock);
      cssEditor.appendChild(cssEditorHint);
      cssEditor.appendChild(cssRows);
      cssEditor.appendChild(cssActions);

      const controls = document.createElement("div");
      controls.className = "raa-item-controls";

      const tagInput = document.createElement("input");
      tagInput.type = "text";
      tagInput.placeholder = "tag (bug, layout, behavior...)";
      tagInput.setAttribute("list", "raa-tag-suggestions");
      tagInput.value = annotation.tag || "";
      tagInput.addEventListener("change", (event) => {
        annotation.tag = event.target.value.trim();
        persist();
      });

      const prioritySelect = document.createElement("select");
      ["", "P0", "P1", "P2"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value || "priority";
        if ((annotation.priority || "") === value) option.selected = true;
        prioritySelect.appendChild(option);
      });
      prioritySelect.addEventListener("change", (event) => {
        annotation.priority = event.target.value;
        persist();
      });

      const notes = document.createElement("textarea");
      notes.placeholder = "Write annotation notes...";
      notes.value = annotation.notes || "";
      notes.dataset.annotationId = annotation.id;
      notes.addEventListener("change", (event) => {
        annotation.notes = event.target.value;
        persist();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "raa-btn raa-btn-danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        clearAppliedCssForAnnotation(state, annotation);
        state.annotations = state.annotations.filter((item2) => item2.id !== annotation.id);
        persist();
      });

      controls.appendChild(tagInput);
      controls.appendChild(prioritySelect);

      item.appendChild(header);
      item.appendChild(meta);
      item.appendChild(cssDetails);
      item.appendChild(cssEditor);
      item.appendChild(controls);
      item.appendChild(notes);
      item.appendChild(remove);
      list.appendChild(item);
    });
  }

  function focusAnnotationNotes(list, annotationId) {
    if (!list || !annotationId) return;
    const notes = list.querySelector(`textarea[data-annotation-id="${annotationId}"]`);
    if (!notes) return;

    notes.focus();
    const end = notes.value.length;
    notes.setSelectionRange(end, end);
  }

  function createUI(state, debugPath) {
    if (document.getElementById(APP_ID)) return null;

    const launcher = document.createElement("button");
    launcher.id = LAUNCHER_ID;
    launcher.className = "raa-btn";
    launcher.type = "button";
    launcher.textContent = "Agent Annotation";
    launcher.hidden = true;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = toolbarMarkup(debugPath);
    const toolbar = wrapper.firstElementChild;

    const highlight = document.createElement("div");
    highlight.id = HIGHLIGHT_ID;
    highlight.setAttribute("aria-hidden", "true");

    document.body.appendChild(launcher);
    document.body.appendChild(toolbar);
    document.body.appendChild(highlight);

    return { toolbar, launcher, highlight };
  }

  function loadAllStoredSessions(namespacePrefix) {
    const prefix = `${namespacePrefix}:`;
    const sessions = [];

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      const routePath = key.slice(prefix.length) || "/";

      try {
        const raw = JSON.parse(window.localStorage.getItem(key) || "[]");
        const annotations = Array.isArray(raw) ? raw : [];

        if (!annotations.length) continue;
        sessions.push({ key, routePath, annotations });
      } catch (_error) {
        // Ignore malformed values.
      }
    }

    sessions.sort((a, b) => a.routePath.localeCompare(b.routePath));
    return sessions;
  }

  function collectStorageDiagnostics(namespacePrefix) {
    const prefix = `${namespacePrefix}:`;
    const matched = [];
    let parseErrors = 0;
    let emptyArrays = 0;

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      const rawValue = window.localStorage.getItem(key);
      let noteCount = null;
      let parseOk = false;

      try {
        const parsed = JSON.parse(rawValue || "[]");
        parseOk = Array.isArray(parsed);
        noteCount = Array.isArray(parsed) ? parsed.length : null;
        if (noteCount === 0) emptyArrays += 1;
      } catch (_error) {
        parseErrors += 1;
      }

      matched.push({ key, parseOk, noteCount });
    }

    matched.sort((a, b) => a.key.localeCompare(b.key));

    return {
      origin: window.location.origin,
      prefix,
      totalLocalStorageKeys: window.localStorage.length,
      matchedKeyCount: matched.length,
      emptyArrays,
      parseErrors,
      matched
    };
  }

  function renderStorageDiagnostics(namespacePrefix) {
    const root = document.getElementById("raa-debug-diagnostics");
    if (!root) return;

    const data = collectStorageDiagnostics(namespacePrefix);
    root.innerHTML = "";

    const summary = document.createElement("div");
    summary.className = "raa-debug-muted";
    summary.innerHTML = `
      <div>Origin: <code>${data.origin}</code></div>
      <div>Namespace: <code>${data.prefix}</code></div>
      <div>localStorage keys: ${data.totalLocalStorageKeys}</div>
      <div>Matched keys: ${data.matchedKeyCount}</div>
      <div>Matched empty arrays: ${data.emptyArrays}</div>
      <div>Parse errors: ${data.parseErrors}</div>
    `;
    root.appendChild(summary);

    if (!data.matched.length) return;

    const list = document.createElement("ul");
    list.className = "raa-debug-key-list";
    data.matched.forEach((entry) => {
      const item = document.createElement("li");
      const countLabel = entry.noteCount === null ? "unknown" : String(entry.noteCount);
      item.textContent = `${entry.key} | parse:${entry.parseOk ? "ok" : "fail"} | notes:${countLabel}`;
      list.appendChild(item);
    });
    root.appendChild(list);
  }

  function renderDebugNotesDashboard(namespacePrefix) {
    const minimap = document.getElementById("raa-debug-minimap");
    const notesRoot = document.getElementById("raa-debug-notes");
    if (!minimap || !notesRoot) return;

    const sessions = loadAllStoredSessions(namespacePrefix);
    minimap.innerHTML = "";
    notesRoot.innerHTML = "";

    if (!sessions.length) {
      minimap.innerHTML = "<p class=\"raa-debug-muted\">No stored annotations found.</p>";
      notesRoot.innerHTML = "<p class=\"raa-debug-muted\">Create annotations on any page, then refresh this screen.</p>";
      return;
    }

    const summary = document.createElement("p");
    summary.className = "raa-debug-muted";
    const totalNotes = sessions.reduce((sum, session) => sum + session.annotations.length, 0);
    summary.textContent = `${sessions.length} routes, ${totalNotes} total annotations`;
    minimap.appendChild(summary);

    const chips = document.createElement("div");
    chips.className = "raa-debug-chip-grid";
    sessions.forEach((session) => {
      const chip = document.createElement("a");
      chip.className = "raa-debug-chip";
      chip.href = `#raa-route-${encodeURIComponent(session.routePath)}`;
      chip.textContent = `${session.routePath} (${session.annotations.length})`;
      chips.appendChild(chip);
    });
    minimap.appendChild(chips);

    sessions.forEach((session) => {
      const section = document.createElement("section");
      section.className = "raa-debug-session";
      section.id = `raa-route-${encodeURIComponent(session.routePath)}`;

      const title = document.createElement("h3");
      title.textContent = session.routePath;
      section.appendChild(title);

      const list = document.createElement("ol");
      list.className = "raa-debug-list";

      session.annotations.forEach((annotation) => {
        const item = document.createElement("li");
        const tag = annotation.tag || "unlabeled";
        const priority = annotation.priority || "P2";
        const selector = annotation.selector || "Unknown";
        const noteText = annotation.notes && annotation.notes.trim() ? annotation.notes.trim() : "(no notes)";

        const label = document.createElement("strong");
        label.textContent = `[${tag}] [${priority}]`;

        const selectorRow = document.createElement("div");
        selectorRow.textContent = "Selector: ";
        const selectorCode = document.createElement("code");
        selectorCode.textContent = selector;
        selectorRow.appendChild(selectorCode);

        const textRow = document.createElement("div");
        textRow.textContent = `Text: ${annotation.text || "(input)"}`;

        const notesRow = document.createElement("div");
        notesRow.textContent = `Notes: ${noteText.replace(/\n/g, " | ")}`;

        item.appendChild(label);
        item.appendChild(selectorRow);
        item.appendChild(textRow);
        item.appendChild(notesRow);
        list.appendChild(item);
      });

      section.appendChild(list);
      notesRoot.appendChild(section);
    });
  }

  function initAnnotator() {
    const context = parseContext() || {};
    const storageKeyPrefix = context.storage_key_prefix || "rails_agent_annotator";
    const appId = context.app_id || "rails_app";
    const namespacePrefix = storageNamespacePrefix(storageKeyPrefix, appId);
    const debugPath = context.mount_path || "/rails_agent_annotator";
    const visibilityPreferenceKey = `${namespacePrefix}:__toolbar_visible`;
    renderDebugNotesDashboard(namespacePrefix);
    renderStorageDiagnostics(namespacePrefix);

    if (!document.getElementById("raa-root")) return;

    document.querySelectorAll("#" + APP_ID + ", #" + LAUNCHER_ID + ", #" + HIGHLIGHT_ID).forEach((node) => node.remove());

    const storageKey = `${namespacePrefix}:${window.location.pathname}`;
    const legacyStorageKey = `${storageKeyPrefix}:${window.location.pathname}`;

    const state = {
      selectMode: false,
      annotations: [],
      annotationTargets: new Map(),
      appliedCssByAnnotationId: new Map()
    };

    try {
      state.annotations = normalizeStoredAnnotations(JSON.parse(window.localStorage.getItem(storageKey) || "[]"));
    } catch (_error) {
      state.annotations = [];
    }

    // One-time migration from legacy (non app-scoped) storage key.
    if (!state.annotations.length) {
      try {
        const legacy = JSON.parse(window.localStorage.getItem(legacyStorageKey) || "[]");
        if (Array.isArray(legacy) && legacy.length > 0) {
          state.annotations = normalizeStoredAnnotations(legacy);
          window.localStorage.setItem(storageKey, JSON.stringify(state.annotations));
          window.localStorage.removeItem(legacyStorageKey);
        }
      } catch (_error) {
        // Ignore malformed legacy data.
      }
    }

    const ui = createUI(state, debugPath);
    if (!ui) return;

    const selectButton = ui.toolbar.querySelector('[data-action="toggle-select"]');
    const copyButton = ui.toolbar.querySelector('[data-action="copy"]');
    const closeButton = ui.toolbar.querySelector('[data-action="close"]');
    const clearButton = ui.toolbar.querySelector('[data-action="clear"]');
    const toast = ui.toolbar.querySelector('[data-role="toast"]');
    const annotationsRoot = ui.toolbar.querySelector('[data-role="annotations"]');
    let toastTimer = null;

    function saveOnly() {
      window.localStorage.setItem(storageKey, JSON.stringify(state.annotations));
    }

    function render() {
      renderAnnotationList(state, { persist, saveOnly }, annotationsRoot);
      updateLauncherState();
      applyCssEditsForAllAnnotations(state);
    }

    function persist() {
      saveOnly();
      render();
    }

    const updateSelectButton = () => {
      selectButton.classList.toggle("raa-btn-active", state.selectMode);
      selectButton.setAttribute("aria-pressed", state.selectMode ? "true" : "false");
    };

    const updateLauncherState = () => {
      const count = state.annotations.length;
      ui.launcher.textContent = count > 0 ? `Agent Annotation (${count})` : "Agent Annotation";
      ui.launcher.classList.toggle("raa-launcher-has-annotations", count > 0);
    };

    const setToolbarVisible = (visible, options = {}) => {
      const activateSelect = options.activateSelect === true;
      ui.toolbar.hidden = !visible;
      ui.launcher.hidden = visible;
      window.localStorage.setItem(visibilityPreferenceKey, visible ? "1" : "0");

      if (visible) {
        state.selectMode = activateSelect;
        updateSelectButton();
      } else {
        state.selectMode = false;
        updateSelectButton();
        ui.highlight.style.display = "none";
      }
    };

    const setHighlight = (target) => {
      if (!state.selectMode || !target || target.closest("#" + APP_ID)) {
        ui.highlight.style.display = "none";
        return;
      }

      const rect = target.getBoundingClientRect();
      ui.highlight.style.display = "block";
      ui.highlight.style.left = `${rect.left + window.scrollX}px`;
      ui.highlight.style.top = `${rect.top + window.scrollY}px`;
      ui.highlight.style.width = `${rect.width}px`;
      ui.highlight.style.height = `${rect.height}px`;
    };

    const onMouseOver = (event) => setHighlight(event.target);
    const onClick = (event) => {
      if (!state.selectMode) return;
      if (event.target.closest("#" + APP_ID)) return;

      event.preventDefault();
      event.stopPropagation();

      const target = event.target && event.target.nodeType === Node.ELEMENT_NODE ? event.target : event.target.parentElement;
      if (!target) return;

      const captured = captureElement(target);
      state.annotations.unshift(captured);
      state.annotationTargets.set(captured.id, target);
      state.selectMode = false;
      updateSelectButton();
      ui.highlight.style.display = "none";
      persist();
      window.requestAnimationFrame(() => focusAnnotationNotes(annotationsRoot, captured.id));
    };

    selectButton.addEventListener("click", () => {
      state.selectMode = !state.selectMode;
      updateSelectButton();
      if (!state.selectMode) ui.highlight.style.display = "none";
    });

    copyButton.addEventListener("click", async () => {
      const markdown = markdownFor(context, state.annotations);
      let message = "Copied markdown.";

      try {
        await navigator.clipboard.writeText(markdown);
      } catch (_error) {
        const textArea = document.createElement("textarea");
        textArea.value = markdown;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        message = "Copied markdown (fallback).";
      }

      toast.textContent = message;
      toast.hidden = false;
      toast.classList.add("raa-toast-visible");

      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.remove("raa-toast-visible");
        window.setTimeout(() => {
          toast.hidden = true;
          toast.textContent = "";
        }, 180);
      }, 1400);
    });

    closeButton.addEventListener("click", () => {
      setToolbarVisible(false);
    });

    ui.launcher.addEventListener("click", () => {
      setToolbarVisible(true, { activateSelect: true });
    });

    clearButton.addEventListener("click", () => {
      state.annotations.forEach((annotation) => clearAppliedCssForAnnotation(state, annotation));
      state.annotations = [];
      window.localStorage.removeItem(storageKey);
      persist();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape" && state.selectMode) {
        state.selectMode = false;
        updateSelectButton();
        ui.highlight.style.display = "none";
      }
    };

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);

    updateSelectButton();
    render();

    const savedVisibility = window.localStorage.getItem(visibilityPreferenceKey);
    const toolbarVisible = savedVisibility === "1";
    state.selectMode = false;
    updateSelectButton();
    setToolbarVisible(toolbarVisible, { activateSelect: false });
  }

  document.addEventListener("turbo:load", initAnnotator);
  document.addEventListener("DOMContentLoaded", initAnnotator);
})();

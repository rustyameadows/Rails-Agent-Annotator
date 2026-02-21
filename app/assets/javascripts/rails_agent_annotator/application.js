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
  const MAX_CSS_ROW_VALUE_PREVIEW = 64;
  const COLOR_FORMAT_HEX = "hex";
  const COLOR_FORMAT_RGB = "rgb";
  const COLOR_FORMAT_HSL = "hsl";
  const COLOR_FORMAT_VALUES = new Set([COLOR_FORMAT_HEX, COLOR_FORMAT_RGB, COLOR_FORMAT_HSL]);
  const COLOR_PICKER_PROPERTIES = new Set([
    "color",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color"
  ]);
  const CSS_SCOPE_EXACT = "exact";
  const CSS_SCOPE_SIMILAR = "similar";
  const CSS_SCOPE_CONTAINER = "container";
  const CSS_SCOPE_VALUES = new Set([CSS_SCOPE_EXACT, CSS_SCOPE_SIMILAR, CSS_SCOPE_CONTAINER]);
  const AUX_MODE_CSS = "css";
  const AUX_MODE_TEXT = "text";
  const CONTENT_EDIT_MODE_TEXT = "text";
  const CONTENT_EDIT_MODE_VALUE = "value";
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
      <div class="raa-shell" id="${APP_ID}">
        <div class="raa-toast" data-role="toast" hidden></div>
        <div class="raa-toolbar-main" data-role="panel">
          <div class="raa-main-header">
            <div class="raa-main-title">Agent Annotator</div>
            <div class="raa-main-header-actions">
              <a class="raa-btn" href="${debugPath}" target="_blank" rel="noopener noreferrer">Debug</a>
              <button class="raa-btn raa-btn-danger" type="button" data-action="clear">Clear</button>
              <button class="raa-btn" type="button" data-action="close">Close</button>
            </div>
          </div>
          <div class="raa-panel">
            <div data-role="annotations"></div>
          </div>
          <div class="raa-main-footer">
            <button class="raa-btn" type="button" data-action="new-selection" aria-pressed="false">New Selection</button>
            <button class="raa-btn raa-main-copy" type="button" data-action="copy">Copy MD</button>
          </div>
        </div>
        <div class="raa-toolbar-aux" data-role="aux-panel" hidden>
          <div class="raa-aux-header">
            <div class="raa-aux-title" data-role="aux-title">Editor</div>
            <button class="raa-btn" type="button" data-action="close-aux">Close</button>
          </div>
          <div class="raa-aux-target" data-role="aux-target"></div>
          <div class="raa-aux-content" data-role="aux-content"></div>
        </div>
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

  function cssEditDisplayValue(value) {
    const compact = (value || "").toString().trim().replace(/\s+/g, " ");
    if (!compact) return "(unset)";
    if (compact.length <= MAX_CSS_ROW_VALUE_PREVIEW) return compact;
    return `${compact.slice(0, MAX_CSS_ROW_VALUE_PREVIEW - 3)}...`;
  }

  function cssEditChanged(edit) {
    if (!edit) return false;
    return (edit.before || "").trim() !== (edit.after || "").trim();
  }

  function cssEditSnapshot(edit) {
    return {
      property: edit && typeof edit.property === "string" ? edit.property : "",
      before: edit && typeof edit.before === "string" ? edit.before : "",
      after: edit && typeof edit.after === "string" ? edit.after : "",
      enabled: !edit || edit.enabled !== false
    };
  }

  function clampNumber(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
  }

  function roundedAlpha(value) {
    return Math.round(clampNumber(value, 0, 1) * 1000) / 1000;
  }

  function roundedPercentFromAlpha(alpha) {
    return Math.round(clampNumber(alpha, 0, 1) * 100);
  }

  function trimNumericString(value, digits = 3) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0";
    const fixed = numeric.toFixed(digits);
    return fixed.replace(/\.?0+$/, "");
  }

  function colorChannelToHex(channel) {
    return Math.round(clampNumber(channel, 0, 255)).toString(16).padStart(2, "0");
  }

  function alphaToHex(alpha) {
    return colorChannelToHex(clampNumber(alpha, 0, 1) * 255);
  }

  function rgbaToHexString(rgba, includeAlpha = false) {
    if (!rgba) return "#000000";
    const base = `#${colorChannelToHex(rgba.r)}${colorChannelToHex(rgba.g)}${colorChannelToHex(rgba.b)}`;
    return includeAlpha ? `${base}${alphaToHex(rgba.a)}` : base;
  }

  function rgbToHsl(r, g, b) {
    const rn = clampNumber(r, 0, 255) / 255;
    const gn = clampNumber(g, 0, 255) / 255;
    const bn = clampNumber(b, 0, 255) / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;

    if (delta !== 0) {
      saturation = delta / (1 - Math.abs((2 * lightness) - 1));
      if (max === rn) hue = ((gn - bn) / delta) % 6;
      else if (max === gn) hue = ((bn - rn) / delta) + 2;
      else hue = ((rn - gn) / delta) + 4;
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
    }

    return {
      h: hue,
      s: Math.round(saturation * 100),
      l: Math.round(lightness * 100)
    };
  }

  function rgbaToRgbString(rgba) {
    if (!rgba) return "rgb(0, 0, 0)";
    const r = Math.round(clampNumber(rgba.r, 0, 255));
    const g = Math.round(clampNumber(rgba.g, 0, 255));
    const b = Math.round(clampNumber(rgba.b, 0, 255));
    const a = roundedAlpha(rgba.a);

    if (a < 1) return `rgba(${r}, ${g}, ${b}, ${trimNumericString(a)})`;
    return `rgb(${r}, ${g}, ${b})`;
  }

  function rgbaToHslString(rgba) {
    if (!rgba) return "hsl(0, 0%, 0%)";
    const { h, s, l } = rgbToHsl(rgba.r, rgba.g, rgba.b);
    const a = roundedAlpha(rgba.a);

    if (a < 1) return `hsla(${h}, ${s}%, ${l}%, ${trimNumericString(a)})`;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function normalizeColorFormat(rawFormat) {
    return COLOR_FORMAT_VALUES.has(rawFormat) ? rawFormat : COLOR_FORMAT_HEX;
  }

  function inferColorFormatFromCssValue(value) {
    const normalized = (value || "").toString().trim().toLowerCase();
    if (normalized.startsWith("#")) return COLOR_FORMAT_HEX;
    if (normalized.startsWith("hsl(") || normalized.startsWith("hsla(")) return COLOR_FORMAT_HSL;
    if (normalized.startsWith("rgb(") || normalized.startsWith("rgba(")) return COLOR_FORMAT_RGB;
    return COLOR_FORMAT_HEX;
  }

  function colorValueByFormat(rgba, format) {
    const normalized = normalizeColorFormat(format);
    const alpha = roundedAlpha(rgba && rgba.a);
    if (normalized === COLOR_FORMAT_RGB) return rgbaToRgbString({ ...rgba, a: alpha });
    if (normalized === COLOR_FORMAT_HSL) return rgbaToHslString({ ...rgba, a: alpha });
    return rgbaToHexString({ ...rgba, a: alpha }, alpha < 1);
  }

  function isColorPickerProperty(property) {
    return COLOR_PICKER_PROPERTIES.has(normalizeCssProperty(property));
  }

  function isUnsupportedColorValue(value) {
    const normalized = (value || "").toString().trim().toLowerCase();
    if (!normalized) return false;
    if (normalized.includes("gradient(")) return true;

    const hasComma = normalized.includes(",");
    const isFunctionColor = /^(rgba?|hsla?)\(/.test(normalized);
    if (hasComma && !isFunctionColor) return true;
    return false;
  }

  function parseComputedRgbColor(value) {
    const normalized = (value || "").toString().trim().toLowerCase();
    if (!normalized.startsWith("rgb")) return null;

    const parts = normalized.match(/[0-9]*\.?[0-9]+/g);
    if (!parts || parts.length < 3) return null;

    return {
      r: clampNumber(parts[0], 0, 255),
      g: clampNumber(parts[1], 0, 255),
      b: clampNumber(parts[2], 0, 255),
      a: parts.length >= 4 ? roundedAlpha(parts[3]) : 1
    };
  }

  function parseCssColorToRgba(value) {
    const raw = (value || "").toString().trim();
    if (!raw) return null;
    if (isUnsupportedColorValue(raw)) return null;
    if (!document || !document.body) return null;

    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.pointerEvents = "none";
    probe.style.color = "";
    probe.style.color = raw;

    if (!probe.style.color) return null;

    document.body.appendChild(probe);
    const computed = window.getComputedStyle ? window.getComputedStyle(probe).color : "";
    probe.remove();

    return parseComputedRgbColor(computed);
  }

  function colorUiStateForEdit(state, annotationId, edit, parsedColor) {
    if (!state || !state.cssColorUiByAnnotationId || !annotationId || !edit || !edit.id) return null;

    const existing = state.cssColorUiByAnnotationId.get(annotationId);
    if (existing && existing.editId === edit.id) {
      return {
        editId: existing.editId,
        format: normalizeColorFormat(existing.format),
        alpha: roundedAlpha(existing.alpha)
      };
    }

    const nextState = {
      editId: edit.id,
      format: inferColorFormatFromCssValue(edit.after),
      alpha: roundedAlpha(parsedColor && typeof parsedColor.a === "number" ? parsedColor.a : 1)
    };
    state.cssColorUiByAnnotationId.set(annotationId, nextState);
    return nextState;
  }

  function applyCssEditSnapshot(edit, snapshot) {
    if (!edit || !snapshot) return;
    edit.property = normalizeCssProperty(snapshot.property);
    edit.before = (snapshot.before || "").toString();
    edit.after = (snapshot.after || "").toString();
    edit.enabled = snapshot.enabled !== false;
  }

  function activeCssEditRowId(state, annotationId) {
    if (!state || !annotationId || !state.activeCssEditRowByAnnotationId) return null;
    return state.activeCssEditRowByAnnotationId.get(annotationId) || null;
  }

  function clearActiveCssEditRow(state, annotationId) {
    if (!state || !annotationId) return;
    if (state.activeCssEditRowByAnnotationId) state.activeCssEditRowByAnnotationId.delete(annotationId);
    if (state.cssEditDraftByAnnotationId) state.cssEditDraftByAnnotationId.delete(annotationId);
    if (state.cssColorUiByAnnotationId) state.cssColorUiByAnnotationId.delete(annotationId);
  }

  function clearAllActiveCssEditRows(state) {
    if (!state) return;
    if (state.activeCssEditRowByAnnotationId) state.activeCssEditRowByAnnotationId.clear();
    if (state.cssEditDraftByAnnotationId) state.cssEditDraftByAnnotationId.clear();
    if (state.cssColorUiByAnnotationId) state.cssColorUiByAnnotationId.clear();
  }

  function setActiveCssEditRow(state, annotationId, edit) {
    if (!state || !annotationId || !edit || !edit.id) return;
    if (!state.activeCssEditRowByAnnotationId || !state.cssEditDraftByAnnotationId) return;

    state.activeCssEditRowByAnnotationId.set(annotationId, edit.id);
    state.cssEditDraftByAnnotationId.set(annotationId, {
      editId: edit.id,
      snapshot: cssEditSnapshot(edit)
    });
  }

  function restoreActiveCssEditRowFromDraft(state, annotationId, edit) {
    if (!state || !annotationId || !edit || !edit.id || !state.cssEditDraftByAnnotationId) return false;
    const draft = state.cssEditDraftByAnnotationId.get(annotationId);
    if (!draft || draft.editId !== edit.id || !draft.snapshot) return false;

    applyCssEditSnapshot(edit, draft.snapshot);
    return true;
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

  function normalizedContentEditMode(mode, fallbackMode) {
    if (mode === CONTENT_EDIT_MODE_VALUE) return CONTENT_EDIT_MODE_VALUE;
    if (mode === CONTENT_EDIT_MODE_TEXT) return CONTENT_EDIT_MODE_TEXT;
    return fallbackMode === CONTENT_EDIT_MODE_VALUE ? CONTENT_EDIT_MODE_VALUE : CONTENT_EDIT_MODE_TEXT;
  }

  function normalizeContentEdit(rawEdit, fallbackMode) {
    const source = rawEdit && typeof rawEdit === "object" ? rawEdit : {};
    const mode = normalizedContentEditMode(source.mode, fallbackMode);
    const before = typeof source.before === "string" ? source.before : "";
    const after = typeof source.after === "string" ? source.after : before;

    return {
      before,
      after,
      enabled: source.enabled !== false,
      mode
    };
  }

  function canEditInputValue(element) {
    if (!(element instanceof HTMLInputElement)) return false;
    const blocked = new Set(["button", "submit", "reset", "checkbox", "radio", "file", "color", "range", "hidden", "image"]);
    const type = (element.type || "text").toLowerCase();
    return !blocked.has(type);
  }

  function canEditTextContent(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (element instanceof HTMLInputElement) return false;
    if (element instanceof HTMLTextAreaElement) return false;

    const tag = (element.tagName || "").toLowerCase();
    if (["img", "svg", "path", "video", "audio", "canvas", "iframe", "select", "option", "script", "style", "link"].includes(tag)) {
      return false;
    }

    return element.children.length === 0;
  }

  function contentEditModeForElement(element) {
    if (!element) return null;
    if (element instanceof HTMLTextAreaElement) return CONTENT_EDIT_MODE_VALUE;
    if (canEditInputValue(element)) return CONTENT_EDIT_MODE_VALUE;
    if (canEditTextContent(element)) return CONTENT_EDIT_MODE_TEXT;
    return null;
  }

  function readContentEditValue(element, mode) {
    if (!element || !mode) return "";

    if (mode === CONTENT_EDIT_MODE_VALUE && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return typeof element.value === "string" ? element.value : "";
    }

    if (mode === CONTENT_EDIT_MODE_TEXT && canEditTextContent(element)) {
      return typeof element.textContent === "string" ? element.textContent : "";
    }

    return "";
  }

  function applyContentEditValue(element, mode, value) {
    if (!element || !mode) return false;

    if (mode === CONTENT_EDIT_MODE_VALUE && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      element.value = value;
      return true;
    }

    if (mode === CONTENT_EDIT_MODE_TEXT && canEditTextContent(element)) {
      element.textContent = value;
      return true;
    }

    return false;
  }

  function fallbackContentModeForTag(tagName) {
    const normalizedTag = (tagName || "").toString().trim().toLowerCase();
    if (normalizedTag === "input" || normalizedTag === "textarea") return CONTENT_EDIT_MODE_VALUE;
    return CONTENT_EDIT_MODE_TEXT;
  }

  function contentEditStateForAnnotation(state, annotation) {
    const fallbackMode = fallbackContentModeForTag(annotation && annotation.element_tag);
    const target = primaryElementForAnnotation(state, annotation);
    const inferredMode = contentEditModeForElement(target);
    const normalized = normalizeContentEdit(annotation && annotation.content_edit, inferredMode || fallbackMode);
    const wasSupported = annotation && annotation.content_edit_supported === true;

    if (inferredMode && target) {
      const baseline = readContentEditValue(target, inferredMode);
      const previousBefore = normalized.before;
      const shouldInitializeBaseline = !wasSupported || previousBefore.length === 0;
      const shouldMirrorBaseline = normalized.after === previousBefore;

      normalized.mode = inferredMode;
      if (shouldInitializeBaseline) {
        normalized.before = baseline;
        if (shouldMirrorBaseline) normalized.after = baseline;
      }
    }

    if (annotation && typeof annotation === "object") {
      annotation.content_edit = normalized;
      annotation.content_edit_supported = inferredMode ? true : annotation.content_edit_supported === true;
    }

    return {
      target,
      mode: normalized.mode,
      edit: normalized,
      supported: inferredMode ? true : annotation && annotation.content_edit_supported === true
    };
  }

  function changedContentEdit(annotation) {
    if (!annotation || annotation.content_edit_supported !== true) return null;

    const edit = normalizeContentEdit(annotation.content_edit, fallbackContentModeForTag(annotation.element_tag));
    if (!edit.enabled) return null;
    if (edit.after === edit.before) return null;
    return edit;
  }

  function markdownInlineText(value) {
    const normalized = (value || "").toString().replace(/\s+/g, " ").trim();
    if (!normalized) return "(empty)";
    return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
  }

  function contentEditMarkdownLine(annotation) {
    const edit = changedContentEdit(annotation);
    if (!edit) return null;
    return `- Text Edit: ${markdownInlineText(edit.before)} -> ${markdownInlineText(edit.after)}`;
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
      normalized.content_edit = normalizeContentEdit(annotation.content_edit, fallbackContentModeForTag(annotation.element_tag));
      normalized.content_edit_supported = annotation.content_edit_supported === true;
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

  function clearAppliedContentEditForAnnotation(state, annotation) {
    if (!state || !annotation || !annotation.id) return;

    const applied = state.appliedContentByAnnotationId.get(annotation.id);
    const target = resolveAnnotationElement(state, annotation);

    if (applied && applied.element && applied.element.isConnected) {
      applyContentEditValue(applied.element, applied.mode, applied.before);
    } else if (target) {
      const mode = normalizedContentEditMode(annotation.content_edit && annotation.content_edit.mode, fallbackContentModeForTag(annotation.element_tag));
      const baseline = annotation.content_edit && typeof annotation.content_edit.before === "string" ? annotation.content_edit.before : "";
      applyContentEditValue(target, mode, baseline);
    }

    state.appliedContentByAnnotationId.delete(annotation.id);
  }

  function applyContentEditForAnnotation(state, annotation) {
    if (!state || !annotation || !annotation.id) return;

    clearAppliedContentEditForAnnotation(state, annotation);

    const contentState = contentEditStateForAnnotation(state, annotation);
    if (!contentState.supported || !contentState.target) return;

    const edit = contentState.edit;
    if (!edit.enabled || edit.after === edit.before) return;

    const applied = applyContentEditValue(contentState.target, contentState.mode, edit.after);
    if (!applied) return;

    state.appliedContentByAnnotationId.set(annotation.id, {
      element: contentState.target,
      mode: contentState.mode,
      before: edit.before
    });
  }

  function applyContentEditsForAllAnnotations(state) {
    if (!state || !Array.isArray(state.annotations)) return;
    state.annotations.forEach((annotation) => applyContentEditForAnnotation(state, annotation));
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
    const contentMode = contentEditModeForElement(element);
    const contentBaseline = contentMode ? readContentEditValue(element, contentMode) : "";

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
      content_edit_supported: !!contentMode,
      content_edit: normalizeContentEdit({
        mode: contentMode || CONTENT_EDIT_MODE_TEXT,
        before: contentBaseline,
        after: contentBaseline,
        enabled: true
      }, contentMode || fallbackContentModeForTag(element.tagName)),
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
      lines.push("1)", "- Notes:", "  - No annotations captured.");
      return lines.join("\n");
    }

    annotations.forEach((annotation, index) => {
      const exactSelector = annotation.selector_exact || annotation.selector || "Unknown";
      const scopeSelector = selectedScopeSelector(annotation) || "Unknown";

      lines.push(`${index + 1})`);
      lines.push(`- Selector (Exact): ${exactSelector}`);
      lines.push(`- Text: ${annotation.text || "(input)"}`);

      const cssEditLines = cssEditsMarkdownLines(annotation);
      if (cssEditLines.length) {
        lines.push(`- CSS Scope Selector: ${scopeSelector}`);
        lines.push("- CSS Edits:");
        cssEditLines.forEach((line) => lines.push(line));
      }

      const contentLine = contentEditMarkdownLine(annotation);
      if (contentLine) lines.push(contentLine);

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

  function annotationTitle(annotation) {
    return annotation.selector_exact || annotation.selector || annotation.element_tag || "Unknown";
  }

  function renderCssEditorForAnnotation(state, annotation, handlers, root) {
    const persist = handlers && typeof handlers.persist === "function" ? handlers.persist : () => {};
    const saveOnly = handlers && typeof handlers.saveOnly === "function" ? handlers.saveOnly : () => {};
    const refresh = handlers && typeof handlers.refresh === "function" ? handlers.refresh : () => {};
    annotation.css_edits = normalizedCssEdits(annotation.css_edits);
    annotation.css_scope = selectedCssScope(annotation);
    const annotationId = annotation.id;

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

    const cssRows = document.createElement("ul");
    cssRows.className = "raa-css-editor-rows";

    if (!annotation.css_edits.length) {
      const empty = document.createElement("div");
      empty.className = "raa-css-editor-empty";
      empty.textContent = "No CSS edit rows yet.";
      cssRows.appendChild(empty);
    } else {
      const activeEditId = activeCssEditRowId(state, annotationId);

      annotation.css_edits.forEach((edit) => {
        const row = document.createElement("li");
        row.className = "raa-css-edit-row";
        const isActiveRow = activeEditId === edit.id;

        if (edit.enabled === false) row.classList.add("raa-css-edit-row-disabled");
        if (cssEditChanged(edit)) row.classList.add("raa-css-edit-row-changed");

        const colorPickerEligible = isColorPickerProperty(edit.property);
        const parsedColorValue = colorPickerEligible ? parseCssColorToRgba(edit.after) : null;
        const propertyIsValid = !edit.property || isValidCssProperty(edit.property);
        const valueLooksValid = !edit.after || isSafeCssValue(edit.after);
        const colorValueLooksValid = !colorPickerEligible || !edit.after || !!parsedColorValue;
        if (isActiveRow && (!propertyIsValid || !valueLooksValid || !colorValueLooksValid)) {
          row.classList.add("raa-css-edit-row-invalid");
        }

        const summary = document.createElement("div");
        summary.className = "raa-css-row-summary";

        const summaryLabel = document.createElement("div");
        summaryLabel.className = "raa-css-row-label";
        summaryLabel.textContent = edit.property || "(property)";

        const summaryValue = document.createElement("div");
        summaryValue.className = "raa-css-row-value";
        summaryValue.textContent = cssEditDisplayValue(edit.after);

        const badge = document.createElement("span");
        badge.className = "raa-css-row-badge";
        badge.textContent = edit.enabled === false ? "Disabled" : "Enabled";
        if (edit.enabled === false) badge.classList.add("raa-css-row-badge-disabled");

        const summaryActions = document.createElement("div");
        summaryActions.className = "raa-css-row-actions";

        const editRowButton = document.createElement("button");
        editRowButton.type = "button";
        editRowButton.className = "raa-btn";
        editRowButton.textContent = isActiveRow ? "Editing" : "Edit";
        editRowButton.setAttribute("aria-expanded", isActiveRow ? "true" : "false");
        editRowButton.addEventListener("click", () => {
          if (!annotationId || isActiveRow) return;
          setActiveCssEditRow(state, annotationId, edit);
          refresh();
        });
        summaryActions.appendChild(editRowButton);

        summary.appendChild(summaryLabel);
        summary.appendChild(summaryValue);
        summary.appendChild(badge);
        summary.appendChild(summaryActions);
        row.appendChild(summary);

        if (!isActiveRow) {
          cssRows.appendChild(row);
          return;
        }

        const editor = document.createElement("div");
        editor.className = "raa-css-row-editor";

        const enabled = document.createElement("input");
        enabled.type = "checkbox";
        enabled.checked = edit.enabled !== false;
        enabled.title = "Enable this edit";
        enabled.addEventListener("change", (event) => {
          edit.enabled = event.target.checked;
          applyCssEditsForAnnotation(state, annotation);
          saveOnly();
        });

        const enabledWrap = document.createElement("label");
        enabledWrap.className = "raa-css-row-enabled";
        const enabledLabel = document.createElement("span");
        enabledLabel.textContent = "Enable this edit";
        enabledWrap.appendChild(enabled);
        enabledWrap.appendChild(enabledLabel);

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
          saveOnly();
          refresh();
        });

        const valueInput = document.createElement("input");
        valueInput.type = "text";
        valueInput.placeholder = "value";
        valueInput.value = edit.after || "";

        const inputRow = document.createElement("div");
        inputRow.className = "raa-css-row-editor-inputs";
        inputRow.appendChild(propertyInput);
        inputRow.appendChild(valueInput);

        const colorStateForValue = (rawValue) => {
          const value = typeof rawValue === "string" ? rawValue : (edit.after || "");
          const eligible = isColorPickerProperty(edit.property);
          const unsupported = eligible && isUnsupportedColorValue(value);
          const parsed = eligible && !unsupported ? parseCssColorToRgba(value) : null;
          return { eligible, unsupported, parsed, value };
        };

        const updateRowValidity = (colorState) => {
          const nextColorState = colorState || colorStateForValue(edit.after);
          const currentValue = (edit.after || "").toString().trim();
          const propertyValid = !edit.property || isValidCssProperty(edit.property);
          const safeValue = !currentValue || isSafeCssValue(currentValue);
          const colorValueValid = !nextColorState.eligible || !currentValue || !!nextColorState.parsed;
          row.classList.toggle("raa-css-edit-row-invalid", !propertyValid || !safeValue || !colorValueValid);
          return nextColorState;
        };

        let colorUiState = null;
        let colorControls = null;
        let colorInput = null;
        let colorFormatSelect = null;
        let colorAlphaRange = null;
        let colorAlphaValue = null;
        let colorMeta = null;

        const persistColorUiState = () => {
          if (!annotationId || !colorUiState || !state.cssColorUiByAnnotationId) return;
          state.cssColorUiByAnnotationId.set(annotationId, {
            editId: edit.id,
            format: normalizeColorFormat(colorUiState.format),
            alpha: roundedAlpha(colorUiState.alpha)
          });
        };

        const ensureColorUiState = (parsedColor) => {
          if (!colorUiState) {
            colorUiState = colorUiStateForEdit(state, annotationId, edit, parsedColor) || {
              editId: edit.id,
              format: inferColorFormatFromCssValue(edit.after),
              alpha: roundedAlpha(parsedColor && typeof parsedColor.a === "number" ? parsedColor.a : 1)
            };
          }
          colorUiState.editId = edit.id;
          colorUiState.format = normalizeColorFormat(colorUiState.format);
          colorUiState.alpha = roundedAlpha(colorUiState.alpha);
          persistColorUiState();
          return colorUiState;
        };

        const syncColorControls = (colorState) => {
          if (!colorControls || !colorInput || !colorFormatSelect || !colorAlphaRange || !colorAlphaValue || !colorMeta) return;

          const ui = ensureColorUiState(colorState && colorState.parsed);
          const canConvert = !!(colorState && colorState.parsed);

          colorInput.disabled = !canConvert;
          colorFormatSelect.disabled = !canConvert;
          colorAlphaRange.disabled = !canConvert;

          if (canConvert) {
            colorInput.value = rgbaToHexString(colorState.parsed, false);
            colorFormatSelect.value = normalizeColorFormat(ui.format);
          }

          const alphaPercent = roundedPercentFromAlpha(ui.alpha);
          colorAlphaRange.value = `${alphaPercent}`;
          colorAlphaValue.textContent = `${alphaPercent}%`;

          if (canConvert) {
            colorMeta.textContent = "";
          } else if (colorState && colorState.unsupported) {
            colorMeta.textContent = "Picker unavailable for this value.";
          } else if ((edit.after || "").toString().trim().length === 0) {
            colorMeta.textContent = "Enter a color value to enable picker.";
          } else {
            colorMeta.textContent = "Picker unavailable for this value.";
          }
        };

        const applyEditedValue = (nextValue, options = {}) => {
          edit.after = (nextValue || "").toString();
          valueInput.value = edit.after;
          applyCssEditsForAnnotation(state, annotation);
          saveOnly();

          const colorState = updateRowValidity(colorStateForValue(edit.after));
          if (colorState.eligible) {
            const parsed = colorState.parsed;
            const ui = ensureColorUiState(parsed);
            if (parsed && options.syncColorUiFromText) {
              ui.format = inferColorFormatFromCssValue(edit.after);
              ui.alpha = roundedAlpha(parsed.a);
              persistColorUiState();
            }
            syncColorControls(colorState);
          }
        };

        valueInput.addEventListener("input", (event) => {
          applyEditedValue(event.target.value, { syncColorUiFromText: true });
        });
        valueInput.addEventListener("change", (event) => {
          applyEditedValue(event.target.value, { syncColorUiFromText: true });
        });

        const initialColorState = updateRowValidity(colorStateForValue(edit.after));
        if (initialColorState.eligible) {
          colorControls = document.createElement("div");
          colorControls.className = "raa-css-color-controls";

          const colorHeader = document.createElement("div");
          colorHeader.className = "raa-css-color-meta";
          colorHeader.textContent = "Color controls";

          const colorRow = document.createElement("div");
          colorRow.className = "raa-css-color-row";

          colorInput = document.createElement("input");
          colorInput.type = "color";
          colorInput.className = "raa-css-color-chip";
          colorInput.setAttribute("aria-label", "Color picker");

          colorFormatSelect = document.createElement("select");
          colorFormatSelect.className = "raa-css-color-format";
          colorFormatSelect.setAttribute("aria-label", "Color format");
          [
            { value: COLOR_FORMAT_HEX, label: "HEX" },
            { value: COLOR_FORMAT_RGB, label: "RGB" },
            { value: COLOR_FORMAT_HSL, label: "HSL" }
          ].forEach((optionData) => {
            const option = document.createElement("option");
            option.value = optionData.value;
            option.textContent = optionData.label;
            colorFormatSelect.appendChild(option);
          });

          colorRow.appendChild(colorInput);
          colorRow.appendChild(colorFormatSelect);

          const alphaWrap = document.createElement("div");
          alphaWrap.className = "raa-css-color-alpha";

          const alphaLabel = document.createElement("span");
          alphaLabel.textContent = "Alpha";

          colorAlphaRange = document.createElement("input");
          colorAlphaRange.type = "range";
          colorAlphaRange.min = "0";
          colorAlphaRange.max = "100";
          colorAlphaRange.step = "1";

          colorAlphaValue = document.createElement("span");
          colorAlphaValue.className = "raa-css-color-alpha-value";

          alphaWrap.appendChild(alphaLabel);
          alphaWrap.appendChild(colorAlphaRange);
          alphaWrap.appendChild(colorAlphaValue);

          colorMeta = document.createElement("div");
          colorMeta.className = "raa-css-color-meta";

          colorControls.appendChild(colorHeader);
          colorControls.appendChild(colorRow);
          colorControls.appendChild(alphaWrap);
          colorControls.appendChild(colorMeta);

          colorInput.addEventListener("input", (event) => {
            const parsed = parseCssColorToRgba(event.target.value);
            if (!parsed) return;
            const ui = ensureColorUiState(parsed);
            const nextColor = { ...parsed, a: roundedAlpha(ui.alpha) };
            applyEditedValue(colorValueByFormat(nextColor, ui.format));
          });

          colorFormatSelect.addEventListener("change", (event) => {
            const parsed = parseCssColorToRgba(edit.after);
            if (!parsed) return;
            const ui = ensureColorUiState(parsed);
            ui.format = normalizeColorFormat(event.target.value);
            persistColorUiState();
            const nextColor = { ...parsed, a: roundedAlpha(ui.alpha) };
            applyEditedValue(colorValueByFormat(nextColor, ui.format));
          });

          colorAlphaRange.addEventListener("input", (event) => {
            const parsed = parseCssColorToRgba(edit.after);
            if (!parsed) return;
            const ui = ensureColorUiState(parsed);
            ui.alpha = roundedAlpha(Number(event.target.value) / 100);
            persistColorUiState();
            const nextColor = { ...parsed, a: ui.alpha };
            applyEditedValue(colorValueByFormat(nextColor, ui.format));
          });

          syncColorControls(initialColorState);
        }

        const baseline = document.createElement("div");
        baseline.className = "raa-css-edit-baseline";
        baseline.textContent = `base: ${edit.before && edit.before.length ? edit.before : "(unset)"}`;

        const rowEditorActions = document.createElement("div");
        rowEditorActions.className = "raa-css-row-editor-actions";

        const saveRow = document.createElement("button");
        saveRow.type = "button";
        saveRow.className = "raa-btn";
        saveRow.textContent = "Save";
        saveRow.addEventListener("click", () => {
          clearActiveCssEditRow(state, annotationId);
          persist();
        });

        const cancelRow = document.createElement("button");
        cancelRow.type = "button";
        cancelRow.className = "raa-btn";
        cancelRow.textContent = "Cancel";
        cancelRow.addEventListener("click", () => {
          restoreActiveCssEditRowFromDraft(state, annotationId, edit);
          applyCssEditsForAnnotation(state, annotation);
          clearActiveCssEditRow(state, annotationId);
          persist();
        });

        const removeCssEdit = document.createElement("button");
        removeCssEdit.type = "button";
        removeCssEdit.className = "raa-btn raa-btn-danger";
        removeCssEdit.textContent = "Remove";
        removeCssEdit.setAttribute("aria-label", "Remove CSS edit row");
        removeCssEdit.addEventListener("click", () => {
          annotation.css_edits = annotation.css_edits.filter((row2) => row2.id !== edit.id);
          clearActiveCssEditRow(state, annotationId);
          applyCssEditsForAnnotation(state, annotation);
          persist();
        });

        rowEditorActions.appendChild(saveRow);
        rowEditorActions.appendChild(cancelRow);
        rowEditorActions.appendChild(removeCssEdit);

        editor.appendChild(enabledWrap);
        editor.appendChild(inputRow);
        if (colorControls) editor.appendChild(colorControls);
        editor.appendChild(baseline);
        editor.appendChild(rowEditorActions);
        row.appendChild(editor);
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
      const nextEdit = createCssEdit("", "", "", true);
      annotation.css_edits.push(nextEdit);
      setActiveCssEditRow(state, annotationId, nextEdit);
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
      clearActiveCssEditRow(state, annotationId);
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
    root.appendChild(cssEditor);
  }

  function renderTextEditorForAnnotation(state, annotation, handlers, root) {
    const persist = handlers && typeof handlers.persist === "function" ? handlers.persist : () => {};
    const saveOnly = handlers && typeof handlers.saveOnly === "function" ? handlers.saveOnly : () => {};
    const contentState = contentEditStateForAnnotation(state, annotation);

    const editor = document.createElement("div");
    editor.className = "raa-text-editor";

    const header = document.createElement("div");
    header.className = "raa-css-editor-header";
    header.textContent = "Text Rewrite (Live Preview)";
    editor.appendChild(header);

    if (!contentState.target || !contentEditModeForElement(contentState.target)) {
      const empty = document.createElement("div");
      empty.className = "raa-css-editor-empty";
      empty.textContent = "Live text rewrite is unavailable for this element type.";
      editor.appendChild(empty);
      root.appendChild(editor);
      return;
    }

    annotation.content_edit_supported = true;
    annotation.content_edit = contentState.edit;

    const modeMeta = document.createElement("div");
    modeMeta.className = "raa-css-editor-hint";
    modeMeta.textContent = contentState.mode === CONTENT_EDIT_MODE_VALUE
      ? "Editing form value on this element."
      : "Editing text content on this element.";
    editor.appendChild(modeMeta);

    const enabledRow = document.createElement("label");
    enabledRow.className = "raa-text-editor-toggle";
    const enabledCheckbox = document.createElement("input");
    enabledCheckbox.type = "checkbox";
    enabledCheckbox.checked = contentState.edit.enabled !== false;
    enabledCheckbox.addEventListener("change", (event) => {
      annotation.content_edit.enabled = event.target.checked;
      applyContentEditForAnnotation(state, annotation);
      persist();
    });
    const enabledLabel = document.createElement("span");
    enabledLabel.textContent = "Enable rewrite";
    enabledRow.appendChild(enabledCheckbox);
    enabledRow.appendChild(enabledLabel);
    editor.appendChild(enabledRow);

    const textInput = document.createElement("textarea");
    textInput.className = "raa-text-editor-input";
    textInput.value = contentState.edit.after || "";
    textInput.addEventListener("input", (event) => {
      annotation.content_edit.after = event.target.value;
      applyContentEditForAnnotation(state, annotation);
      saveOnly();
    });
    textInput.addEventListener("change", (event) => {
      annotation.content_edit.after = event.target.value;
      applyContentEditForAnnotation(state, annotation);
      persist();
    });
    editor.appendChild(textInput);

    const baseline = document.createElement("div");
    baseline.className = "raa-css-edit-baseline";
    baseline.textContent = `base: ${contentState.edit.before.length ? contentState.edit.before : "(empty)"}`;
    editor.appendChild(baseline);

    const actions = document.createElement("div");
    actions.className = "raa-css-editor-actions";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "raa-btn";
    reset.textContent = "Reset Text";
    reset.addEventListener("click", () => {
      const before = annotation.content_edit && typeof annotation.content_edit.before === "string"
        ? annotation.content_edit.before
        : "";
      annotation.content_edit.after = before;
      annotation.content_edit.enabled = true;
      applyContentEditForAnnotation(state, annotation);
      persist();
    });
    actions.appendChild(reset);
    editor.appendChild(actions);
    root.appendChild(editor);
  }

  function renderAuxPanel(state, handlers, panelRoot, titleRoot, targetRoot, contentRoot) {
    if (!panelRoot || !titleRoot || !targetRoot || !contentRoot) return;
    const refresh = handlers && typeof handlers.refresh === "function" ? handlers.refresh : () => {};

    if (!state.annotations.length || !state.activeAnnotationId || !state.auxPanelMode) {
      panelRoot.hidden = true;
      panelRoot.style.display = "none";
      titleRoot.textContent = "Editor";
      targetRoot.textContent = "";
      contentRoot.innerHTML = "";
      return;
    }

    const activeIndex = state.annotations.findIndex((annotation) => annotation.id === state.activeAnnotationId);
    if (activeIndex < 0) {
      panelRoot.hidden = true;
      panelRoot.style.display = "none";
      return;
    }

    const annotation = state.annotations[activeIndex];
    panelRoot.hidden = false;
    panelRoot.style.display = "flex";
    titleRoot.textContent = state.auxPanelMode === AUX_MODE_TEXT ? "Text Editor" : "CSS Editor";
    targetRoot.textContent = `${activeIndex + 1}. ${annotationTitle(annotation)}`;
    contentRoot.innerHTML = "";

    const modeSwitch = document.createElement("div");
    modeSwitch.className = "raa-aux-mode-row";

    const cssTab = document.createElement("button");
    cssTab.type = "button";
    cssTab.className = "raa-btn";
    cssTab.textContent = "Edit CSS";
    if (state.auxPanelMode === AUX_MODE_CSS) cssTab.classList.add("raa-btn-active");
    cssTab.addEventListener("click", () => {
      if (state.auxPanelMode !== AUX_MODE_CSS) clearActiveCssEditRow(state, annotation.id);
      state.auxPanelMode = AUX_MODE_CSS;
      refresh();
    });

    const textTab = document.createElement("button");
    textTab.type = "button";
    textTab.className = "raa-btn";
    textTab.textContent = "Edit Text";
    if (state.auxPanelMode === AUX_MODE_TEXT) textTab.classList.add("raa-btn-active");
    textTab.addEventListener("click", () => {
      if (state.auxPanelMode !== AUX_MODE_TEXT) clearActiveCssEditRow(state, annotation.id);
      state.auxPanelMode = AUX_MODE_TEXT;
      refresh();
    });

    modeSwitch.appendChild(cssTab);
    modeSwitch.appendChild(textTab);
    contentRoot.appendChild(modeSwitch);

    if (state.auxPanelMode === AUX_MODE_TEXT) {
      renderTextEditorForAnnotation(state, annotation, handlers, contentRoot);
    } else {
      renderCssEditorForAnnotation(state, annotation, handlers, contentRoot);
    }
  }

  function renderAnnotationList(state, handlers, list) {
    if (!list) return;
    list.innerHTML = "";

    const persist = handlers && typeof handlers.persist === "function" ? handlers.persist : () => {};
    const saveOnly = handlers && typeof handlers.saveOnly === "function" ? handlers.saveOnly : () => {};
    const refresh = handlers && typeof handlers.refresh === "function" ? handlers.refresh : () => {};
    const openAux = handlers && typeof handlers.openAux === "function" ? handlers.openAux : () => {};

    if (!state.annotations.length) {
      const empty = document.createElement("div");
      empty.className = "raa-selection-empty";
      empty.textContent = "No selections yet. Click New Selection to capture an element.";
      list.appendChild(empty);
      return;
    }

    state.annotations.forEach((annotation, index) => {
      annotation.css_edits = normalizedCssEdits(annotation.css_edits);
      annotation.css_scope = selectedCssScope(annotation);
      annotation.content_edit = normalizeContentEdit(annotation.content_edit, fallbackContentModeForTag(annotation.element_tag));

      const expanded = state.expandedAnnotationIds.has(annotation.id);
      const item = document.createElement("div");
      item.className = "raa-selection-item";

      const header = document.createElement("div");
      header.className = "raa-selection-header";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "raa-selection-toggle";
      toggle.textContent = expanded ? "▾" : "▸";
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.setAttribute("aria-label", expanded ? "Collapse selection" : "Expand selection");
      toggle.addEventListener("click", () => {
        if (state.expandedAnnotationIds.has(annotation.id)) {
          state.expandedAnnotationIds.delete(annotation.id);
        } else {
          state.expandedAnnotationIds.add(annotation.id);
        }
        refresh();
      });

      const title = document.createElement("div");
      title.className = "raa-selection-title";
      title.textContent = `${index + 1}. ${annotationTitle(annotation)}`;

      const headerActions = document.createElement("div");
      headerActions.className = "raa-selection-header-actions";

      const editCss = document.createElement("button");
      editCss.type = "button";
      editCss.className = "raa-btn";
      editCss.textContent = "Edit CSS";
      editCss.addEventListener("click", () => openAux(annotation.id, AUX_MODE_CSS));

      const editText = document.createElement("button");
      editText.type = "button";
      editText.className = "raa-btn";
      editText.textContent = "Edit Text";
      editText.addEventListener("click", () => openAux(annotation.id, AUX_MODE_TEXT));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "raa-btn raa-btn-danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        clearAppliedCssForAnnotation(state, annotation);
        clearAppliedContentEditForAnnotation(state, annotation);
        clearActiveCssEditRow(state, annotation.id);
        state.annotations = state.annotations.filter((item2) => item2.id !== annotation.id);
        state.expandedAnnotationIds.delete(annotation.id);
        if (state.activeAnnotationId === annotation.id) {
          state.activeAnnotationId = state.annotations[0] ? state.annotations[0].id : null;
          if (!state.activeAnnotationId) state.auxPanelMode = null;
        }
        persist();
      });

      header.appendChild(toggle);
      header.appendChild(title);
      headerActions.appendChild(editCss);
      headerActions.appendChild(editText);
      headerActions.appendChild(remove);
      header.appendChild(headerActions);
      item.appendChild(header);

      if (expanded) {
        const body = document.createElement("div");
        body.className = "raa-selection-body";

        const notesLabel = document.createElement("div");
        notesLabel.className = "raa-notes-label";
        notesLabel.textContent = "Notes:";
        body.appendChild(notesLabel);

        const notes = document.createElement("textarea");
        notes.placeholder = "Write annotation notes...";
        notes.value = annotation.notes || "";
        notes.dataset.annotationId = annotation.id;
        notes.addEventListener("input", (event) => {
          annotation.notes = event.target.value;
          saveOnly();
        });
        notes.addEventListener("change", (event) => {
          annotation.notes = event.target.value;
          persist();
        });
        body.appendChild(notes);

        item.appendChild(body);
      }

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
    launcher.textContent = "Agent Annotator";
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
        const selector = annotation.selector || "Unknown";
        const noteText = annotation.notes && annotation.notes.trim() ? annotation.notes.trim() : "(no notes)";

        const label = document.createElement("strong");
        label.textContent = "Selection";

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
      appliedCssByAnnotationId: new Map(),
      appliedContentByAnnotationId: new Map(),
      activeCssEditRowByAnnotationId: new Map(),
      cssEditDraftByAnnotationId: new Map(),
      cssColorUiByAnnotationId: new Map(),
      activeAnnotationId: null,
      auxPanelMode: null,
      expandedAnnotationIds: new Set()
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

    if (state.annotations.length > 0) {
      state.activeAnnotationId = state.annotations[0].id;
      state.expandedAnnotationIds = new Set([state.annotations[0].id]);
    }

    const ui = createUI(state, debugPath);
    if (!ui) return;

    const newSelectionButton = ui.toolbar.querySelector('[data-action="new-selection"]');
    const copyButton = ui.toolbar.querySelector('[data-action="copy"]');
    const closeButton = ui.toolbar.querySelector('[data-action="close"]');
    const clearButton = ui.toolbar.querySelector('[data-action="clear"]');
    const closeAuxButton = ui.toolbar.querySelector('[data-action="close-aux"]');
    const toast = ui.toolbar.querySelector('[data-role="toast"]');
    const annotationsRoot = ui.toolbar.querySelector('[data-role="annotations"]');
    const auxPanelRoot = ui.toolbar.querySelector('[data-role="aux-panel"]');
    const auxTitleRoot = ui.toolbar.querySelector('[data-role="aux-title"]');
    const auxTargetRoot = ui.toolbar.querySelector('[data-role="aux-target"]');
    const auxContentRoot = ui.toolbar.querySelector('[data-role="aux-content"]');
    let toastTimer = null;

    function saveOnly() {
      window.localStorage.setItem(storageKey, JSON.stringify(state.annotations));
    }

    function ensureActiveAnnotation() {
      if (!state.annotations.length) {
        state.activeAnnotationId = null;
        state.auxPanelMode = null;
        clearAllActiveCssEditRows(state);
        state.expandedAnnotationIds.clear();
        return;
      }

      const activeExists = state.annotations.some((annotation) => annotation.id === state.activeAnnotationId);
      if (!activeExists) state.activeAnnotationId = state.annotations[0].id;
    }

    function openAuxPanel(annotationId, mode) {
      if (!annotationId) return;
      if (state.auxPanelMode && state.auxPanelMode !== mode) clearAllActiveCssEditRows(state);
      if (mode !== AUX_MODE_CSS) clearActiveCssEditRow(state, annotationId);
      state.activeAnnotationId = annotationId;
      state.auxPanelMode = mode;
      state.expandedAnnotationIds.add(annotationId);
      render();
    }

    function render() {
      ensureActiveAnnotation();
      renderAnnotationList(state, { persist, saveOnly, refresh: render, openAux: openAuxPanel }, annotationsRoot);
      renderAuxPanel(
        state,
        { persist, saveOnly, refresh: render },
        auxPanelRoot,
        auxTitleRoot,
        auxTargetRoot,
        auxContentRoot
      );
      updateLauncherState();
      applyCssEditsForAllAnnotations(state);
      applyContentEditsForAllAnnotations(state);
    }

    function persist() {
      saveOnly();
      render();
    }

    const updateSelectButton = () => {
      newSelectionButton.classList.toggle("raa-btn-active", state.selectMode);
      newSelectionButton.setAttribute("aria-pressed", state.selectMode ? "true" : "false");
      newSelectionButton.textContent = state.selectMode ? "Selecting..." : "New Selection";
    };

    const updateLauncherState = () => {
      const count = state.annotations.length;
      ui.launcher.textContent = count > 0 ? `Agent Annotator (${count})` : "Agent Annotator";
      ui.launcher.classList.toggle("raa-launcher-has-annotations", count > 0);
    };

    const setToolbarVisible = (visible, options = {}) => {
      const activateSelect = options.activateSelect === true;
      ui.toolbar.hidden = !visible;
      ui.toolbar.style.display = visible ? "flex" : "none";
      ui.launcher.hidden = visible;
      window.localStorage.setItem(visibilityPreferenceKey, visible ? "1" : "0");

      if (visible) {
        state.selectMode = activateSelect;
        updateSelectButton();
      } else {
        state.auxPanelMode = null;
        clearAllActiveCssEditRows(state);
        state.selectMode = false;
        updateSelectButton();
        ui.highlight.style.display = "none";
        auxPanelRoot.hidden = true;
        auxPanelRoot.style.display = "none";
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
      state.activeAnnotationId = captured.id;
      state.auxPanelMode = null;
      clearAllActiveCssEditRows(state);
      state.expandedAnnotationIds = new Set([captured.id]);
      state.selectMode = false;
      updateSelectButton();
      ui.highlight.style.display = "none";
      persist();
      window.requestAnimationFrame(() => focusAnnotationNotes(annotationsRoot, captured.id));
    };

    newSelectionButton.addEventListener("click", () => {
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

    if (closeAuxButton) {
      closeAuxButton.addEventListener("click", () => {
        state.auxPanelMode = null;
        clearAllActiveCssEditRows(state);
        auxPanelRoot.hidden = true;
        auxPanelRoot.style.display = "none";
        auxContentRoot.innerHTML = "";
        render();
      });
    }

    ui.launcher.addEventListener("click", () => {
      setToolbarVisible(true, { activateSelect: true });
      render();
    });

    clearButton.addEventListener("click", () => {
      state.annotations.forEach((annotation) => {
        clearAppliedCssForAnnotation(state, annotation);
        clearAppliedContentEditForAnnotation(state, annotation);
      });
      state.annotations = [];
      state.activeAnnotationId = null;
      state.auxPanelMode = null;
      clearAllActiveCssEditRows(state);
      state.expandedAnnotationIds = new Set();
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

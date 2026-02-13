(function() {
  const APP_ID = "raa-toolbar";
  const LAUNCHER_ID = "raa-launcher";
  const HIGHLIGHT_ID = "raa-highlight";

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

  function selectorFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 5) {
      let part = current.tagName.toLowerCase();
      const classes = Array.from(current.classList).filter(Boolean).slice(0, 2);

      if (classes.length > 0) {
        part += classes.map((name) => `.${CSS.escape(name)}`).join("");
      } else {
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            part += `:nth-of-type(${index})`;
          }
        }
      }

      path.unshift(part);

      if (current.parentElement && current.parentElement.id) {
        path.unshift(`#${CSS.escape(current.parentElement.id)}`);
        break;
      }

      current = current.parentElement;
    }

    return path.join(" > ");
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

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `raa-${Date.now()}-${Math.random()}`,
      tag: "",
      priority: "",
      notes: "",
      selector: selectorFor(element),
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
      created_at: nowIso()
    };
  }

  function markdownFor(context, annotations) {
    const lines = [];
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    lines.push("Title: Annotator Notes", `**Viewport:** ${viewportWidth}×${viewportHeight}`, "", "Context:");
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

      lines.push(`${index + 1}) [${tag}] [${priority}]`);
      lines.push(`- Selector: ${annotation.selector || "Unknown"}`);
      lines.push(`- Text: ${annotation.text || "(input)"}`);
      lines.push(`- Element: ${annotation.element_tag}`);

      if (annotation.turbo_frame) {
        lines.push(`- Turbo Frame: ${annotation.turbo_frame}`);
      }

      if (annotation.stimulus && annotation.stimulus.length) {
        lines.push(`- Stimulus: ${annotation.stimulus.join(" ")}`);
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

  function renderAnnotationList(state, onChange, list) {
    if (!list) return;
    list.innerHTML = "";

    state.annotations.forEach((annotation) => {
      const item = document.createElement("div");
      item.className = "raa-item";

      const header = document.createElement("div");
      header.className = "raa-item-header";
      header.textContent = annotation.selector || annotation.element_tag;

      const meta = document.createElement("div");
      meta.className = "raa-item-meta";
      meta.textContent = `Text: ${annotation.text}`;

      const controls = document.createElement("div");
      controls.className = "raa-item-controls";

      const tagInput = document.createElement("input");
      tagInput.type = "text";
      tagInput.placeholder = "tag (bug, layout, behavior...)";
      tagInput.setAttribute("list", "raa-tag-suggestions");
      tagInput.value = annotation.tag || "";
      tagInput.addEventListener("change", (event) => {
        annotation.tag = event.target.value.trim();
        onChange();
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
        onChange();
      });

      const notes = document.createElement("textarea");
      notes.placeholder = "Write annotation notes...";
      notes.value = annotation.notes || "";
      notes.dataset.annotationId = annotation.id;
      notes.addEventListener("change", (event) => {
        annotation.notes = event.target.value;
        onChange();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "raa-btn raa-btn-danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        state.annotations = state.annotations.filter((item2) => item2.id !== annotation.id);
        onChange();
      });

      controls.appendChild(tagInput);
      controls.appendChild(prioritySelect);

      item.appendChild(header);
      item.appendChild(meta);
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
      annotations: []
    };

    try {
      state.annotations = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    } catch (_error) {
      state.annotations = [];
    }

    // One-time migration from legacy (non app-scoped) storage key.
    if (!state.annotations.length) {
      try {
        const legacy = JSON.parse(window.localStorage.getItem(legacyStorageKey) || "[]");
        if (Array.isArray(legacy) && legacy.length > 0) {
          state.annotations = legacy;
          window.localStorage.setItem(storageKey, JSON.stringify(legacy));
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

    const persist = () => {
      window.localStorage.setItem(storageKey, JSON.stringify(state.annotations));
      renderAnnotationList(state, persist, annotationsRoot);
      updateLauncherState();
    };

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

      const captured = captureElement(event.target);
      state.annotations.unshift(captured);
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
    updateLauncherState();
    renderAnnotationList(state, persist, annotationsRoot);

    const savedVisibility = window.localStorage.getItem(visibilityPreferenceKey);
    const toolbarVisible = savedVisibility === "1";
    state.selectMode = false;
    updateSelectButton();
    setToolbarVisible(toolbarVisible, { activateSelect: false });
  }

  document.addEventListener("turbo:load", initAnnotator);
  document.addEventListener("DOMContentLoaded", initAnnotator);
})();

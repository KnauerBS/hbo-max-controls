(() => {
  if (window.__hboControlsLoaded) return;
  window.__hboControlsLoaded = true;

  const STEP_SECONDS = 0.5;
  const TICK_MS = 1000;

  // ───────────────────────── State ─────────────────────────
  const state = {
    autoNext: false,
    sleepEnd: 0,          // absolute timestamp (ms) – Quelle: storage
    sleepHandled: 0,      // sleepEnd-Wert, der bereits ausgelöst wurde
    awakeMin: 60,         // 0 = aus
    lastActivity: Date.now(),
    hold: null,           // null | "sleep" | "awake" → Video bleibt pausiert
    modalOpen: false,
    pausedByUs: [],       // Videos, die wir pausiert haben (für „weiterschauen“)
  };

  browser.runtime.sendMessage({ type: "hbo-content-ready" }).catch(() => {});

  // ───────────────────────── Video-Helfer ─────────────────────────
  function collectVideos(root, out) {
    for (const v of root.querySelectorAll("video")) out.push(v);
    return out;
  }

  function collectVideosDeep(root, out) {
    collectVideos(root, out);
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) collectVideosDeep(el.shadowRoot, out);
    }
    return out;
  }

  // Alle Videos; Shadow-DOM nur durchsuchen, wenn im normalen DOM keines ist
  function findVideos() {
    const light = collectVideos(document, []);
    return light.length ? light : collectVideosDeep(document, []);
  }

  function isPlaying(v) {
    return !v.paused && !v.ended && v.readyState >= 2;
  }

  // Hauptvideo: ein spielendes, sonst das größte
  function primaryVideo() {
    const all = findVideos();
    const playing = all.filter(isPlaying);
    const pool = playing.length ? playing : all;
    let best = null;
    let bestArea = -1;
    for (const v of pool) {
      const r = v.getBoundingClientRect();
      const area = r.width * r.height;
      if (area > bestArea) {
        best = v;
        bestArea = area;
      }
    }
    return best;
  }

  function pauseAllPlaying() {
    const playing = findVideos().filter(isPlaying);
    for (const v of playing) {
      try {
        v.pause();
      } catch (_) {}
      if (!state.pausedByUs.includes(v)) state.pausedByUs.push(v);
    }
    return playing.length;
  }

  function resumePaused() {
    const list = state.pausedByUs.length ? state.pausedByUs : [primaryVideo()].filter(Boolean);
    for (const v of list) v.play().catch(() => {});
    state.pausedByUs = [];
  }

  // ───────────────────────── UI (Toast + Wach-Dialog) ─────────────────────────
  let uiRoot = null;
  let toastEl = null;
  let backdropEl = null;

  function injectStyles() {
    if (document.getElementById("hbo-controls-styles")) return;
    const style = document.createElement("style");
    style.id = "hbo-controls-styles";
    style.textContent = `
      #hbo-controls-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #hbo-controls-toast {
        position: absolute; bottom: 40px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(24,24,27,.95); color: #f4f4f5; border: 1px solid #6d28d9;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,.6), 0 0 15px rgba(109,40,217,.3);
        padding: 12px 24px; border-radius: 9999px; font-size: 14px; font-weight: 500;
        opacity: 0; transition: opacity .3s, transform .3s; white-space: nowrap;
      }
      #hbo-controls-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
      #hbo-controls-backdrop {
        position: absolute; inset: 0; background: rgba(0,0,0,.8);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none; transition: opacity .3s;
      }
      #hbo-controls-backdrop.visible { opacity: 1; pointer-events: auto; }
      #hbo-controls-modal {
        background: #18181b; border: 1px solid #3f3f46; border-radius: 16px;
        padding: 28px 32px; max-width: 380px; width: 90%; text-align: center; color: #f4f4f5;
        box-shadow: 0 20px 40px rgba(0,0,0,.8), 0 0 30px rgba(124,58,237,.2);
      }
      #hbo-controls-modal h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #fff; }
      #hbo-controls-modal p { margin: 0 0 22px; font-size: 14px; color: #a1a1aa; line-height: 1.4; }
      #hbo-controls-btn {
        appearance: none; border: 0; background: #7c3aed; color: #fff; font-size: 15px;
        font-weight: 600; padding: 12px 24px; border-radius: 10px; cursor: pointer; width: 100%;
      }
      #hbo-controls-btn:hover { background: #6d28d9; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureUi() {
    injectStyles();
    if (!uiRoot) {
      uiRoot = document.createElement("div");
      uiRoot.id = "hbo-controls-root";

      toastEl = document.createElement("div");
      toastEl.id = "hbo-controls-toast";

      backdropEl = document.createElement("div");
      backdropEl.id = "hbo-controls-backdrop";
      backdropEl.innerHTML = `
        <div id="hbo-controls-modal" role="alertdialog" aria-modal="true">
          <h2>Bist du noch wach? 💤</h2>
          <p>Die Wiedergabe wurde wegen längerer Inaktivität angehalten.</p>
          <button id="hbo-controls-btn" type="button">Ja, weiterschauen</button>
        </div>`;

      uiRoot.append(toastEl, backdropEl);
      backdropEl.querySelector("#hbo-controls-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        confirmAwake();
      });
    }
    mountUi();
  }

  // Im Vollbild (Element-Fullscreen) ist nur der Teilbaum des Vollbild-Elements sichtbar
  // → UI dorthin umhängen. Bei <video> als Vollbild-Element geht das nicht.
  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function mountUi() {
    if (!uiRoot) return;
    const fs = fullscreenElement();
    const host =
      fs && fs.tagName !== "VIDEO" && fs.tagName !== "IFRAME"
        ? fs
        : document.body || document.documentElement;
    if (uiRoot.parentNode !== host) host.appendChild(uiRoot);
  }

  function leaveVideoFullscreen() {
    const fs = fullscreenElement();
    if (fs && (fs.tagName === "VIDEO" || fs.tagName === "IFRAME")) {
      try {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } catch (_) {}
    }
  }

  for (const evt of ["fullscreenchange", "webkitfullscreenchange"]) {
    document.addEventListener(evt, () => {
      if (uiRoot) setTimeout(mountUi, 50);
    });
  }

  function showToast(message, duration = 4000) {
    ensureUi();
    toastEl.textContent = message;
    toastEl.classList.add("visible");
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove("visible"), duration);
  }

  function openAwakeModal() {
    if (state.modalOpen) return;
    state.modalOpen = true;
    state.hold = "awake";
    pauseAllPlaying();
    leaveVideoFullscreen();
    ensureUi();
    backdropEl.offsetHeight; // reflow
    backdropEl.classList.add("visible");
    setTimeout(() => backdropEl.querySelector("#hbo-controls-btn")?.focus(), 100);
  }

  function closeAwakeModal() {
    state.modalOpen = false;
    backdropEl?.classList.remove("visible");
  }

  function confirmAwake() {
    closeAwakeModal();
    state.hold = null;
    state.lastActivity = Date.now();
    resumePaused();
  }

  // ───────────────────────── Sleep Timer ─────────────────────────
  function checkSleepTimer(now) {
    if (!state.sleepEnd || now < state.sleepEnd || state.sleepHandled === state.sleepEnd) return;
    state.sleepHandled = state.sleepEnd;
    const hadPlayback = pauseAllPlaying() > 0;
    if (state.hold !== "awake") state.hold = "sleep";
    showToast(
      hadPlayback ? "😴 Sleep Timer abgelaufen – Wiedergabe pausiert" : "😴 Sleep Timer abgelaufen",
      8000
    );
  }

  // ───────────────────────── Wach-Check ─────────────────────────
  function checkAwake(now, playing) {
    if (state.awakeMin <= 0 || state.modalOpen || state.hold || !playing) return;
    if (now - state.lastActivity >= state.awakeMin * 60 * 1000) openAwakeModal();
  }

  // Nur echte Benutzereingaben zählen
  let lastActivityWrite = 0;
  function onUserActivity(e) {
    if (!e.isTrusted) return;
    const now = Date.now();
    if (state.modalOpen) return; // Dialog nur über Button/Enter schließen
    if (now - lastActivityWrite < 500) return;
    lastActivityWrite = now;
    state.lastActivity = now;
    // Bewusste Eingabe löst die Sleep-Sperre
    if (state.hold === "sleep" && e.type !== "mousemove" && e.type !== "scroll") {
      state.hold = null;
    }
  }

  for (const evt of ["mousemove", "mousedown", "pointerdown", "keydown", "scroll", "touchstart", "wheel"]) {
    window.addEventListener(evt, onUserActivity, { passive: true, capture: true });
  }

  // Tastatur im Dialog: Enter / Leertaste / Esc bestätigen, nichts an HBO durchreichen
  window.addEventListener(
    "keydown",
    (e) => {
      if (!state.modalOpen) return;
      if (["Enter", "Space", "Escape"].includes(e.code)) confirmAwake();
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true
  );

  // ───────────────────────── Haupt-Tick ─────────────────────────
  function tick() {
    const now = Date.now();
    checkSleepTimer(now);

    const playing = findVideos().filter(isPlaying);

    // Sperre: HBO startet Wiedergabe von selbst (z. B. nächste Folge) → wieder pausieren
    if (state.hold && playing.length) {
      pauseAllPlaying();
      if (state.hold === "awake" && !state.modalOpen) openAwakeModal();
    }

    checkAwake(now, playing.length > 0);
  }

  setInterval(tick, TICK_MS);
  document.addEventListener("visibilitychange", tick);

  // ───────────────────────── Navigation ─────────────────────────
  function seekBy(seconds) {
    const v = primaryVideo();
    if (v) v.currentTime += seconds;
    state.lastActivity = Date.now();
  }

  function startNextEpisode() {
    let button = document.querySelector(
      '[data-testid="next-episode-button"], [class*="NextEpisode"], [data-testid*="next-episode"]'
    );
    if (!button) {
      for (const c of document.querySelectorAll("button, [role=button]")) {
        const label = `${c.getAttribute("aria-label") || ""} ${c.textContent || ""}`;
        if (/next episode|nächste folge/i.test(label)) {
          button = c;
          break;
        }
      }
    }
    button?.click();
    state.lastActivity = Date.now();
    return Boolean(button);
  }

  let autoNextTimer;
  function attemptAutoNext() {
    if (!state.autoNext || state.hold || state.modalOpen) return;
    clearTimeout(autoNextTimer);
    autoNextTimer = setTimeout(() => {
      if (!state.hold && !state.modalOpen) startNextEpisode();
    }, 150);
  }

  new MutationObserver(attemptAutoNext).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // ───────────────────────── Storage ─────────────────────────
  function applyStorage(res, { initial = false } = {}) {
    if ("autoNextEnabled" in res) state.autoNext = Boolean(res.autoNextEnabled);
    if ("awakeCheckMinutes" in res && typeof res.awakeCheckMinutes === "number") {
      state.awakeMin = res.awakeCheckMinutes;
    }
    if ("sleepTimerEnd" in res) {
      const end = res.sleepTimerEnd || 0;
      if (initial && end <= Date.now()) state.sleepHandled = end; // alter, abgelaufener Wert
      state.sleepEnd = end;
    }
  }

  browser.storage.local
    .get(["autoNextEnabled", "sleepTimerEnd", "awakeCheckMinutes"])
    .then((res) => {
      applyStorage(res, { initial: true });
      attemptAutoNext();
    })
    .catch(() => {});

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const res = {};
    for (const [k, c] of Object.entries(changes)) res[k] = c.newValue;
    applyStorage(res);
    if (changes.autoNextEnabled) attemptAutoNext();
  });

  // ───────────────────────── Nachrichten vom Panel ─────────────────────────
  browser.runtime.onMessage.addListener((message) => {
    switch (message?.command) {
      case "ping":
      case "get-status": {
        const videos = findVideos();
        return Promise.resolve({
          ok: true,
          hasVideo: videos.length > 0,
          playing: videos.some(isPlaying),
          sleepEnd: state.sleepEnd,
          awakeMin: state.awakeMin,
        });
      }
      case "seek-back":
        seekBy(-STEP_SECONDS);
        break;
      case "seek-forward":
        seekBy(STEP_SECONDS);
        break;
      case "next-episode":
        startNextEpisode();
        break;
      case "set-sleep-timer":
        state.sleepEnd = message.sleepTimerEnd || 0;
        if (state.hold === "sleep") state.hold = null;
        if (state.sleepEnd > Date.now()) {
          const min = Math.max(1, Math.round((state.sleepEnd - Date.now()) / 60000));
          showToast(`😴 Sleep Timer auf ${min} Min. gesetzt`);
        }
        break;
      case "cancel-sleep-timer":
        state.sleepEnd = 0;
        if (state.hold === "sleep") state.hold = null;
        showToast("😴 Sleep Timer deaktiviert");
        break;
      case "set-awake-check":
        state.awakeMin = message.awakeCheckMinutes || 0;
        state.lastActivity = Date.now();
        showToast(
          state.awakeMin > 0
            ? `💤 Wach-Check: nach ${state.awakeMin} Min. Inaktivität`
            : "💤 Wach-Check deaktiviert"
        );
        break;
    }
    return Promise.resolve({ ok: true });
  });

  // ───────────────────────── Tastenkürzel ─────────────────────────
  document.addEventListener(
    "keydown",
    (event) => {
      if (state.modalOpen) return;
      if (event.shiftKey || event.repeat) return;
      const t = event.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable) return;

      const seekShortcut = event.metaKey && event.altKey && !event.ctrlKey;
      const nextShortcut = event.altKey && !event.metaKey && !event.ctrlKey && event.code === "KeyN";

      if (seekShortcut && event.code === "Comma") seekBy(-STEP_SECONDS);
      else if (seekShortcut && event.code === "Period") seekBy(STEP_SECONDS);
      else if (nextShortcut) startNextEpisode();
      else return;

      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
})();

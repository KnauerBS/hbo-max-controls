const HBO_URL = "https://play.hbomax.com/";

function isHBO(tab) {
  return /^https:\/\/(?:[a-z0-9-]+\.)*(?:hbo)?max\.com(?:[\/?#:]|$)/i.test(tab?.url || "");
}

function isSafariStartPage(tab) {
  const url = (tab?.url || "").trim();
  const title = (tab?.title || "").trim().toLowerCase();
  const startpageTitles = ["startseite", "start page", "neuer tab", "new tab", "favorites", "top sites"];
  return (
    !url ||
    url === "about:blank" ||
    url === "about:startpage" ||
    url.startsWith("safari:") ||
    url.startsWith("favorites:") ||
    startpageTitles.includes(title)
  );
}

async function send(command, data = {}) {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.tabs.sendMessage(tab.id, { command, ...data });
    }
  } catch (_) {}
}

// Commands from buttons
for (const button of document.querySelectorAll("button[data-command]")) {
  button.addEventListener("click", () => {
    send(button.dataset.command);
    window.close();
  });
}

// Auto-Next Toggle
const autoNext = document.querySelector("#auto-next");
if (autoNext) {
  browser.storage.local.get("autoNextEnabled").then(({ autoNextEnabled }) => {
    autoNext.checked = Boolean(autoNextEnabled);
  }).catch(() => {});
  autoNext.addEventListener("change", () => {
    browser.storage.local.set({ autoNextEnabled: autoNext.checked }).catch(() => {});
  });
}

// Shared helper for mutually exclusive preset pills + custom minute input
function createTimerControl({ gridSelector, customInputSelector, onApply }) {
  const grid = document.querySelector(gridSelector);
  const pills = Array.from(grid.querySelectorAll(".pill"));
  const customInput = document.querySelector(customInputSelector);
  const customWrapper = customInput.closest(".custom-pill");
  const presetValues = new Set(pills.map((p) => Number(p.dataset.minutes)));

  let debounceTimer = null;
  let lastApplied = null;

  function clearPills() {
    for (const pill of pills) {
      pill.classList.remove("active");
      pill.setAttribute("aria-pressed", "false");
    }
  }

  function setUI(minutes) {
    clearTimeout(debounceTimer);
    if (presetValues.has(minutes)) {
      for (const pill of pills) {
        const active = Number(pill.dataset.minutes) === minutes;
        pill.classList.toggle("active", active);
        pill.setAttribute("aria-pressed", String(active));
      }
      customInput.value = "";
      customWrapper.classList.remove("active");
    } else if (minutes > 0) {
      clearPills();
      customInput.value = String(minutes);
      customWrapper.classList.add("active");
    } else {
      setUI(0);
    }
  }

  function commitCustom() {
    clearTimeout(debounceTimer);
    const raw = customInput.value.trim();
    if (!raw) return;
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return;

    if (parsed === 0) {
      setUI(0);
      if (lastApplied !== 0) {
        lastApplied = 0;
        onApply(0);
      }
      return;
    }

    const mins = Math.min(600, parsed);
    if (String(mins) !== raw) customInput.value = String(mins);
    clearPills();
    customWrapper.classList.add("active");
    if (lastApplied !== mins) {
      lastApplied = mins;
      onApply(mins);
    }
  }

  for (const pill of pills) {
    pill.addEventListener("click", () => {
      const mins = Number(pill.dataset.minutes);
      setUI(mins);
      lastApplied = mins;
      onApply(mins);
    });
  }

  customInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    lastApplied = null;
    const raw = customInput.value.trim();
    if (!raw) {
      customWrapper.classList.remove("active");
      return;
    }
    const mins = parseInt(raw, 10);
    if (Number.isFinite(mins) && mins > 0) {
      clearPills();
      customWrapper.classList.add("active");
      debounceTimer = setTimeout(commitCustom, 600);
    }
  });

  customInput.addEventListener("change", commitCustom);
  customInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCustom();
      customInput.blur();
    }
  });

  return { setUI };
}

// Sleep Timer
const sleepTimerStatus = document.querySelector("#sleep-timer-status");
const sleepTimerCountdown = document.querySelector("#sleep-timer-countdown");
const cancelSleepTimerBtn = document.querySelector("#cancel-sleep-timer");

let countdownInterval = null;
let sleepControl = null;

function formatRemaining(ms) {
  if (ms <= 0) return "00:00";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateSleepTimerUI(sleepTimerEnd) {
  clearInterval(countdownInterval);
  const now = Date.now();

  if (sleepTimerEnd && sleepTimerEnd > now) {
    sleepTimerStatus.classList.remove("hidden");
    const updateTime = () => {
      const remaining = sleepTimerEnd - Date.now();
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        sleepTimerStatus.classList.add("hidden");
        sleepControl?.setUI(0);
      } else {
        sleepTimerCountdown.textContent = `⏱ ${formatRemaining(remaining)} remaining`;
      }
    };
    updateTime();
    countdownInterval = setInterval(updateTime, 1000);
  } else {
    sleepTimerStatus.classList.add("hidden");
  }
}

function applySleepTimer(mins) {
  if (mins > 0) {
    const end = Date.now() + mins * 60 * 1000;
    browser.storage.local.set({ sleepTimerEnd: end, sleepTimerMinutes: mins }).catch(() => {});
    updateSleepTimerUI(end);
    send("set-sleep-timer", { sleepTimerEnd: end });
  } else {
    browser.storage.local.set({ sleepTimerEnd: 0, sleepTimerMinutes: 0 }).catch(() => {});
    updateSleepTimerUI(0);
    send("cancel-sleep-timer");
  }
}

sleepControl = createTimerControl({
  gridSelector: "#sleep-timer-options",
  customInputSelector: "#sleep-timer-custom",
  onApply: applySleepTimer,
});

browser.storage.local.get(["sleepTimerEnd", "sleepTimerMinutes"]).then(({ sleepTimerEnd, sleepTimerMinutes }) => {
  const now = Date.now();
  if (sleepTimerEnd && sleepTimerEnd > now) {
    sleepControl.setUI(sleepTimerMinutes || Math.max(1, Math.round((sleepTimerEnd - now) / 60000)));
    updateSleepTimerUI(sleepTimerEnd);
  } else {
    sleepControl.setUI(0);
    updateSleepTimerUI(0);
  }
}).catch(() => {});

cancelSleepTimerBtn.addEventListener("click", () => {
  sleepControl.setUI(0);
  applySleepTimer(0);
});

// Awake Check (inactivity check)
const awakeControl = createTimerControl({
  gridSelector: "#awake-check-options",
  customInputSelector: "#awake-check-custom",
  onApply: (mins) => {
    browser.storage.local.set({ awakeCheckMinutes: mins }).catch(() => {});
    send("set-awake-check", { awakeCheckMinutes: mins });
  },
});

browser.storage.local.get("awakeCheckMinutes").then(({ awakeCheckMinutes }) => {
  const mins = typeof awakeCheckMinutes === "number" ? awakeCheckMinutes : 60;
  awakeControl.setUI(mins);
}).catch(() => {
  awakeControl.setUI(60);
});

// Smart Navigation on non-HBO tabs + Connection status
async function pollStatus(tabId, statusEl, { retries = 6, delayMs = 350 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await browser.tabs.sendMessage(tabId, { command: "get-status" });
      if (res?.ok) {
        statusEl.className = "status " + (res.hasVideo ? "ok" : "warn");
        statusEl.textContent = res.hasVideo
          ? (res.playing ? "● Connected – video playing" : "● Connected – video paused")
          : "● Connected – no video found";
        return;
      }
    } catch (_) {}
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  statusEl.className = "status err";
  statusEl.textContent = "● Not connected – reload the page";
}

(async () => {
  const statusEl = document.querySelector("#status");
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (!isHBO(tab)) {
      if (statusEl) {
        statusEl.className = "status";
        statusEl.textContent = "Opening HBO Max …";
      }
      let targetTabId = tab.id;
      if (tab.id && isSafariStartPage(tab)) {
        await browser.tabs.update(tab.id, { url: HBO_URL });
      } else {
        const created = await browser.tabs.create({ url: HBO_URL, active: true });
        if (created?.id) targetTabId = created.id;
      }
      window.close();
      setTimeout(() => window.close(), 80);
      // Fallback if Safari keeps the popover open while the new/updated tab loads
      if (statusEl && targetTabId) {
        await pollStatus(targetTabId, statusEl, { retries: 15, delayMs: 400 });
      }
      return;
    }

    if (statusEl && tab.id) {
      await pollStatus(tab.id, statusEl, { retries: 6, delayMs: 350 });
    }
  } catch (_) {
    if (statusEl) {
      statusEl.className = "status err";
      statusEl.textContent = "● Not connected – reload the page";
    }
  }
})();

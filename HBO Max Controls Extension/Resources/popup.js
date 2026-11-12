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

// Sleep Timer
const sleepTimerSelect = document.querySelector("#sleep-timer-select");
const sleepTimerStatus = document.querySelector("#sleep-timer-status");
const sleepTimerCountdown = document.querySelector("#sleep-timer-countdown");
const cancelSleepTimerBtn = document.querySelector("#cancel-sleep-timer");

let countdownInterval = null;

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
        sleepTimerSelect.value = "0";
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

browser.storage.local.get(["sleepTimerEnd", "sleepTimerMinutes"]).then(({ sleepTimerEnd, sleepTimerMinutes }) => {
  const now = Date.now();
  if (sleepTimerEnd && sleepTimerEnd > now) {
    if (sleepTimerMinutes) sleepTimerSelect.value = String(sleepTimerMinutes);
    updateSleepTimerUI(sleepTimerEnd);
  } else {
    sleepTimerSelect.value = "0";
    updateSleepTimerUI(0);
  }
}).catch(() => {});

sleepTimerSelect.addEventListener("change", () => {
  const mins = parseInt(sleepTimerSelect.value, 10);
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
});

cancelSleepTimerBtn.addEventListener("click", () => {
  browser.storage.local.set({ sleepTimerEnd: 0, sleepTimerMinutes: 0 }).catch(() => {});
  sleepTimerSelect.value = "0";
  updateSleepTimerUI(0);
  send("cancel-sleep-timer");
});

// Awake Check (inactivity check)
const awakeCheckSelect = document.querySelector("#awake-check-select");
browser.storage.local.get("awakeCheckMinutes").then(({ awakeCheckMinutes }) => {
  if (typeof awakeCheckMinutes !== "undefined") {
    awakeCheckSelect.value = String(awakeCheckMinutes);
  } else {
    awakeCheckSelect.value = "60"; // Default: 60 min
  }
}).catch(() => {});

awakeCheckSelect.addEventListener("change", () => {
  const mins = parseInt(awakeCheckSelect.value, 10);
  browser.storage.local.set({ awakeCheckMinutes: mins }).catch(() => {});
  send("set-awake-check", { awakeCheckMinutes: mins });
});

// Smart Navigation on non-HBO tabs
(async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && !isHBO(tab)) {
      if (tab.id && isSafariStartPage(tab)) {
        await browser.tabs.update(tab.id, { url: HBO_URL });
      } else {
        await browser.tabs.create({ url: HBO_URL, active: true });
      }
      window.close();
    }
  } catch (_) {}
})();

// Connection status to the page (shows whether the content script is running and a video was found)
(async () => {
  const el = document.querySelector("#status");
  if (!el) return;
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const res = await browser.tabs.sendMessage(tab.id, { command: "get-status" });
    if (res?.ok) {
      el.textContent = res.hasVideo
        ? (res.playing ? "● Connected – video playing" : "● Connected – video paused")
        : "● Connected – no video found";
      el.classList.add(res.hasVideo ? "ok" : "warn");
    } else {
      throw new Error("no reply");
    }
  } catch (_) {
    el.textContent = "● Not connected – reload the page";
    el.classList.add("err");
  }
})();

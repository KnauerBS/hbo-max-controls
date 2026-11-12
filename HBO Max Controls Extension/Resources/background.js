const HBO_URL = "https://play.hbomax.com/";
const HBO_POPUP = "popup.html";

function isHBO(tab) {
  return /^https:\/\/play\.hbomax\.com\//.test(tab?.url || "");
}

function isSafariStartPage(tab) {
  const url = tab?.url || "";
  return (
    url === "about:blank" ||
    url === "about:startpage" ||
    url === "safari://startpage/" ||
    tab?.title === "Startseite" ||
    tab?.title === "Start Page"
  );
}

async function configureAction(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    await browser.action.setPopup({ tabId, popup: isHBO(tab) ? HBO_POPUP : "" });
  } catch (_) {}
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "hbo-content-ready" && sender.tab?.id) {
    return browser.action.setPopup({ tabId: sender.tab.id, popup: HBO_POPUP });
  }
});

browser.tabs.onActivated.addListener(({ tabId }) => configureAction(tabId));
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" || changeInfo.url) {
    browser.action.setPopup({ tabId, popup: "" }).catch(() => {});
  }
});

browser.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  if (isSafariStartPage(tab)) {
    await browser.tabs.update(tab.id, { url: HBO_URL });
  } else {
    await browser.tabs.create({ url: HBO_URL });
  }
});

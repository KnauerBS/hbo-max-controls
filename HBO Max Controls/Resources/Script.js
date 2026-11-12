// Zeigt den Status-Zustand in der UI.
// state: true = aktiv, false = inaktiv, undefined/null = unbekannt
// useSettings: macOS 13+ verwendet "Settings" statt "Preferences"
function show(state, useSettings, notInApplications) {
    const body = document.body;

    // Alle Zustandsklassen entfernen
    body.classList.remove("state-on", "state-off", "state-error", "state-unknown", "state-not-in-applications");

    if (notInApplications) {
        body.classList.add("state-not-in-applications");
        return;
    }

    if (state === true) {
        body.classList.add("state-on");
    } else if (state === false) {
        body.classList.add("state-off");
    } else if (state === "error") {
        body.classList.add("state-error");
    } else {
        body.classList.add("state-unknown");
    }

    // Button-Text anpassen für macOS 13+
    if (useSettings) {
        const btn = document.querySelector(".btn-primary");
        if (btn) btn.textContent = "Safari Einstellungen öffnen";
    }
}

// Primär-Button: öffnet Safari-Erweiterungs-Einstellungen via SFSafariApplication
document.querySelector("button.open-preferences").addEventListener("click", () => {
    webkit.messageHandlers.controller.postMessage("open-preferences");
});

// Fallback-Button: öffnet Safari-Einstellungen via NSWorkspace URL
document.querySelector("button.open-settings-url").addEventListener("click", () => {
    webkit.messageHandlers.controller.postMessage("open-settings-url");
});

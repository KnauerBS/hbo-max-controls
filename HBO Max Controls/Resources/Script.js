// Shows the status state in the UI.
// state: true = enabled, false = disabled, undefined/null = unknown
// useSettings: macOS 13+ uses "Settings" instead of "Preferences"
function show(state, useSettings, notInApplications) {
    const body = document.body;

    // Remove all state classes
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

    // Adjust button text for macOS 13+
    if (useSettings) {
        const btn = document.querySelector(".btn-primary");
        if (btn) btn.textContent = "Open Safari Settings";
    }
}

// Primary button: opens Safari extension settings via SFSafariApplication
document.querySelector("button.open-preferences").addEventListener("click", () => {
    webkit.messageHandlers.controller.postMessage("open-preferences");
});

// Fallback button: opens Safari settings via NSWorkspace URL
document.querySelector("button.open-settings-url").addEventListener("click", () => {
    webkit.messageHandlers.controller.postMessage("open-settings-url");
});

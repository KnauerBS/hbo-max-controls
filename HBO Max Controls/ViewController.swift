//
//  ViewController.swift
//  HBO Max Controls
//
//  Created by Semi on 08.09.26.
//

import Cocoa
import SafariServices
import WebKit

let extensionBundleIdentifier = "com.local.HBO-Max-Controls.Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self
        self.webView.configuration.userContentController.add(self, name: "controller")
        self.webView.loadFileURL(
            Bundle.main.url(forResource: "Main", withExtension: "html")!,
            allowingReadAccessTo: Bundle.main.resourceURL!
        )
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Check whether the app is running from /Applications
        let bundlePath = Bundle.main.bundlePath
        let isInApplications = bundlePath.hasPrefix("/Applications") ||
                               bundlePath.hasPrefix("/Users/") && bundlePath.contains("/Applications/")

        guard isInApplications else {
            DispatchQueue.main.async {
                webView.evaluateJavaScript("show(null, false, true)")
            }
            return
        }

        let useSettings: Bool
        if #available(macOS 13, *) {
            useSettings = true
        } else {
            useSettings = false
        }

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            DispatchQueue.main.async {
                if let error = error {
                    NSLog("HBO Max Controls: Extension state error: \(error)")
                    webView.evaluateJavaScript("show('error', \(useSettings), false)")
                    return
                }
                guard let state = state else {
                    webView.evaluateJavaScript("show('error', \(useSettings), false)")
                    return
                }
                webView.evaluateJavaScript("show(\(state.isEnabled), \(useSettings), false)")
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? String else { return }

        switch body {
        case "open-preferences":
            SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
                DispatchQueue.main.async {
                    if let error = error {
                        NSLog("HBO Max Controls: showPreferencesForExtension error: \(error)")
                        // API failed (e.g. ad-hoc signature) → open Safari directly + show hint
                        self.openSafariDirectly()
                    }
                    // Kein terminate – App bleibt offen damit der User den Status sieht
                }
            }

        case "open-settings-url":
            // Fallback: open Safari.app directly
            openSafariDirectly()

        default:
            break
        }
    }

    private func openSafariDirectly() {
        // Open Safari – the user then navigates to Settings → Extensions
        let safariURL = URL(fileURLWithPath: "/Applications/Safari.app")
        NSWorkspace.shared.openApplication(
            at: safariURL,
            configuration: NSWorkspace.OpenConfiguration()
        ) { _, error in
            if let error = error {
                // Safari nicht unter /Applications gefunden – Hinweis anzeigen
                DispatchQueue.main.async {
                    let alert = NSAlert()
                    alert.messageText = "Could not open Safari"
                    alert.informativeText = "Open Safari manually and go to:\nSafari → Settings → Extensions\nand enable \"HBO Max Controls\"."
                    alert.alertStyle = .informational
                    alert.addButton(withTitle: "OK")
                    alert.runModal()
                }
            }
        }
    }
}

// Erzeugt App- und Extension-Icons. Aufruf: swift tools/make-icons.swift
import AppKit

func render(size: Int, fullBleedMask: Bool = true) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let s = CGFloat(size)
    let u = s / 1024
    // macOS icon grid: 824pt artwork on a 1024pt canvas
    let body = NSRect(x: 100*u, y: 100*u, width: 824*u, height: 824*u)
    let path = NSBezierPath(roundedRect: body, xRadius: 185*u, yRadius: 185*u)

    NSGraphicsContext.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = NSColor.black.withAlphaComponent(0.35)
    shadow.shadowOffset = NSSize(width: 0, height: -12*u)
    shadow.shadowBlurRadius = 24*u
    shadow.set()
    NSColor.black.setFill(); path.fill()
    NSGraphicsContext.restoreGraphicsState()

    NSGradient(colors: [NSColor(red: 0.64, green: 0.36, blue: 1.0, alpha: 1),
                        NSColor(red: 0.36, green: 0.13, blue: 0.80, alpha: 1)])!.draw(in: path, angle: -90)

    // Glanzkante
    NSGraphicsContext.saveGraphicsState()
    path.addClip()
    NSGradient(colors: [NSColor.white.withAlphaComponent(0.18), NSColor.white.withAlphaComponent(0)])!
        .draw(in: NSRect(x: body.minX, y: body.midY, width: body.width, height: body.height/2), angle: -90)
    NSGraphicsContext.restoreGraphicsState()

    // Glyphe: Pause-Balken + Play-Dreieck (wie das Toolbar-Icon)
    NSColor.white.setStroke()
    let g = NSBezierPath()
    g.lineWidth = 62*u; g.lineCapStyle = .round; g.lineJoinStyle = .round
    func p(_ x: CGFloat, _ y: CGFloat) -> NSPoint { NSPoint(x: x*u, y: (1024 - y)*u) }
    g.move(to: p(318, 372)); g.line(to: p(318, 652))
    g.move(to: p(432, 372)); g.line(to: p(432, 652))
    g.move(to: p(562, 352)); g.line(to: p(742, 512)); g.line(to: p(562, 672)); g.close()
    NSGraphicsContext.saveGraphicsState()
    let gs = NSShadow()
    gs.shadowColor = NSColor.black.withAlphaComponent(0.25)
    gs.shadowOffset = NSSize(width: 0, height: -8*u); gs.shadowBlurRadius = 14*u
    gs.set()
    g.stroke()
    NSGraphicsContext.restoreGraphicsState()
    NSGraphicsContext.restoreGraphicsState()
    return rep
}

func save(_ size: Int, to path: String) {
    let data = render(size: size).representation(using: .png, properties: [:])!
    try! data.write(to: URL(fileURLWithPath: path))
}

let root = FileManager.default.currentDirectoryPath
let appIconDir = "\(root)/HBO Max Controls/Assets.xcassets/AppIcon.appiconset"
for base in [16, 32, 128, 256, 512] {
    save(base, to: "\(appIconDir)/icon_\(base)x\(base).png")
    save(base*2, to: "\(appIconDir)/icon_\(base)x\(base)@2x.png")
}
save(384, to: "\(root)/HBO Max Controls/Resources/Icon.png")
let extIcons = "\(root)/HBO Max Controls Extension/Resources/icons"
for s in [48, 96, 128, 256, 512] { save(s, to: "\(extIcons)/icon-\(s).png") }
save(1024, to: "\(root)/docs/icon.png")
print("Icons erzeugt")

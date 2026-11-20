import XCTest

final class TouchTests: XCTestCase {
    func testOverlayDeliversSystemTouches() {
        let app = XCUIApplication(bundleIdentifier: "com.getcortexlabs.mavis.catalog")
        app.launch()
        let under = app.descendants(matching: .any).matching(identifier: "touch-under").firstMatch
        XCTAssertTrue(under.waitForExistence(timeout: 30))
        // Coordinates bypass XCTest's isHittable shortcut: UIKit must route the
        // actual touch through the overlaid views to the underlying button.
        under.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.staticTexts["Underneath 1"].waitForExistence(timeout: 5))
        app.descendants(matching: .any).matching(identifier: "touch-replace").firstMatch.tap()
        under.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.staticTexts["Underneath 2"].waitForExistence(timeout: 5))
        app.descendants(matching: .any).matching(identifier: "touch-overlay-action").firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Overlay taps 1"].waitForExistence(timeout: 5))
        capture("nested-overlay-and-fixed-layers")
        let bottom = app.descendants(matching: .any).matching(identifier: "touch-bottom").firstMatch
        for _ in 0..<5 {
            if bottom.exists && bottom.isHittable { break }
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.75))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.25)))
        }
        XCTAssertTrue(bottom.isHittable)
        bottom.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.staticTexts["Bottom 1"].waitForExistence(timeout: 5))
        capture("scrolled-through-overlay")
    }

    private func capture(_ name: String) {
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
    }
}

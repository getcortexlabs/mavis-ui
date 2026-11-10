// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MavisDesktop",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "MavisDesktop", targets: ["MavisDesktop"])],
    dependencies: [
        .package(url: "https://github.com/rafaelaugustos/jolt-swift.git", exact: "__MAVIS_JOLT_SWIFT__"),
    ],
    targets: [
        .executableTarget(
            name: "MavisDesktop",
            dependencies: [.product(name: "JoltSwiftUI", package: "jolt-swift")]
        ),
    ]
)

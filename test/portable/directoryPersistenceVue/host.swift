import Foundation

extension __FIXTURE__ {

    /// One instance per app. Uses the same JSON array and key as the Web and NativeScript hosts.
    @MainActor final class UserDefaultsDirectoryStorage: DirectoryStorage {
        private let defaults: UserDefaults
        private let key: String
        private var entries = DirectoryStoreModule.directorySeed
        private var loaded = false
        private var revision: Double = 0
        private var loadError = false

        init(defaults: UserDefaults = .standard, key: String = "mavis:directory") {
            self.defaults = defaults
            self.key = key
        }

        private func snapshot() -> DirectorySnapshot {
            DirectorySnapshot(entries: entries, revision: revision, loadError: loadError)
        }

        private func restore() {
            guard !loaded else { return }
            loaded = true
            guard let text = defaults.string(forKey: key) else { return }
            do {
                guard let data = text.data(using: .utf8),
                      let values = try JSONSerialization.jsonObject(with: data) as? [[String: Any]]
                else { throw MavisFailure(message: "Invalid saved directory") }
                let decoded = try values.map { value -> DirectoryEntry in
                    guard let id = value["id"] as? String,
                          let name = value["name"] as? String,
                          let city = value["city"] as? String
                    else { throw MavisFailure(message: "Invalid saved directory") }
                    return DirectoryEntry(id: id, name: name, city: city)
                }
                guard DirectoryStoreModule.validDirectoryEntries(decoded)
                else { throw MavisFailure(message: "Invalid saved directory") }
                entries = decoded
            } catch {
                loadError = true
            }
        }

        func load() async throws -> DirectorySnapshot {
            restore()
            return snapshot()
        }

        func rename(_ id: String, _ name: String) async throws -> DirectorySnapshot {
            // This operation has no suspension: MainActor serializes restore/edit/write/commit.
            restore()
            let trimmed = mavisTrim(name)
            guard !trimmed.isEmpty, entries.contains(where: { $0.id == id })
            else { throw MavisFailure(message: "Invalid entry") }
            let next = entries.map { entry in
                DirectoryEntry(id: entry.id, name: entry.id == id ? trimmed : entry.name, city: entry.city)
            }
            let data = try JSONSerialization.data(withJSONObject: next.map {
                ["id": $0.id, "name": $0.name, "city": $0.city]
            })
            guard let text = String(data: data, encoding: .utf8)
            else { throw MavisFailure(message: "Could not encode directory") }
            defaults.set(text, forKey: key)
            entries = next
            revision += 1
            return snapshot()
        }
    }

    @MainActor final class CheckedStorage: DirectoryStorage {
        let storage: UserDefaultsDirectoryStorage
        let defaults: UserDefaults
        let suite: String
        init() {
            suite = "mavis.directory.conformance.\(UUID().uuidString)"
            defaults = UserDefaults(suiteName: suite)!
            let values = DirectoryStoreModule.directorySeed.map {
                ["id": $0.id, "name": "Saved \($0.id)", "city": $0.city]
            }
            defaults.set(String(data: try! JSONSerialization.data(withJSONObject: values), encoding: .utf8)!, forKey: "mavis:directory")
            storage = UserDefaultsDirectoryStorage(defaults: defaults)
        }
        deinit { defaults.removePersistentDomain(forName: suite) }
        func load() async throws -> DirectorySnapshot { try await storage.load() }
        func rename(_ id: String, _ name: String) async throws -> DirectorySnapshot {
            if name == "Blocked" { throw MavisFailure(message: "quota") }
            let result = try await storage.rename(id, name)
            // A fresh host reads what UserDefaults accepted, using the pre-existing JSON schema.
            let reloaded = try await UserDefaultsDirectoryStorage(defaults: defaults).load()
            precondition(reloaded.entries == result.entries)
            return result
        }
    }
    @MainActor static func services() -> MavisServices {
        MavisServices(directoryStorage: CheckedStorage())
    }
}

import SwiftUI

extension __FIXTURE__ {
    /// Notes kept in memory, as the fixture's host.ts keeps them: a third note is refused.
    @MainActor final class MemoryNotes: NotesStorage {
        private var saved: [Note]?

        func load() async throws -> [Note]? { saved }

        func save(_ notes: [Note]) async throws {
            if notes.count == 3 { throw MavisFailure(message: "Full") }
            saved = notes
        }
    }

    @MainActor static func services() -> MavisServices {
        MavisServices(notesStorage: MemoryNotes())
    }
}

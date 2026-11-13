// Local, ordered working collections. Their reference identity stays local to one calculation.
// Swift's Set/Dictionary would change iteration order and normalize Unicode string equality.
export const collectionRuntime = `
func mavisCollectionEqual(_ a: String, _ b: String) -> Bool { a.utf16.elementsEqual(b.utf16) }
func mavisCollectionEqual(_ a: Double, _ b: Double) -> Bool { a == b || (a.isNaN && b.isNaN) }
func mavisCollectionEqual(_ a: Bool, _ b: Bool) -> Bool { a == b }
func mavisCollectionKey(_ value: String) -> String { value }
func mavisCollectionKey(_ value: Double) -> Double { value == 0 ? 0 : value }
func mavisCollectionKey(_ value: Bool) -> Bool { value }

final class MavisSet<Element> {
    private var items: [Element] = []
    private let same: (Element, Element) -> Bool
    private let normalize: (Element) -> Element
    init(_ initial: [Element], same: @escaping (Element, Element) -> Bool, normalize: @escaping (Element) -> Element) {
        self.same = same; self.normalize = normalize
        for item in initial { add(item) }
    }
    var size: Int { items.count }
    func has(_ item: Element) -> Bool { items.contains { same($0, item) } }
    @discardableResult func add(_ item: Element) -> MavisSet<Element> {
        if !has(item) { items.append(normalize(item)) }; return self
    }
    @discardableResult func delete(_ item: Element) -> Bool {
        guard let index = items.firstIndex(where: { same($0, item) }) else { return false }
        items.remove(at: index); return true
    }
    func clear() { items.removeAll() }
    func values() -> [Element] { items }
    func keys() -> [Element] { items }
}

final class MavisMap<Key, Value> {
    private var items: [(Key, Value)] = []
    private let same: (Key, Key) -> Bool
    private let normalize: (Key) -> Key
    init(_ initial: [(Key, Value)], same: @escaping (Key, Key) -> Bool, normalize: @escaping (Key) -> Key) {
        self.same = same; self.normalize = normalize
        for (key, value) in initial { set(key, value) }
    }
    var size: Int { items.count }
    func has(_ key: Key) -> Bool { items.contains { same($0.0, key) } }
    func get(_ key: Key) -> Value? { items.first { same($0.0, key) }?.1 }
    @discardableResult func set(_ key: Key, _ value: Value) -> MavisMap<Key, Value> {
        if let index = items.firstIndex(where: { same($0.0, key) }) { items[index].1 = value }
        else { items.append((normalize(key), value)) }
        return self
    }
    @discardableResult func delete(_ key: Key) -> Bool {
        guard let index = items.firstIndex(where: { same($0.0, key) }) else { return false }
        items.remove(at: index); return true
    }
    func clear() { items.removeAll() }
    func keys() -> [Key] { items.map { $0.0 } }
    func values() -> [Value] { items.map { $0.1 } }
}
`

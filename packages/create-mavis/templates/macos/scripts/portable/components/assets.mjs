// Files a shared screen shows by path: shared/assets, which every app carries. A source names
// one ~/assets/name.png, NativeScript's own spelling of an app file: the starter copies the
// folder into the mobile app, serves it under the same path on the Web and bundles it in the
// Mac app.
import { failure } from '../model.mjs'
import { walk } from '../tree.mjs'

const prefix = '~/assets/'

/** The file of shared/assets a source names, or undefined for any other source. */
export const assetName = (source) =>
  source.startsWith(prefix) && source.length > prefix.length
    ? source.slice(prefix.length)
    : undefined

/** What a picture can come from, for messages. */
export const sources = `an https:// URL, a data: URI or a file of shared/assets written ${prefix}name.png`

/**
 * A property that names a picture: a literal is checked while generating, and remembers where
 * it was written so a file that is missing can be reported there.
 */
export function source({ key, attribute, value, ctx, expr, fail, ts, T }) {
  if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
  const text = value.text.trim()
  if (text && !assetName(text) && !/^(https?:\/\/|data:)/i.test(text))
    fail(attribute, `${key} is ${sources}.`)
  const prop = { lit: value.text }
  let at
  try {
    fail(attribute, '')
  } catch (error) {
    at = error.diagnostics?.[0]
  }
  Object.defineProperty(prop, 'at', { value: at })
  return prop
}

/**
 * Fails for every literal source that names a file shared/assets does not have. names lists
 * the files of the folder, as readAssets returns them.
 */
export function checkAssets(model, names) {
  const known = new Set(names)
  const missing = []
  for (const component of model.components)
    walk(component.view, (node) => {
      for (const prop of Object.values(node.props ?? {})) {
        const name = prop && typeof prop.lit === 'string' && prop.at && assetName(prop.lit.trim())
        if (name && !known.has(name))
          missing.push({ ...prop.at, message: `shared/assets has no ${name}.` })
      }
    })
  if (missing.length) throw failure(missing)
}

/** Swift helpers that find a file the app carries, for fonts and pictures. */
export const bundleRuntime = {
  swiftRuntime:
    () => `/// The files the app carries: its resources, and those of the Swift package's own bundle beside
/// the executable or inside the app.
enum MavisBundle {
    private static let folders: [URL] = {
        let files = FileManager.default
        // A build folder can be a link, which a directory listing does not follow.
        let roots = [Bundle.main.resourceURL, Bundle.main.bundleURL, Bundle.main.executableURL?.deletingLastPathComponent()].compactMap { $0?.resolvingSymlinksInPath() }
        var folders: [URL] = []
        for root in roots {
            folders.append(root)
            for entry in (try? files.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)) ?? [] where entry.pathExtension == "bundle" {
                folders.append(entry)
                folders.append(entry.appendingPathComponent("Contents/Resources"))
            }
        }
        return folders
    }()

    /// The first of these paths that exists in one of the folders.
    static func url(_ paths: String...) -> URL? {
        for folder in folders {
            for path in paths {
                let file = folder.appendingPathComponent(path)
                if FileManager.default.fileExists(atPath: file.path) { return file }
            }
        }
        return nil
    }
}`,
}

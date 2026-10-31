# Code, documentation and assets

Mavis source code and documentation text are distributed under the [MIT license](LICENSE). The npm packages contain code, type declarations, styles, native adapter source, README files and that license. They do not contain the website's illustrations, screenshots or app resources.

Third-party dependencies retain their own licenses. NativeScript, Vue, Jolt and the navigation integrations are installed as dependencies or peers; their sources and artwork are not copied into the Mavis tarballs. Mavis's native adapters extend NativeScript APIs, including version-sensitive internal layout hooks.

## Repository media

| Files | Origin and scope |
| --- | --- |
| `docs/public/favicon.svg`, catalog brand and component artwork in `examples/catalog/shared` | Code-drawn Mavis UI artwork maintained with this repository. The source code follows the MIT license. |
| `docs/public/images/vehicle-mavis.png`, `vehicle-midnight.png` | Screenshots produced from the Mavis demonstration app. They are website media and are not included in npm packages. |
| `docs/public/images/mavis.webp` | Existing portrait of Mavis Vermillion from Fairy Tail. The original creator/source and redistribution permission are not documented in the repository. The code license does not grant rights to the character or portrait. |
| `docs/public/images/mavis-ui-social.jpg` | Website social image supplied by the maintainer and resized for the site. Rights to the underlying character artwork are not established here. It is excluded from npm packages. |
| Native launch-screen resources under `examples/catalog/App_Resources` | Catalog example resources, excluded from npm packages. |
| `packages/nativescript/fonts/lucide.ttf`, `packages/web/src/fonts/lucide.woff2` | Lucide icon font 1.65.0 by Lucide Icons and Contributors, ISC license, copied by `scripts/generate-icons.mjs` from `lucide-static` with its license text alongside. Included in the npm packages for `MIcon`. |

Fairy Tail character names and third-party marks remain associated with their respective owners. This project does not claim their ownership or endorsement. Provenance and permitted redistribution of the website's character artwork remain tracked in [#44](https://github.com/getcortexlabs/mavis-ui/issues/44); the npm release does not distribute those images.

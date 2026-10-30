# Mavis for Vue Web

Experimental HTML implementation of the ten Mavis components. Import `createMavis` from `@mavis-ui/web` and include `@mavis-ui/web/style.css` in the app entry. The stylesheet supplies focus indicators, box overlays, and motion.

Themes and Vue context come from `@mavis-ui/core`. NativeScript and Jolt are not dependencies of this package. Browser motion currently uses CSS; [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236) tracks its Web backend.

Use `MText.as` for HTML heading semantics. Buttons emit a payload-free `click` and retain native HTML keyboard activation. Sliders expose semantic values to accessibility APIs, including fractional steps. Theme state belongs to each app. The package is safe to import during server rendering.

From the repository root, run `npm ci`, `npm run build`, and `npm run web:dev`. See the [Web guide](../../docs/guide/web.md) for setup and portability limits. This package is private and has not been published to npm.

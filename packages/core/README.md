# Mavis core

Shared themes and contracts for Mavis UI `0.1.0-alpha.3`. This is an experimental prerelease; the API can change between alpha versions. Licensed under MIT.

```sh
npm install @getcortexlabs/mavis-core@0.1.0-alpha.3
```

Theme values, spacing resolution, and slider step conversion have no platform dependencies. The optional `/vue` entry provides the theme context, layout context, and common template types through Vue's renderer-independent runtime core.

NativeScript and Web applications must resolve a single Vue runtime instance. The example webpack config and Vite dedupe settings show this for a local monorepo checkout.

Most apps install the NativeScript package (`@getcortexlabs/mavis`) or the Web package (`@getcortexlabs/mavis-web`), both of which depend on this package. Declare core directly when importing it in shared application code.

[Documentation](https://mavis-ui.getcortexlabs.com/guide/themes) · [Release notes and known limits](https://github.com/getcortexlabs/mavis-ui/blob/main/CHANGELOG.md)

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'nativescript-vue': new URL('./test/native-vue.ts', import.meta.url).pathname,
      '@getcortexlabs/mavis-core/experimental': new URL(
        './packages/core/src/experimental.ts',
        import.meta.url,
      ).pathname,
      '@getcortexlabs/mavis-core/vue': new URL('./packages/core/src/vue/index.ts', import.meta.url)
        .pathname,
      '@getcortexlabs/mavis-core': new URL('./packages/core/src/index.ts', import.meta.url)
        .pathname,
    },
  },
  test: {
    // Finish the cold Swift toolchain before the TypeScript/compiler test workers compete
    // for the runner. This also applies to local `npm test` and the release workflow.
    projects: [
      {
        extends: true,
        test: {
          name: 'swift-policy',
          include: ['test/swift-trackpad.spec.ts'],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['test/**/*.spec.ts'],
          exclude: ['test/swift-trackpad.spec.ts'],
          sequence: { groupOrder: 1 },
        },
      },
    ],
    clearMocks: true,
    server: { deps: { inline: ['@rafaelaugusto/jolt'] } },
  },
})

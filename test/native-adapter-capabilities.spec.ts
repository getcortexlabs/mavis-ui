import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { targetCapabilities } from '../packages/core/src/capabilities.js'
import { componentContracts } from '../packages/core/src/contracts.js'
it('pins direct native coverage to the executable consumer without enabling a compiler', () => {
  const consumer = JSON.parse(readFileSync('examples/native-adapters/package.json', 'utf8'))
  const direct = targetCapabilities.targets.filter(
    (target) => 'authoring' in target && target.authoring === 'direct',
  )
  expect(direct).toHaveLength(5)
  for (const target of direct) {
    if (!('versions' in target)) throw new Error('Missing native compatibility')
    expect(target.components).toEqual(Object.keys(componentContracts))
    for (const [name, version] of Object.entries(target.versions))
      expect(consumer.dependencies[name]).toBe(version)
    expect(target.generator).toBe('unsupported')
    expect(target.scaffold).toBe('unsupported')
    expect(target.rendering.serverHTML).toBe('unsupported')
    expect(target.componentCapabilities.MText.spans).toBe('unsupported')
    expect(target.componentCapabilities.MButton.loadingIndicator).toEqual(['none'])
    expect(target.compatibility.nativeCore).toBe(consumer.dependencies['@nativescript/core'])
    expect(target.compatibility.ios).toBe(consumer.devDependencies['@nativescript/ios'])
    expect(target.compatibility.android).toBe(consumer.devDependencies['@nativescript/android'])
  }
})

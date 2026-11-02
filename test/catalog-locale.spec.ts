import { expect, it } from 'vitest'
import { createCatalogLocale, translate } from '../examples/catalog/shared/locale/index.js'
import { readFileSync } from 'node:fs'
const catalog = readFileSync('examples/catalog/shared/catalog.ts', 'utf8')
const components = [...catalog.matchAll(/id: '([^']+)',[\s\S]*?description: '([^']+)'/g)].map(
  (match) => ({ id: match[1]!, description: match[2]! }),
)
import { references } from '../examples/catalog/shared/reference.js'
import { englishReferences } from '../examples/catalog/shared/locale/reference.en.js'

it('covers every catalog entry with reference copy and a reachable group', () => {
  const groups = catalog.slice(catalog.indexOf('export const componentGroups'))
  const ids = [...groups.matchAll(/'([^']+)'/g)].map((match) => match[1]!)
  for (const component of components) {
    expect(ids, component.id).toContain(component.id)
    expect(references[component.id]).toBeDefined()
    expect(englishReferences[component.id]).toBeDefined()
    expect(translate(component.description, 'en')).not.toBe(component.description)
  }
})

it('preserves inline boundaries, identifiers and application values while labels change', () => {
  expect(translate(' Sessão pronta: ', 'en')).toBe(' Session ready: ')
  const locale = createCatalogLocale('pt')
  const data = [{ value: 'account', label: 'Conta', disabled: true }]
  expect(locale.choices(data)[0]!.value).toBe('account')
  locale.setLanguage('en')
  expect(locale.choices(data)).toEqual([{ value: 'account', label: 'Account', disabled: true }])
  expect(data[0]!.label).toBe('Conta')
  expect(locale.t('An application draft')).toBe('An application draft')
})

import { inject, ref, type InjectionKey } from 'vue'
import { messages } from './messages'

export type CatalogLanguage = 'en' | 'pt'
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const translations = new Map<string, readonly [string, string]>()
for (const pair of messages) for (const phrase of pair) translations.set(normalize(phrase), pair)

export function translate<T>(value: T, language: CatalogLanguage): T | string {
  if (typeof value !== 'string') return value
  const pair = translations.get(normalize(value))
  return pair
    ? `${value.match(/^\s*/)?.[0] ?? ''}${pair[language === 'pt' ? 0 : 1].trim()}${value.match(/\s*$/)?.[0] ?? ''}`
    : value
}

export function createCatalogLocale(initial: CatalogLanguage = 'pt') {
  const locale = ref(initial)
  const t = <T>(text: T) => translate(text, locale.value)
  return {
    locale,
    t,
    choices<T extends object>(items: readonly T[]): T[] {
      return items.map(
        (item) =>
          Object.fromEntries(
            Object.entries(item).map(([key, value]) => [
              key,
              ['label', 'helperText', 'title', 'answer'].includes(key) ? t(value) : value,
            ]),
          ) as T,
      )
    },
    setLanguage(value: CatalogLanguage) {
      locale.value = value
    },
  }
}
export const catalogLocaleKey: InjectionKey<ReturnType<typeof createCatalogLocale>> =
  Symbol('catalog.locale')
export function useCatalogLocale(language?: () => CatalogLanguage | undefined) {
  const context = inject(catalogLocaleKey, () => createCatalogLocale(), true)
  if (!language) return context
  return {
    ...context,
    t: <T>(text: T) => translate(text, language() ?? context.locale.value),
  }
}

import { padded, plural } from './text'

export type Stay = {
  id: string
  name: string
  city: string
  nightly: number
  tags: string[]
  note?: string
}

export const kinds = ['all', 'city', 'coast'] as const
export type Kind = (typeof kinds)[number]

export const taxRate = 0.125

export const stays: Stay[] = [
  { id: 'azul', name: 'Casa Azul', city: 'Porto', nightly: 120.5, tags: ['coast', 'quiet'] },
  {
    id: 'loft',
    name: 'River Loft',
    city: 'Recife',
    nightly: 80.125,
    tags: ['city'],
    note: 'Third floor, no lift',
  },
  { id: 'cabin', name: 'Pine Cabin', city: 'Gramado', nightly: 64, tags: ['quiet'] },
]

const cents = (value: number): number => Math.round(value * 100) / 100

export function total(stay: Stay, nights: number, discount?: number): number {
  const base = stay.nightly * nights
  if (discount === undefined) return cents(base * (1 + taxRate))
  return cents((base - discount) * (1 + taxRate))
}

export function money(value: number): string {
  return `$${value.toFixed(2)}`
}

export function matches(stay: Stay, kind: string): boolean {
  return kind === 'all' || stay.tags.includes(kind)
}

export function summary(list: Stay[], nights: number): string {
  const sum = list.reduce((all, stay) => all + total(stay, nights), 0)
  return `${plural(list.length, 'stay')}, ${plural(nights, 'night')}: ${money(sum)}`
}

export function code(stay: Stay, position: number): string {
  return `${stay.city.slice(0, 3).toUpperCase()}-${padded(position + 1, 3)}`
}

export function detail(stay: Stay): string {
  const note = stay.note
  if (note === undefined) return stay.tags.toReversed().join(' and ')
  return note.replace('Third', '3rd')
}

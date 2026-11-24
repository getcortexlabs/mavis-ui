export const samples = [0.5, 1.5, 2.5, 0.125, 1.005, -0.001, 1234.5678, 1e21]

export const readings = [
  '',
  ' 12 ',
  '0x1F',
  '1e3',
  '.5',
  '5.',
  'abc',
  '-0',
  '-Infinity',
  '0b101',
  '1_000',
  '12px',
]

export function fixed(value: number): string {
  return `${value.toFixed(0)} ${value.toFixed(2)}`
}

export function read(text: string): string {
  const value = Number(text)
  if (Number.isNaN(value)) return 'NaN'
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

export function shape(text: string): string {
  const at = text.indexOf('-')
  const head = at < 0 ? text : text.slice(0, at)
  return `${head.padEnd(6, '.')}${String(text.length).padStart(3, ' ')} ${text.slice(-2)} ${'ab'.repeat(2)}`
}

export function roots(values: number[]): string {
  return values.map((value) => `${Math.trunc(Math.sqrt(value) * 10) / 10}`).join(' ')
}

export function swapped(text: string): string {
  return text.replace('a', '[$&|$$]').replaceAll('n', '$&$&')
}

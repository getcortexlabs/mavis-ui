export type OwnershipBox = { count: number }
export type OwnershipGroup = { names: string[] }
export const seedNames: string[] = ['a']
export const seedBox: OwnershipBox = { count: 1 }
export const seedGroup: OwnershipGroup = { names: ['a'] }
export function moduleValues(): string {
  return seedNames.join(',') + ':' + seedBox.count + ':' + seedGroup.names.join(',')
}

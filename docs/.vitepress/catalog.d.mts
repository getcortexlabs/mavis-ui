export const componentCategories: {
  name: [string, string]
  items: [string, string, string, string][]
}[]
export const componentUpdates: Record<string, 'new' | 'updated'>
export function statusLabel(id: string, pt?: boolean): string
export function statusDescription(id: string, pt?: boolean): string

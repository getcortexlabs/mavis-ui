export * from 'vue'

// The test renderer stores native tags without instantiating platform views.
export function registerElement(_name: string, _resolver: () => unknown) {}

// The platform renderer owns actual recycled cells; contract tests only need the host.
export const ListView = 'ListView'

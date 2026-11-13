// The existing core policy is data shared by the hosts. Compiling that data does not install
// a Web/NativeScript adapter in the Mac: NavigationStack keeps its plain navigation fallback.
export const policyRecords = {
  NavigationTransitionOptions: 'the public NavigationTransition input',
  NavigationTransitionPolicy: 'the resolved defineNavigationTransition policy',
}

export const policyAmbient = `
type NavigationTransitionOptions = { name?: 'fade' | 'slide' | 'none'; duration?: number }
type NavigationTransitionPolicy = { readonly name: 'fade' | 'slide' | 'none'; readonly duration: number }
declare module '@getcortexlabs/mavis-core' {
  export type NavigationTransition = NavigationTransitionOptions
  export function defineNavigationTransition(options?: NavigationTransition): NavigationTransitionPolicy
}
`

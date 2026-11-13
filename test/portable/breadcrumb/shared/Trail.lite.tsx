import { useStore } from '@builder.io/mitosis'

export default function Trail() {
  const state = useStore({
    path: [
      { key: 'home', label: 'Home', href: 'https://mavis.example/' },
      { key: 'library', label: 'Library', href: 'https://mavis.example/library' },
      { key: 'shelves', label: 'Shelves', href: 'https://mavis.example/library/shelves' },
      { key: 'fiction', label: 'Fiction', href: 'https://mavis.example/library/shelves/fiction' },
      { key: 'dune', label: 'Dune' },
    ] as BreadcrumbItem[],
    near: false,
    get shown(): BreadcrumbItem[] {
      return state.near ? state.path.slice(3) : state.path
    },
  })

  return (
    <MColumn gap="md">
      <MColumn width={220}>
        <MBreadcrumb
          id="trail"
          items={state.shown}
          maxItems={2}
          expandLabel="Show the whole path"
        />
      </MColumn>
      <MText id="count">{`${state.shown.length} places`}</MText>
      <MButton text="Nearer" variant="secondary" onClick={() => (state.near = !state.near)} />
    </MColumn>
  )
}

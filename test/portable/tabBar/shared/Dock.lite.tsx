import { useStore } from '@builder.io/mitosis'

export default function Dock() {
  const state = useStore({
    route: 'home' as ChoiceValue | undefined,
    off: false,
    places: [
      { value: 'home', label: 'Home', href: 'https://mavis.example/', icon: 'house' },
      {
        value: 'library',
        label: 'Library',
        href: 'https://mavis.example/library',
        icon: 'book-open',
        badge: '3',
      },
    ] as NavigationItem[],
  })

  return (
    <MColumn id="page" gap="md">
      <MTabBar
        id="dock"
        label="Main navigation"
        items={state.places}
        value={state.route}
        disabled={state.off}
      />
      <MText id="where">{`At ${state.route ?? 'nowhere'}`}</MText>
      <MRow gap="sm" wrap>
        <MButton
          text="Go to library"
          variant="secondary"
          onClick={() => (state.route = 'library')}
        />
        <MButton text="Leave" variant="secondary" onClick={() => (state.route = undefined)} />
        <MButton text="Turn off" variant="secondary" onClick={() => (state.off = !state.off)} />
      </MRow>
    </MColumn>
  )
}

import { useStore } from '@builder.io/mitosis'

export default function Desk() {
  const state = useStore({
    route: 'overview' as ChoiceValue | undefined,
    narrow: false,
    groups: [
      {
        key: 'work',
        label: 'Workspace',
        items: [
          {
            value: 'overview',
            label: 'Overview',
            href: 'https://mavis.example/overview',
            icon: 'layout-dashboard',
            badge: '8',
          },
        ],
      },
      {
        key: 'people',
        label: 'Together',
        items: [
          { value: 'team', label: 'Team', href: 'https://mavis.example/team', icon: 'users' },
          {
            value: 'guests',
            label: 'Guests',
            href: 'https://mavis.example/guests',
            disabled: true,
          },
        ],
      },
    ] as NavigationGroup[],
  })

  return (
    <MRow gap="md" align="start">
      <MNavigationRail
        id="rail"
        label="Desk"
        groups={state.groups}
        value={state.route}
        collapsed={state.narrow}
        onCollapse={(value) => (state.narrow = value)}
        slotHeader={({ collapsed }) => <MText id="brand">{collapsed ? 'M' : 'Mavis'}</MText>}
        slotFooter={({ collapsed }) => <MText id="who">{collapsed ? 'R' : 'Rafael'}</MText>}
      />
      <MColumn id="main" gap="md" grow={1}>
        <MText>{`At ${state.route ?? 'nowhere'}`}</MText>
        <MButton text="Open team" variant="secondary" onClick={() => (state.route = 'team')} />
      </MColumn>
    </MRow>
  )
}

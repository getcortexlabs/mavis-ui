import { useStore } from '@builder.io/mitosis'
export default function TypedDestinations() {
  const state = useStore({
    value: 1 as ChoiceValue | undefined,
    items: [
      { value: 1, label: 'Number place', href: 'https://mavis.example/number' },
      { value: '1', label: 'Text place', href: 'https://mavis.example/text' },
      { value: 0, label: 'Zero place', href: 'https://mavis.example/zero' },
    ] as NavigationItem[],
    groups: [
      {
        key: 'main',
        label: 'Places',
        items: [
          { value: 1, label: 'Number rail', href: 'https://mavis.example/number' },
          { value: '1', label: 'Text rail', href: 'https://mavis.example/text' },
          { value: 0, label: 'Zero rail', href: 'https://mavis.example/zero' },
        ],
      },
    ] as NavigationGroup[],
    get summary(): string {
      return state.value === 1
        ? 'Numeric one'
        : state.value === '1'
          ? 'Textual one'
          : state.value === 0
            ? 'Zero'
            : 'None'
    },
  })
  return (
    <MColumn gap="md">
      <MTabBar id="dock" label="Typed destinations" items={state.items} value={state.value} />
      <MNavigationRail
        label="Typed rail"
        groups={state.groups}
        value={state.value}
        collapsible={false}
      />
      <MText>{state.summary}</MText>
      <MRow gap="sm">
        <MButton text="Show text" onClick={() => (state.value = '1')} />
        <MButton text="Show zero" onClick={() => (state.value = 0)} />
        <MButton text="Show number" onClick={() => (state.value = 1)} />
        <MButton text="Clear" onClick={() => (state.value = undefined)} />
      </MRow>
    </MColumn>
  )
}

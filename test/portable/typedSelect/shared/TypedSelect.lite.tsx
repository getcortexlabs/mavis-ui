import { useStore } from '@builder.io/mitosis'

type AppOption = { value: string | number; label: string; disabled?: boolean }

export default function TypedSelect() {
  const state = useStore({
    chosen: null as string | number | null,
    number: null as number | null,
    changes: 0,
    options: [
      { value: 1, label: 'Number one' },
      { value: '1', label: 'Text one' },
      { value: 0, label: 'Zero' },
      { value: 2, label: 'Blocked', disabled: true },
    ] as AppOption[],
    get summary(): string {
      return state.chosen === null
        ? 'No selection'
        : state.chosen === 1
          ? 'Numeric one'
          : state.chosen === '1'
            ? 'Textual one'
            : `Other ${state.chosen ?? 'none'}`
    },
    change(value: ChoiceValue) {
      state.chosen = value
      state.changes += 1
    },
    reset() {
      state.chosen = null
      state.number = null
    },
  })
  return (
    <MColumn gap="md">
      <MSelect
        label="Mixed"
        value={state.chosen}
        options={state.options}
        width={320}
        placeholder="Choose mixed"
        onChange={(value) => state.change(value)}
      />
      <MSelect
        label="Numeric"
        value={state.number}
        options={[
          { value: 1, label: 'One' },
          { value: 0, label: 'Zero' },
        ]}
        placeholder="Choose number"
        onChange={(value) => {
          state.number = value
        }}
      />
      <MText>{state.summary}</MText>
      <MText>{`Number ${state.number ?? -1}; changes ${state.changes}`}</MText>
      <MButton text="Reset" onClick={() => state.reset()} />
    </MColumn>
  )
}

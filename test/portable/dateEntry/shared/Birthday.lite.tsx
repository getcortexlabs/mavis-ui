import { useStore } from '@builder.io/mitosis'
export default function Birthday() {
  const state = useStore({
    date: '2024-02-28' as CivilDate | null,
    draft: '28/02/2024',
    reason: 'none',
    locked: false,
  })
  return (
    <MColumn gap="md">
      <MDatePicker
        label="Birthday"
        value={state.date}
        onChange={(value) => (state.date = value)}
        draft={state.draft}
        onDraftChange={(value) => (state.draft = value)}
        onValidityChange={(value) => (state.reason = value.reason ?? 'valid')}
        locale="pt-BR"
        dateFormat="locale"
        initialMonth="2024-02"
        min="2024-02-01"
        max="2024-03-31"
        unavailableDates={['2024-02-29']}
        disabled={state.locked}
      />
      <MText>{`Date: ${state.date ?? 'none'}`}</MText>
      <MText>{`Draft: ${state.draft}`}</MText>
      <MText>{`Reason: ${state.reason}`}</MText>
      <MButton
        text={state.locked ? 'Unlock' : 'Lock'}
        onClick={() => (state.locked = !state.locked)}
      />
    </MColumn>
  )
}

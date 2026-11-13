import { useStore } from '@builder.io/mitosis'
export default function Meeting() {
  const state = useStore({
    time: null as LocalTime | null,
    draft: '',
    status: 'none',
    required: false,
  })
  return (
    <MColumn gap="md">
      <MTimePicker
        label="Meeting"
        value={state.time}
        onChange={(value) => (state.time = value)}
        draft={state.draft}
        onDraftChange={(value) => (state.draft = value)}
        onValidityChange={(value) => (state.status = value.status)}
        min="09:01"
        max="18:00"
        minuteStep={15}
        required={state.required}
      />
      <MText>{`Time: ${state.time ?? 'none'}`}</MText>
      <MText>{`Draft: ${state.draft}`}</MText>
      <MText>{`Status: ${state.status}`}</MText>
      <MButton
        text={state.required ? 'Optional time' : 'Require time'}
        onClick={() => (state.required = !state.required)}
      />
    </MColumn>
  )
}

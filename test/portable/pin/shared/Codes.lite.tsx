import { useStore } from '@builder.io/mitosis'

export default function Codes() {
  const state = useStore({
    code: '',
    done: 'nothing yet',
    get problem() {
      return state.code === '00000' ? 'That code has expired' : ''
    },
    finish(next: string) {
      state.done = next
    },
  })

  return (
    <MColumn gap="md">
      <MPinInput
        id="code"
        label="Code"
        value={state.code}
        onChange={(value) => (state.code = value)}
        onComplete={(next) => state.finish(next)}
        length={5}
        helperText="Five digits"
        error={state.problem}
      />
      <MText id="code-text">{`Code ${state.code} done ${state.done}`}</MText>
      <MRow gap="sm">
        <MButton text="Fill" variant="secondary" onClick={() => (state.code = '12345')} />
        <MButton text="Expire" variant="secondary" onClick={() => (state.code = '00000')} />
        <MButton text="Clear" variant="ghost" onClick={() => (state.code = '')} />
      </MRow>
      <MPinInput
        label="Backup code"
        value="42"
        onChange={(value) => (state.code = value)}
        length={4}
        disabled
      />
    </MColumn>
  )
}

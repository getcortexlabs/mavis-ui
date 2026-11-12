import { useRef, useStore } from '@builder.io/mitosis'

export default function Entry() {
  const codeRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    code: '',
    done: 'nothing yet',
    get problem() {
      return state.code === '00000' ? 'That code has expired' : ''
    },
    finish(next: string) {
      state.done = next
    },
    edit() {
      codeRef.focus()
    },
  })

  return (
    <MColumn gap="md">
      <MPinInput
        ref={codeRef}
        label="Code"
        value={state.code}
        onChange={(value) => (state.code = value)}
        onComplete={(next) => state.finish(next)}
        length={5}
        helperText="Five digits"
        error={state.problem}
      />
      <MText>{`Code ${state.code} done ${state.done}`}</MText>
      <MButton text="Edit code" onClick={() => state.edit()} />
    </MColumn>
  )
}

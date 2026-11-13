import { useStore } from '@builder.io/mitosis'

export default function Drafts() {
  const toast = useToast()
  const state = useStore({
    saved: 0,
    tone: 'success' as MavisToastTone,
    save() {
      state.saved += 1
      toast.show({
        title: 'Draft saved',
        message: `Version ${state.saved} is safe.`,
        tone: state.tone,
      })
    },
    fail() {
      toast.show({ message: 'The upload did not finish.', tone: 'error', duration: 0 })
    },
  })

  return (
    <MScreen>
      <MColumn id="page" gap="md" padding="lg">
        <MColumn id="top" height={160} />
        <MText>{`${state.saved} saved`}</MText>
        <MRow gap="sm">
          <MButton text="Save" onClick={() => state.save()} />
          <MButton text="Fail" variant="secondary" onClick={() => state.fail()} />
          <MButton
            text="Hint"
            variant="secondary"
            onClick={() => toast.show({ message: 'Drafts save as you type.', duration: 400 })}
          />
        </MRow>
        <MRow gap="sm">
          <MButton text="Dismiss" variant="ghost" onClick={() => toast.dismiss()} />
          <MButton text="Clear" variant="ghost" onClick={() => toast.clear()} />
        </MRow>
        <MToast controller={toast} closeLabel="Close message" />
      </MColumn>
    </MScreen>
  )
}

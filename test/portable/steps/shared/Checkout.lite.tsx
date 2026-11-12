import { useStore } from '@builder.io/mitosis'

export default function Checkout() {
  const state = useStore({
    current: 'cart' as string | undefined,
    failed: false,
    unlocked: false,
    busy: false,
    asked: 0,
    get steps(): StepOption[] {
      return [
        { value: 'cart', label: 'Cart', status: 'complete' },
        { value: 'address', label: 'Address', status: state.failed ? 'error' : 'pending' },
        { value: 'payment', label: 'Payment', disabled: !state.unlocked },
        { value: 'review', label: 'Review' },
      ]
    },
    // The source keeps the review closed.
    go(value: string) {
      state.asked = state.asked + 1
      if (value !== 'review') state.current = value
    },
  })

  return (
    <MColumn gap="md">
      <MColumn id="flow">
        <MSteps
          label="Checkout"
          steps={state.steps}
          value={state.current}
          onChange={(value) => state.go(value)}
          loading={state.busy}
        />
      </MColumn>
      <MText id="summary">{`Step ${state.current ?? 'none'}, asked ${state.asked}`}</MText>
      <MRow gap="sm" wrap>
        <MButton
          text="Fail address"
          variant="ghost"
          onClick={() => (state.failed = !state.failed)}
        />
        <MButton text="Unlock payment" variant="ghost" onClick={() => (state.unlocked = true)} />
        <MButton text="Busy" variant="ghost" onClick={() => (state.busy = !state.busy)} />
        <MButton text="Leave" variant="ghost" onClick={() => (state.current = undefined)} />
      </MRow>
    </MColumn>
  )
}

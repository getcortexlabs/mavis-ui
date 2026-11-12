import { Show, useStore } from '@builder.io/mitosis'
import Tally from './Tally.lite'

export default function Space() {
  const state = useStore({
    active: 'profile' as string | undefined,
    box: 'drafts' as string | undefined,
    locked: false,
    asked: 0,
    tabs: [
      { value: 'profile', label: 'Profile' },
      { value: 'activity', label: 'Activity' },
      { value: 'billing', label: 'Billing' },
      { value: 'soon', label: 'Coming soon', disabled: true },
    ] as TabOption[],
    boxes: [
      { value: 'drafts', label: 'Drafts' },
      { value: 'sent', label: 'Sent' },
    ] as TabOption[],
    // The source keeps billing closed.
    choose(value: string) {
      state.asked = state.asked + 1
      if (value !== 'billing') state.active = value
    },
  })

  return (
    <MColumn gap="none">
      <MText id="intro">Your space</MText>
      <MTabs
        id="space"
        label="Your space"
        tabs={state.tabs}
        value={state.active}
        onChange={(value) => state.choose(value)}
        disabled={state.locked}
      >
        {({ value }) => (
          <MColumn id="panel" gap="sm">
            <Show when={value === 'profile'} else={<MText>{`Recent ${value}`}</MText>}>
              <MText variant="heading">About you</MText>
              <Tally name="visits" />
            </Show>
          </MColumn>
        )}
      </MTabs>
      <MText>{`Asked ${state.asked}`}</MText>
      <MRow gap="sm" wrap>
        <MButton text="Lock" variant="secondary" onClick={() => (state.locked = !state.locked)} />
        <MButton text="Clear" variant="secondary" onClick={() => (state.active = undefined)} />
        <MButton
          text="Open activity"
          variant="secondary"
          onClick={() => (state.active = 'activity')}
        />
      </MRow>
      <MTabs
        label="Mailbox"
        tabs={state.boxes}
        value={state.box}
        onChange={(value) => (state.box = value)}
        keepAlive
      >
        {({ value }) => <Tally name={value} />}
      </MTabs>
    </MColumn>
  )
}

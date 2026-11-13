import { Show, useStore } from '@builder.io/mitosis'

export default function Topics() {
  const state = useStore({ design: true, motion: false, pinned: true, locked: true })

  return (
    <MColumn id="page" gap="md" width={360}>
      <MText>
        {state.design ? 'Design' : 'No design'}, {state.motion ? 'motion' : 'no motion'},{' '}
        {state.locked ? 'locked' : 'open'}
      </MText>
      <MRow id="topics" gap="sm">
        <MChip
          id="design"
          label="Design"
          selectable
          selected={state.design}
          onChange={(value) => (state.design = value)}
        />
        <MChip
          id="motion"
          label="Motion"
          icon="sparkles"
          tone="accent"
          selectable
          selected={state.motion}
          onChange={(value) => (state.motion = value)}
        />
        <MChip id="plain" label="Read only" icon="lock" />
      </MRow>
      <Show when={state.pinned}>
        <MChip
          id="pinned"
          label="Pinned"
          removable
          removeLabel="Unpin"
          onRemove={() => (state.pinned = false)}
        />
      </Show>
      <MChip
        id="locked"
        label="Locked"
        selectable
        selected={state.locked}
        onChange={(value) => (state.locked = value)}
        removable
        removeLabel="Remove Locked"
        onRemove={() => (state.locked = false)}
        disabled
      />
      <MChip
        id="wide"
        label="On"
        selectable
        selected={state.design}
        onChange={(value) => (state.design = value)}
        width={200}
      />
      <MColumn id="narrow" width={140}>
        <MChip id="long" label="A label that does not fit" />
      </MColumn>
    </MColumn>
  )
}

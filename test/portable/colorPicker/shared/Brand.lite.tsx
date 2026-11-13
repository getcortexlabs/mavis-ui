import { useStore } from '@builder.io/mitosis'

export default function Brand() {
  const state = useStore({
    color: '#FF0000',
    colors: ['#f00', 'rgba(0,255,0,.5)', '#00f'],
    locked: false,
    quiet: false,
    choose(value: string) {
      // The source can refuse a valid choice, just like every other controlled field.
      if (value !== '#0000FFFF') state.color = value
    },
  })

  return (
    <MColumn gap="md">
      <MColorPicker
        id="brand"
        label="Brand color"
        value={state.color}
        onChange={(value) => state.choose(value)}
        palette={state.colors}
        alpha
        readonly={state.locked}
        animated={!state.quiet}
      />
      <MText>{`Chosen: ${state.color}`}</MText>
      <MButton
        text={state.locked ? 'Unlock' : 'Lock'}
        onClick={() => (state.locked = !state.locked)}
      />
      <MButton
        text={state.quiet ? 'Animate' : 'Set immediately'}
        onClick={() => (state.quiet = !state.quiet)}
      />
    </MColumn>
  )
}

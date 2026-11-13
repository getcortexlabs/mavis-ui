import { useStore } from '@builder.io/mitosis'
export default function Photos() {
  const state = useStore({
    images: [
      {
        key: 'one',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC',
        alt: 'Blue morning',
        caption: 'Before sunrise',
      },
      {
        key: 'two',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC',
        alt: 'Evening light',
        caption: 'After sunset',
      },
    ] as ViewerImage[],
    selected: undefined as string | undefined,
    open: false,
    reason: 'none',
  })
  return (
    <MColumn gap="md">
      <MImageViewer
        label="Portfolio"
        images={state.images}
        value={state.selected}
        onChange={(value) => (state.selected = value)}
        open={state.open}
        onUpdateOpen={(value) => (state.open = value)}
        onClose={(reason) => (state.reason = reason)}
        maxZoom={3}
      />
      <MText>Selected: {state.selected ?? 'none'}</MText>
      <MText>Closed: {state.reason}</MText>
    </MColumn>
  )
}

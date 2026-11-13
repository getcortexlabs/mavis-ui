import { useStore } from '@builder.io/mitosis'
import { studioLight, studioDark } from './studio-theme'
import type { Pane } from './types'
export default function ThemeMotion() {
  const toast = useToast()
  const state = useStore({
    night: false,
    selected: 'one',
    panes: [
      { id: 'one', title: 'First scene' },
      { id: 'two', title: 'Second scene' },
    ] as Pane[],
  })
  return (
    <MThemeProvider
      theme={studioLight}
      darkTheme={studioDark}
      appearance={state.night ? 'dark' : 'light'}
    >
      <MColumn gap="md">
        <MCarousel
          label="Studio scenes"
          items={state.panes}
          value={state.selected}
          onChange={(value) => (state.selected = value)}
          loop
        >
          {({ item }) => (
            <MCard>
              <MText>{item.title}</MText>
            </MCard>
          )}
        </MCarousel>
        <MText>{`Selected ${state.selected}`}</MText>
        <MButton
          text={state.night ? 'Use daylight' : 'Use night'}
          onClick={() => (state.night = !state.night)}
        />
        <MButton
          text="Show notice"
          onClick={() => toast.show({ message: 'Theme notice', duration: 0 })}
        />
        <MToast controller={toast} />
      </MColumn>
    </MThemeProvider>
  )
}

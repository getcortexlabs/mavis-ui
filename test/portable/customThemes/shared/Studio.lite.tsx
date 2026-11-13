import { useStore } from '@builder.io/mitosis'
import { studioLight, studioDark } from './studio-theme'
import LocalCount from './LocalCount.lite'

export default function Studio() {
  const state = useStore({ night: false, draft: 'Original' })
  return (
    <MThemeProvider
      theme={studioLight}
      darkTheme={studioDark}
      appearance={state.night ? 'dark' : 'light'}
    >
      <MColumn id="studio" gap="md">
        <MCard id="studio-card">
          <MBox height={24} />
        </MCard>
        <MRow gap="xs">
          <MBox id="first-swatch" width={20} height={20} backgroundColor="#305090" />
          <MBox id="second-swatch" width={20} height={20} backgroundColor="#7090C0" />
        </MRow>
        <MText variant="body">Custom studio</MText>
        <MInput
          label="Theme draft"
          value={state.draft}
          onChange={(value) => (state.draft = value)}
        />
        <MText>{state.draft}</MText>
        <LocalCount />
        <MThemeProvider appearance="light">
          <MCard id="nested-light">
            <MBox height={24} />
          </MCard>
        </MThemeProvider>
        <MButton
          id="theme-toggle"
          text={state.night ? 'Use daylight' : 'Use night'}
          onClick={() => (state.night = !state.night)}
        />
        <MButton text="Set draft" onClick={() => (state.draft = 'Retained')} />
      </MColumn>
    </MThemeProvider>
  )
}

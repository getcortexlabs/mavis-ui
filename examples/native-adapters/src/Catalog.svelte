<script lang="ts">
  import { MColumn, MRow, MBox, MText, MButton, MInput, MThemeProvider } from '@getcortexlabs/mavis/svelte'
  import { bridge, initial, theme, isolatedTheme, surface } from './_model'
  let state = { ...initial }
  let input: MInput
  bridge.read = () => state
  bridge.update = patch => { state = { ...state, ...patch } }
  bridge.focus = () => input?.focusInput()
</script>

<page actionBarHidden={true}>
  <MThemeProvider {theme}>
    <MColumn id="catalog" gap="md" padding="lg">
      <MText id="heading" variant="title">Direct NativeScript / Svelte</MText>
      <MRow id="row" gap="sm">
        <MButton id="action" disabled={state.disabled} loading={state.loading} on:click={() => bridge.update?.({ count: state.count + 1 })}>Count {state.count}</MButton>
      </MRow>
      <MInput id="editor" label="Name" modelValue={state.value} disabled={state.disabled} on:valueChange={event => bridge.update?.({ value: event.detail })} bind:this={input} />
      {#if state.visible}<MBox id="motion" width={100} height={30} backgroundColor="#4f46e5" motionSurface={surface} />{/if}
      <MText id="isolated" theme={isolatedTheme} text="Independent theme" />
    </MColumn>
  </MThemeProvider>
</page>

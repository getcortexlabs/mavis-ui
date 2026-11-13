import { useStore } from '@builder.io/mitosis'

export default function Switches() {
  const state = useStore({
    wifi: true,
    sync: false,
    locked: true,
    // The source keeps sync off while the settings are locked.
    choose(next: boolean) {
      if (!state.locked) state.sync = next
    },
  })

  return (
    <MColumn gap="md">
      <MBox id="wifi-box">
        <MSwitch label="Wi-Fi" checked={state.wifi} onChange={(value) => (state.wifi = value)} />
      </MBox>
      <MText>{state.wifi ? 'Wi-Fi on' : 'Wi-Fi off'}</MText>
      <MBox id="sync-box">
        <MSwitch
          id="sync"
          label="Sync"
          helperText="Keeps this Mac up to date"
          checked={state.sync}
          onChange={(next) => state.choose(next)}
        />
      </MBox>
      <MText>{`Sync ${state.sync ? 'on' : 'off'}`}</MText>
      <MSwitch label="Locked" checked={state.locked} onChange={(value) => (state.locked = value)} />
      <MSwitch
        label="Managed"
        helperText="Set by your team"
        checked={state.wifi}
        onChange={(value) => (state.wifi = value)}
        disabled
      />
      <MRow gap="md">
        <MBox id="compact-box">
          <MSwitch label="Compact" checked={state.sync} onChange={(next) => state.choose(next)} />
        </MBox>
        <MText id="beside" grow={1}>
          Beside
        </MText>
      </MRow>
    </MColumn>
  )
}

import { useStore } from '@builder.io/mitosis'
export default function BasicInputs() {
  const state = useStore({
    search: 'Mavis',
    url: 'https://mavis-ui.getcortexlabs.com/',
    phone: '+55 11 99999-1234',
    actions: 0,
    locked: true,
    clear() {
      state.search = ''
      state.actions += 1
    },
    get action(): InputAction {
      return { icon: 'x', label: 'Clear search', disabled: state.locked }
    },
  })
  return (
    <MColumn gap="md" width="100%">
      <MInput
        id="search"
        label="Search"
        type="search"
        value={state.search}
        onChange={(value) => {
          state.search = value
        }}
        width={320}
        trailingAction={state.action}
        onAction={() => state.clear()}
      />
      <MInput
        label="Website"
        type="url"
        value={state.url}
        onChange={(value) => {
          state.url = value
        }}
        width={320}
      />
      <MInput
        label="Phone"
        type="tel"
        value={state.phone}
        onChange={(value) => {
          state.phone = value
        }}
        width={320}
      />
      <MButton
        text="Unlock action"
        onClick={() => {
          state.locked = false
        }}
      />
      <MText>
        Actions {state.actions}; query "{state.search}"
      </MText>
    </MColumn>
  )
}

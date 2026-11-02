import type {
  ContractProps,
  InputEvents,
  TextInputHandle,
} from '../../packages/core/src/contracts.js'
import { componentContracts } from '../../packages/core/src/contracts.js'

const name: ContractProps<typeof componentContracts.MInput.props> = {
  label: 'Name',
  modelValue: 'Ada',
}
const button: ContractProps<typeof componentContracts.MButton.props> = {
  type: 'submit',
  size: 'md',
}
// @ts-expect-error A portable Input still requires its label.
const unnamed: ContractProps<typeof componentContracts.MInput.props> = { modelValue: 'Ada' }
// @ts-expect-error The neutral contract retains the finite button type choices.
const invalid: ContractProps<typeof componentContracts.MButton.props> = { type: 'link' }
function useHandle(handle: TextInputHandle, events: InputEvents) {
  handle.focus()
  handle.blur()
  events.valueChange('Ada')
  // @ts-expect-error A focus intention is not a DOM/native view handle.
  handle.element.focus()
}
void [name, button, unnamed, invalid, useHandle]

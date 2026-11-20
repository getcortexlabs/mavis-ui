import { createElement, createRef } from 'react'
import { createComponent } from 'solid-js'
import type { ComponentProps } from 'svelte'
import { createMavis } from '@getcortexlabs/mavis/native'
import {
  MInput as ReactInput,
  MButton as ReactButton,
  type MavisComponentHandle,
} from '@getcortexlabs/mavis-react-nativescript'
import { MInput as SolidInput } from '@getcortexlabs/mavis-solid-nativescript'
import { MInput as SvelteInput } from '@getcortexlabs/mavis-svelte-nativescript'
import type { MInput as AngularInput } from '@getcortexlabs/mavis-angular-nativescript'

const native = createMavis()
const field = native.create(
  'MInput',
  { label: 'Name', modelValue: 'Ada' },
  {
    valueChange(value) {
      value.toUpperCase()
    },
  },
)
field.focus()
field.view.addChild(native.create('MText', { text: 'Value' }).view)
// @ts-expect-error Required accessible input label.
native.create('MInput', { modelValue: 'Ada' })
// @ts-expect-error Unknown native component.
native.create('Missing', {})
// @ts-expect-error Finite shared variant choices.
native.create('MButton', { variant: 'invalid' })
const ref = createRef<MavisComponentHandle>()
createElement(ReactInput, { label: 'Name', ref, onValueChange: (value) => value.toUpperCase() })
// @ts-expect-error Required label remains required in React.
createElement(ReactInput, { modelValue: 'Ada' })
// @ts-expect-error React button variant matches the neutral contract.
createElement(ReactButton, { variant: 'invalid' })
createComponent(SolidInput, { label: 'Name', onValueChange: (value) => value.toUpperCase() })
// @ts-expect-error Solid retains controlled string values.
createComponent(SolidInput, { label: 'Name', modelValue: 2 })
const svelte: ComponentProps<SvelteInput> = { label: 'Name', modelValue: 'Ada' }
// @ts-expect-error Svelte requires the same label.
const unnamed: ComponentProps<SvelteInput> = { modelValue: 'Ada' }
function angular(input: AngularInput) {
  input.modelValue = 'Ada'
  input.modelValueChange.subscribe((value) => value.toUpperCase())
  // @ts-expect-error Angular input binding remains string-valued.
  input.modelValue = 2
  input.focusInput()
}
void [svelte, unnamed, angular]

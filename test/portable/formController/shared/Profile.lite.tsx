import { useStore, useRef } from '@builder.io/mitosis'

export default function Profile() {
  const emailField = useRef<MavisFieldRef>(null)
  const form = useFormController()
  useFormField(form, { name: 'email', label: 'Email', target: () => emailField })
  const state = useStore({
    value: '',
    focused: '',
    check() {
      form.setErrors([{ field: 'email', message: 'Enter an address' }])
    },
    clear() {
      form.setErrors([])
    },
    first() {
      form.focusFirstError()
    },
  })
  return (
    <MColumn gap="md" padding="lg">
      <MFormGroup label="Profile" description="Your contact information">
        <MInput
          ref={emailField}
          label="Email"
          value={state.value}
          onChange={(value) => {
            state.value = value
          }}
        />
      </MFormGroup>
      <MFormErrors
        form={form}
        onFocus={(field, found) => {
          state.focused = found ? field : 'unavailable'
        }}
      />
      <MButton text="Check" onClick={() => state.check()} />
      <MButton text="First error" onClick={() => state.first()} />
      <MButton text="Clear errors" onClick={() => state.clear()} />
      <MText>Focused {state.focused}</MText>
    </MColumn>
  )
}

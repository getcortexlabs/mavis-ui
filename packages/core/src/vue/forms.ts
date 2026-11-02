import { markRaw, onScopeDispose } from '@vue/runtime-core'
import { useCachedActivity } from './cached-activity.js'
import {
  createFormController,
  type FormController,
  type FormError,
  type FormField,
} from '../form.js'

export function useFormController(initial: readonly FormError[] = []) {
  const form = markRaw(createFormController(initial))
  onScopeDispose(() => form.dispose())
  return form
}
export function useFormField(form: FormController, field: FormField) {
  const active = useCachedActivity()
  const release = form.register({ ...field, target: () => (active.value ? field.target() : null) })
  onScopeDispose(release)
  return release
}

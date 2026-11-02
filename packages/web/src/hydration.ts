import { getCurrentInstance, onBeforeMount, onMounted, shallowRef } from 'vue'

/** Read only this component's existing server root, before Vue patches editor values. */
export function useHydrationEdit<T>(
  read: (root: Element) => T | undefined,
  adopt: (value: T) => void,
) {
  const instance = getCurrentInstance()!
  let edit: T | undefined
  const mounted = shallowRef(false)
  onBeforeMount(() => {
    const root = instance.vnode.el
    if (root?.nodeType === 1) edit = read(root as Element)
  })
  onMounted(() => {
    if (edit !== undefined) adopt(edit)
    // A rerender also restores controlled values when the parent rejects the edit.
    mounted.value = true
  })
  return () => (mounted.value ? undefined : edit)
}

import { useStore, onMount } from '@builder.io/mitosis'
import { useUploads } from './uploads'
export default function Uploads() {
  const service = useUploads()
  const files = useFileSelection({
    upload: async (context) => {
      await service.upload(context)
    },
  })
  const state = useStore({
    count: 0,
    status: 'none',
    async load() {
      try {
        await service.select(files)
      } catch {
        state.status = 'selection failed'
      }
    },
  })
  onMount(() => {
    state.count = files.state.items.length
    files.subscribe((snapshot) => {
      state.count = snapshot.items.length
      state.status = snapshot.items[0]?.status ?? 'none'
    })
  })
  return (
    <MColumn gap="md">
      <MFilePicker label="Attachments" selection={files} />
      <MText>{`Count ${state.count}`}</MText>
      <MText>{`Status ${state.status}`}</MText>
      <MButton text="Load fixture" onClick={() => state.load()} />
      <MButton text="Clear all" onClick={() => files.clear()} />
    </MColumn>
  )
}

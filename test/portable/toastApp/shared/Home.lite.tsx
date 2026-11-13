import { useStore } from '@builder.io/mitosis'
export default function Home() {
  const toast = useToast({ scope: 'app' })
  const navigation = useMavisNavigation()
  const state = useStore({
    save() {
      toast.show({ message: 'Saved across routes', duration: 0 })
      const removed = toast.show({ message: 'Remove this queued item', duration: 0 })
      toast.show({ message: 'Next queued item', duration: 0 })
      toast.dismiss(removed)
      navigation.push('/details')
    },
  })
  return (
    <MScreen>
      <MText>Workspace</MText>
      <MButton text="Save and open" onClick={() => state.save()} />
    </MScreen>
  )
}

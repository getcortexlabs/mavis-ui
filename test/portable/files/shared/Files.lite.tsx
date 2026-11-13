import { useStore } from '@builder.io/mitosis'

export default function Files() {
  const state = useStore({
    nodes: [
      {
        key: 'docs',
        label: 'Documents',
        children: [
          { key: 'plan', label: 'Plan.md' },
          { key: 'notes', label: 'Notes.md' },
        ],
      },
      { key: 'media', label: 'Media', hasChildren: true },
      { key: 'readme', label: 'Readme.md' },
      { key: 'trash', label: 'Trash', disabled: true },
    ] as TreeNode[],
    none: [] as TreeNode[],
    selected: undefined as string | undefined,
    open: [] as string[],
    loading: [] as string[],
    asked: '',
    load(node: TreeNode) {
      state.loading = [node.key]
      state.asked = node.label
    },
    finish() {
      state.nodes.splice(1, 1, {
        key: 'media',
        label: 'Media',
        children: [{ key: 'cover', label: 'Cover.png' }],
      })
      state.loading = []
    },
  })

  return (
    <MColumn id="page" gap="md">
      <MTreeView
        id="files"
        label="Files"
        nodes={state.nodes}
        value={state.selected}
        onChange={(value) => (state.selected = value)}
        expanded={state.open}
        onExpandedChange={(value) => (state.open = value)}
        loadingKeys={state.loading}
        onLoad={(node) => state.load(node)}
      />
      <MText>{`Selected: ${state.selected ?? 'nothing'}. Open: ${state.open.join(', ')}.`}</MText>
      <MText>{`Asked for ${state.asked}.`}</MText>
      <MButton text="Finish loading" variant="secondary" onClick={() => state.finish()} />
      <MTreeView label="Archive" nodes={state.none} emptyLabel="Nothing archived" disabled />
    </MColumn>
  )
}

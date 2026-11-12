import { useStore } from '@builder.io/mitosis'

export default function Library() {
  const state = useStore({
    nodes: [
      {
        id: 'guides',
        label: 'Guides',
        children: [
          { id: 'install', label: 'Install' },
          { id: 'theme', label: 'Themes' },
          { id: 'legacy', label: 'Legacy', disabled: true },
        ],
      },
      {
        id: 'api',
        label: 'Reference',
        selectable: false,
        children: [{ id: 'button', label: 'Button' }],
      },
      { id: 'notes', label: 'Release notes' },
    ] as TreeSelectNode[],
    topics: ['notes'] as string[],
    open: [] as string[],
    start: [] as string[],
    shown: [] as string[],
    get chosen(): string {
      return state.topics.length === 0 ? 'Topics: none' : `Topics: ${state.topics.join(', ')}`
    },
    get home(): string {
      return state.start.length === 0 ? 'Start: none' : `Start: ${state.start.join(', ')}`
    },
  })

  return (
    <MColumn gap="md">
      <MTreeSelect
        id="topics"
        label="Topics"
        nodes={state.nodes}
        value={state.topics}
        onChange={(value) => (state.topics = value)}
        expanded={state.open}
        onExpandedChange={(value) => (state.open = value)}
        multiple
        placeholder="Choose topics"
        clearLabel="Clear topics"
      />
      <MText id="chosen">{state.chosen}</MText>
      <MTreeSelect
        id="start"
        label="Start page"
        nodes={state.nodes}
        value={state.start}
        onChange={(value) => (state.start = value)}
        expanded={state.shown}
        onExpandedChange={(value) => (state.shown = value)}
        placeholder="Choose a page"
      />
      <MText id="home">{state.home}</MText>
    </MColumn>
  )
}

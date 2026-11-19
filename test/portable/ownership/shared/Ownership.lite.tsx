import { useStore } from '@builder.io/mitosis'
import {
  seedNames,
  seedBox,
  seedGroup,
  moduleValues,
  type OwnershipBox,
  type OwnershipGroup,
} from './values'

export default function Ownership() {
  const state = useStore({
    names: [...seedNames],
    first: { ...seedBox } as OwnershipBox,
    second: { ...seedBox } as OwnershipBox,
    group: { names: [...seedGroup.names] } as OwnershipGroup,
    previous: { names: [] } as OwnershipGroup,
    observed: moduleValues(),
    change() {
      state.second = { ...state.first }
      state.first.count++
      state.names.push('b')
      state.previous = { ...state.group, names: [...state.group.names] }
      state.group.names.push('b')
      state.observed = moduleValues()
    },
  })
  return (
    <MColumn>
      <MText>{`Names ${state.names.join(',')}`}</MText>
      <MText>{`Records ${state.first.count}/${state.second.count}`}</MText>
      <MText>{`Nested ${state.group.names.join(',')}/${state.previous.names.join(',')}`}</MText>
      <MText>{`Module ${state.observed}`}</MText>
      <MButton text="Edit copies" onClick={() => state.change()} />
    </MColumn>
  )
}

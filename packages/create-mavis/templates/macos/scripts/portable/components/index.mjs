// One module per component or family. A definition holds everything the compiler knows about a
// primitive, and each stage reads its part:
//
//   props          property name → kind: a shared kind (see kinds in model.mjs) or a reader
//                  function ({ value, attribute, ctx, ... }) => model property
//   required       properties the source must set
//   children       'elements' for containers, 'text' for text content; none otherwise
//   control        an interactive control, which a card with onClick cannot contain
//   reveals        an animated Show may sit directly inside
//   animatesList   an animated For may sit directly inside
//   types          supporting ambient types, and records the record types among them
//   declaration    the ambient declaration that type-checks the sources
//   check          source rules once the properties are read; checkChildren after the children
//   swift          the SwiftUI view for a node; swiftRuntime the Swift helpers it calls, and
//                  uses the helpers it shares with other components (see flex.mjs)
//   focus          whether a node needs its view's focus state
//   vue            what differs from passing properties through: rename, webOnly, attribute,
//                  webAttributes, script (imports and setup lines) and runtime (helper source)
//
// Adding a component is adding a module and listing it here.
import { MColumn, MRow } from './stack.mjs'
import { MGrid } from './grid.mjs'
import { MCard } from './card.mjs'
import { MText } from './text.mjs'
import { MButton } from './button.mjs'
import { MInput, MCheckbox, MSelect } from './fields.mjs'

/** In the order declarations and runtime helpers are written. */
export const components = {
  MColumn,
  MRow,
  MGrid,
  MCard,
  MText,
  MButton,
  MInput,
  MCheckbox,
  MSelect,
}

const named = (flag) =>
  Object.keys(components)
    .filter((name) => components[name][flag])
    .join(' or ')

/** For messages: the components an animated Show or For can sit in. */
export const revealing = named('reveals')
export const listing = named('animatesList')

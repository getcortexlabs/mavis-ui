// One module per component or family. A definition holds everything the compiler knows about a
// primitive, and each stage reads its part:
//
//   props          property name → kind: a shared kind (see kinds in model.mjs) or a reader
//                  function ({ value, attribute, ctx, ... }) => model property
//   required       properties the source must set
//   children       'elements' for containers, 'text' for text content; none otherwise
//   slots          named content besides the children, such as MScreen's overlay: a TSX
//                  slotOverlay property, a <template #overlay> in a Vue file; scoped, by slot,
//                  what a slot hands its content, (props, { record, T }) => [{ name, type }]
//   screen         the whole view of a component: the root of it, never inside anything, and
//                  its component is never shown inside another one
//   inline         only inside the text of MText (MSpan): never a view of its own
//   control        an interactive control, which a card with onClick cannot contain
//   failing        the handlers that may call a function that throws: the component shows it
//   reveals        an animated Show may sit directly inside
//   animatesList   an animated For may sit directly inside
//   types          supporting ambient types, and records the record types among them
//   declaration    the ambient declaration that type-checks the sources
//   check          source rules once the properties are read; checkChildren after the children
//   swift          the SwiftUI view for a node; swiftRuntime the Swift helpers it calls, and
//                  uses the helpers it shares with other components (see flex.mjs)
//   focus          whether a node needs its view's focus state
//   vue            what differs from passing properties through: rename, webOnly, attribute,
//                  webAttributes, script (imports and setup lines) and runtime (helper source);
//                  and for reading a Vue file, source: the properties it has no spelling for
//                  (hidden), the attribute an event needs beside it (flags), the name it
//                  needs then (names) and the property its content is (slot)
//
// Adding a component is adding a module and listing it here.
import { MScreen } from './screen.mjs'
import { MColumn, MRow, MStack } from './stack.mjs'
import { MGrid } from './grid.mjs'
import { MCard } from './card.mjs'
import { MSpan, MText } from './text.mjs'
import { MBox } from './box.mjs'
import { MSeparator } from './separator.mjs'
import { MButton } from './button.mjs'
import { MInput, MCheckbox, MSelect } from './fields.mjs'
import { MThemeProvider } from './theme.mjs'
import { MPlatform } from './platform.mjs'
import { MMasonry } from './masonry.mjs'
import { MResizablePanels } from './panels.mjs'
import { MVirtualList } from './virtual-list.mjs'
import { MCollapsibleHeader, MRefreshControl } from './scroll-frame.mjs'
import { MIcon } from './icon.mjs'
import { MAvatar, MImage } from './image.mjs'

/** In the order declarations and runtime helpers are written. */
export const components = {
  MScreen,
  MColumn,
  MRow,
  MStack,
  MGrid,
  MBox,
  MCard,
  MText,
  MSpan,
  MSeparator,
  MThemeProvider,
  MPlatform,
  MButton,
  MInput,
  MCheckbox,
  MSelect,
  MMasonry,
  MResizablePanels,
  MVirtualList,
  MCollapsibleHeader,
  MRefreshControl,
  MIcon,
  MImage,
  MAvatar,
}

const named = (flag) => {
  const names = Object.keys(components).filter((name) => components[name][flag])
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}` : names[0]
}

/** Whether a component's view is a whole screen: the app opens it, nothing shows it inside. */
export const isScreen = (view) => view?.v === 'element' && Boolean(components[view.tag]?.screen)

/** For messages: the components an animated Show or For can sit in. */
export const revealing = named('reveals')
export const listing = named('animatesList')

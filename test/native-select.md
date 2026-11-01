# Native Select checks

Build the catalog normally for the demo and Profile. `ns run ios --env.selectCheck` or `ns run android --env.selectCheck` starts the shared `/checks/select` fixture instead; omit the flag for the final build. Use a dedicated simulator/emulator and restore system text/motion settings afterward.

- In Select, open from label/field. Start empty; select via label or mark. One change, one close. Reopen: selected mark agrees with field. Repeating it only closes. Disabled option and disabled field do nothing.
- Close by header button, backdrop, swipe and Android system back. Value and change count stay unchanged; back leaves the owning page in place. Clear externally: placeholder returns without another event.
- Review Mavis/Midnight, long labels/help, narrow width and largest system text. The close action remains reachable and the list scrolls independently, clearing safe areas. Dragging from a choice scrolls without selecting. Rotate with the list open and check the close action/content.
- With a hardware keyboard, focus the field and activate; traverse choices and cancel. Record which platform/settings were actually exercised. Do not claim Web arrow navigation on NativeScript.
- In Profile, edit Input, open Select with the software keyboard visible, choose an interest, Save, change and Discard. Saved text/boolean/choice values return together. Cancel must preserve the in-progress editor value.
- In the fixture, choose numeric `1` then string `'1'`; inspect type/count. The rejected field requests a value but keeps Alpha. Remove/disable/reorder choices and clear/set an absent value externally: no automatic selection or update. Empty/all-disabled lists remain cancellable.
- Toggle fifty options. Reach Option 50 by scrolling, select, reopen and locate its selected mark. Large text and rotation must retain a reachable close action. This is a local unvirtualized list, not a performance guarantee.
- Leave the page/unmount with a list open; return without a leftover layer, motion or back handler. Existing shared contract/browser tests additionally exercise live option updates while the modal is open.

The Web listbox follows the [WAI-ARIA listbox keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), keeping keyboard focus separate from committed selection. Native input surfaces use the existing Radio/Sheet adapters. A full assistive-technology audit and physical-device coverage remain separate work.

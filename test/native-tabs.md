# Tabs native review

Issue: [#89](https://github.com/getcortexlabs/mavis-ui/issues/89).

Use dedicated devices. Build packages first, then run `ns build ios --env.production --env.tabsCheck` or `ns build android --env.production --env.tabsCheck` from `examples/catalog`. The flag opens `/checks/tabs`; normal builds open the catalog.

1. Switch from **Number zero** to **String zero**. The panel and value distinguish the number from the string. Repeated activation and **Unavailable** must not increment Changes. Drag the strip horizontally; dragging must leave the selection unchanged.
2. **Select last externally** reveals the last tab and moves the indicator. **Toggle last item** removes its panel without changing Value. Reinserting it restores the panel. Clear selection and an empty list leave no panel or indicator.
3. Reset, enable **Reject**, then activate another tab. The request increments Changes, while the selected panel and indicator stay at the parent's value. Disable the group and check that taps no longer request selection. An external update still works.
4. Change the draft, switch tabs and return. Its value survives because the fixture stores it outside the panel. The panel itself unmounts on each selection change.
5. Select several tabs in quick succession, resize or rotate, and enlarge system text. The strip scrolls, labels stay on one line and the indicator follows the selected button. Restore device settings afterward.
6. Navigate away and return, then send the app Home and resume. Selection and scrolling remain usable. Toggle the host off/on to exercise unmount cleanup separately from retained native pages.
7. On Android, enter keyboard navigation and use arrows/Home/End to focus enabled tabs; Enter/Space activate separately. Do not make tab buttons focusable in touch mode: that would consume the first tap just to move focus.
8. Rebuild without `--env.tabsCheck`. Open Tabs in the catalog and exercise its panels in Mavis and Midnight. In Showcase → Library, switch between Explore and Saved, save/remove a reading and check that parent-owned filters survive panel replacement.

Local review uses iOS 26.2 and Android API 36, with normal and enlarged system text. Browser tests separately cover keyboard focus, RTL direction, reduced motion, geometry after resizing, controlled selection, panel lifetime and Library state. Native tabs expose labelled buttons with selected state; this review does not claim a physical-device, full VoiceOver/TalkBack, native RTL or iOS hardware-keyboard audit. Tabs does not implement routing or swipe-to-change panels.

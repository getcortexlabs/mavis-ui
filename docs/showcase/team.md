---
title: Team
description: A shared team screen with ListItem, Separator, Avatar, Badge, Tabs and Sheet.
---

# Team

Four fictional people, different disciplines and a shared identity. The screen pairs ListItem with Avatar and Badge; Separator organizes contacts and studio figures. The interactive screen uses Portuguese copy.

<a href="/playground/#/showcase/team" target="_blank" rel="noopener">Open the interactive example ↗</a>

Tabs filters everyone or available people. Activating a row opens details in Sheet. Adding or removing a favorite updates the row and count; changing tabs or closing details preserves that state. Leaving the screen resets the demonstration. There are no accounts, real contacts, messages or network requests.

The parent owns state. ListItem supplies composition and activation; the app chooses filters, the open member and favorites. Interactive rows receive an accessible name that includes role, availability and favorite status. Their slots are visual, with no nested controls.

## Source

<<< @/../examples/catalog/shared/pages/Team.vue

References: [ListItem](../components/list-item), [Separator](../components/separator), [Avatar](../components/avatar), [Badge](../components/badge), [Tabs](../components/tabs) and [Sheet](../components/sheet).

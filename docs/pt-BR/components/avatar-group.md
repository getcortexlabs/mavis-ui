---
title: AvatarGroup
---

# AvatarGroup

Prévia para Vue Web e NativeScript em iOS e Android.

<ComponentPreview component="avatar-group" :height="660" />

```vue
<MAvatarGroup :members="contributors" :maxVisible="3" size="lg" />
```

Passe as pessoas em ordem de exibição, cada uma com `id` de texto único, `name` e uma imagem `src` opcional. Os primeiros `maxVisible` retratos aparecem sobrepostos, seguidos pela contagem das pessoas adicionais. O padrão é quatro retratos. Cada retrato usa a imagem ou as iniciais do Avatar. Os tamanhos são `sm`, `md`, `lg` e `xl`.

<<< @/../examples/catalog/shared/demos/AvatarGroupDemo.vue

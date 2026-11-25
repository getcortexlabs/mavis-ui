---
title: TagInput
---

# TagInput

Prévia para Vue Web e NativeScript em iOS e Android.

<ComponentPreview component="tag-input" :height="660" />

```vue
<MTagInput v-model="tags" label="Tags da foto" addLabel="Adicionar tag" removeLabel="Remover" :maxTags="8" />
```

Enter ou vírgula confirma uma tag. Cole uma lista separada por vírgulas ou quebras de linha para adicionar várias. O campo remove espaços nas pontas e ignora diferenças de caixa ao verificar duplicatas. Tags acima de `maxTags` ficam no editor. Cada chip tem uma ação de remoção. Na Web, Backspace no campo vazio remove a última tag. Traduza as ações com `addLabel` e `removeLabel`.

<<< @/../examples/catalog/shared/demos/TagInputDemo.vue

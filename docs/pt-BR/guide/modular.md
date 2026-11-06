---
title: Instalação modular
description: Serviços por aplicação, componentes locais e ícones Web seletivos.
---

# Instalação modular

**Incluído na RC.11.1.** `createMavisServices` instala os serviços de tema/aparência e Toast por aplicação, sem registrar componentes globais. Importe localmente os componentes usados em cada tela Vue.

```ts
import { createApp } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import '@getcortexlabs/mavis-web/style.css'
import App from './App.vue'

createApp(App).use(createMavisServices()).mount('#app')
```

```vue
<script setup lang="ts">
import { MButton, MColumn, MText } from '@getcortexlabs/mavis-web'
</script>
<template>
  <MColumn gap="md"><MText>Um componente local</MText><MButton>Continuar</MButton></MColumn>
</template>
```

No NativeScript, use `@getcortexlabs/mavis/vue/services` para os serviços e importe componentes de `@getcortexlabs/mavis/vue`. As opções claimSystemBack, aparência, temas e Toast mantêm seus contratos. Cada aplicação/requisição possui seu contexto e o libera ao desmontar. Use MScreen quando as camadas nativas precisarem de um host.

O `createMavis()` existente continua registrando o catálogo completo. `createMavis({ components: false })` desativa o registro; `createMavis({ components: { MButton, MText } })` registra apenas esse mapa. Para permitir ao bundler remover o registro completo, importe createMavisServices da entrada services. Componentes individuais ainda podem incluir suas dependências, como ícones ou Jolt. O Jolt continua sendo um peer obrigatório.

## Ícones Web seletivos

Passe um mapa de componentes SVG Vue pelas chaves dos ícones Mavis. Importe apenas os ícones necessários; Mavis não exige outro pacote de ícones.

```ts
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import SearchIcon from './icons/SearchIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'
import '@getcortexlabs/mavis-web/base.css'

const services = createMavisServices({
  icons: { search: SearchIcon, x: CloseIcon },
  iconFallback: 'none',
})
```

MIcon e os adornos de Button usam o mesmo mapa por aplicação. Os SVGs recebem width/height e atributos de acessibilidade decorativos; MIcon mantém o rótulo no contêiner. Prefira currentColor nos SVGs. Entradas ausentes usam a fonte existente por padrão; `iconFallback: 'none'` não desenha um glifo para elas. Inclua ícones internos dos controles, como `x` do Sheet, ou preserve o fallback de fonte.

`style.css` inclui os estilos existentes e a definição da fonte Lucide. `base.css` contém os mesmos estilos dos componentes, sem URL de fonte. Adicione `icons.css` para carregar a fonte separadamente. Usar base.css com o mapa SVG completo e sem fallback evita incluir/baixar a fonte inteira. O JavaScript do fallback ainda pode permanecer no bundle; fornecer um mapa não garante eliminar sua tabela. O NativeScript mantém a fonte embutida; seleção de SVGs é exclusiva da Web.

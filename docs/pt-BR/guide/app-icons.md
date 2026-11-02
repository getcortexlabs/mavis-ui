---
title: Ícones do aplicativo
description: "Ícones do aplicativo: NativeScript, iOS, Android."
---

# Ícones do aplicativo

A integração opcional `@getcortexlabs/mavis/app-icons` troca o ícone do launcher entre alternativas **incluídas no binário**. Selecionar uma alternativa não exige outro build; adicionar um novo arquivo de ícone exige publicar uma atualização.

```ts
import { createAppIcons } from '@getcortexlabs/mavis/app-icons'
const icons = createAppIcons({
  primary: 'mavis',
  icons: [
    { id: 'mavis', label: 'Mavis', iosName: null, androidAlias: 'com.example.app.MavisPrimary' },
    { id: 'midnight', label: 'Midnight', iosName: 'Midnight', androidAlias: 'com.example.app.MavisMidnight' },
  ],
})
if (icons.supported()) await icons.select('midnight')
const current = icons.current()
await icons.reset()
```

`choices` é imutável. `select()` serializa pedidos e permite tentar novamente depois de erro. `current()` consulta o sistema, inclusive depois de relançar; não há uma preferência local concorrendo com o sistema. `AppIconError.code` distingue unsupported, configuration, unknown-icon e platform. Faça a seleção por uma ação explícita do usuário e trate a rejeição na interface.

No iOS, configure o ícone principal e alternativas no asset catalog e no build. `iosName` deve corresponder ao nome em `CFBundleAlternateIcons`; o principal usa null. O catálogo do Mavis demonstra `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES` e os conjuntos para iPhone/iPad. A chamada usa a API pública de UIApplication; mensagens e apresentação de confirmação pertencem ao sistema. [Referência Apple](https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:)).

No Android, declare um `activity-alias` por alternativa, apontando para a mesma Activity, com ícone próprio e intent-filter MAIN/LAUNCHER. Apenas o alias principal começa habilitado. Remova o filtro launcher da Activity original para não criar uma entrada duplicada. Os nomes fornecidos à API são completos. Android 13+ atualiza os aliases em uma operação; versões anteriores habilitam o novo antes de desabilitar os demais e tentam restaurar a configuração se houver falha. [PackageManager](https://developer.android.com/reference/android/content/pm/PackageManager#setComponentEnabledSettings(java.util.List)).

Launchers podem manter cache ou reposicionar atalhos. iOS/Android não prometem mudança visual instantânea. Não renomeie nem remova aliases/alternativas existentes sem planejar a migração de uma instalação atualizada. A matriz de aparelhos físicos e launchers continua na issue #23.

A Web apresenta o Showcase Identity como indisponível. Favicon/PWA são contratos diferentes; esta API não tenta simular um launcher nativo. Importar os componentes Mavis não altera o manifest nem os ícones do aplicativo.

## Atualizações e launchers

Preserve os nomes das classes de alias entre versões. Mantenha filtros VIEW/deep links na Activity real; somente a entrada MAIN/LAUNCHER pertence aos aliases dos ícones. A escolha muda a arte do launcher que já está no pacote, sem alterar a identidade do aplicativo. Valide reinício, atualização, atalhos e cada launcher suportado em aparelhos físicos. A issue #55 permanece aberta para essa matriz.

# Suporte dos componentes no Mac

**RC.14 experimental:** as issues de paridade [#338–#354](https://github.com/getcortexlabs/mavis-ui/issues/338) continuam abertas. Esta matriz descreve o subconjunto entregue; registro e compilação não equivalem a paridade completa.

O compilador experimental lê Vue SFC ou Mitosis TSX compartilhados e gera SwiftUI. Este inventário descreve o contrato de código da RC.14 e seus limites conhecidos; não certifica cada interação nem a paridade completa do renderer.

**Parcial** significa que o componente tem renderer para o contrato listado, com limites de expressão, propriedade ou plataforma. **Não suportado** significa que não há renderer Mac registrado. Nomes de propriedades aceitos, isoladamente, não comprovam suporte integral ao contrato.

Os mesmos dados estão em `macosCapabilities` e na entrada `macos-swiftui` de `targetCapabilities.targets`, em `@getcortexlabs/mavis-core`. A CLI os expõe com:

```sh
npx @getcortexlabs/create-mavis --capabilities --json
npx @getcortexlabs/create-mavis --check-portability
```

O inventário vem do registro do compilador, do mapeamento de props/eventos Vue e de limites revisados. Um teste de consistência mantém core, CLI e documentação alinhados. Novos achados ficam na issue da família vinculada; os limites da API compartilhada de movimento também aparecem em `targetCapabilities.developmentMotion.macos`.

<MacCapabilityMatrix locale="pt" />

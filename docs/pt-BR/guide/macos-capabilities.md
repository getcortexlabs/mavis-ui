# Suporte dos componentes no Mac

O compilador experimental lê Vue SFC ou Mitosis TSX compartilhados e gera SwiftUI. Este inventário descreve o fonte desta branch; não afirma que as adições estão no último pacote npm nem que toda interação passou pela validação de runtime.

**Parcial** significa que o componente tem renderer para o contrato listado, com limites de expressão, propriedade ou plataforma. **Não suportado** significa que não há renderer Mac registrado. Nomes de propriedades aceitos, isoladamente, não comprovam suporte integral ao contrato.

Os mesmos dados estão em `macosCapabilities` e na entrada `macos-swiftui` de `targetCapabilities.targets`, em `@getcortexlabs/mavis-core`. A CLI os expõe com:

```sh
npx @getcortexlabs/create-mavis --capabilities --json
npx @getcortexlabs/create-mavis --check-portability
```

O inventário vem do registro do compilador, do mapeamento de props/eventos Vue e de limites revisados. Um teste de consistência mantém core, CLI e documentação alinhados. Novos achados ficam na issue da família vinculada; os limites da API compartilhada de movimento também aparecem em `targetCapabilities.developmentMotion.macos`.

<MacCapabilityMatrix locale="pt" />

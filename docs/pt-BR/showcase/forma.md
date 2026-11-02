---
title: Forma
description: Um configurador compartilhado com quantidade, extras, imagens e movimento.
---

# Forma

Uma edição de arte configurada com NumberInput, MultiSelect e Image. A mesma tela Vue roda na Web e no NativeScript, com os temas Mavis e Midnight. A reserva é uma demonstração local, sem compra ou serviço remoto.

O estudo de cor usa um valor contínuo para fundo, raio e escala. O press multiplica a escala da aplicação: `1.1 × 0.96`, voltando a `1.1` ao soltar. A receita usa Jolt `0.1.0-rc.8`; nenhuma interpolação roda em um loop Vue.

O Accordion usa a altura intrínseca do Reveal. Testamos conteúdo dinâmico, reversão antes de terminar o fechamento e preservação do editor durante a reversão. Depois do fechamento completo, o editor desmonta; seu rascunho pertence à tela.

Disponível no código-fonte; ainda não faz parte da alpha.6 publicada.

[Experimentar Forma](https://mavis-ui.getcortexlabs.com/playground/#/showcase/forma)

<<< @/../examples/catalog/shared/forma-motion.ts

<<< @/../examples/catalog/shared/pages/Forma.vue

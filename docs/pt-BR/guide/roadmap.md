---
title: Roadmap e próximos passos
description: "Acompanhe o roadmap do Mavis UI: NativeScript-Vue primeiro, outros frameworks depois e possibilidades futuras com React Native, Flutter e integrações nativas."
---

# Roadmap

O Mavis está no início do desenvolvimento. Já existe uma API experimental no repositório, sem pacote publicado nem data de lançamento.

## Agora: validar a base

O repositório inclui layouts, texto, cards, botões, sliders, uma transição de revelação, dois temas e o catálogo interativo. As mesmas telas e o estado do catálogo também são usados no Vue Web. No nativo, o Jolt cuida do movimento e o vue-router-ns da navegação; na Web, usamos CSS e Vue Router. [Veja o compartilhamento](./web). [Experimente essa base](./foundation).

## Primeira entrega: NativeScript-Vue

A primeira implementação atende NativeScript-Vue, com foco em iOS e Android.

Antes de publicar um pacote, precisamos ampliar os testes em aparelhos e de acessibilidade, cobrir casos de layout e colher feedback sobre a API. Inputs, sheets e uma coleção maior de componentes virão depois dessa base.

## Depois: os demais frameworks do NativeScript

Vue é a primeira porta de entrada, não o limite da biblioteca. Queremos ampliar o suporte para os outros frameworks do ecossistema NativeScript.

A intenção é manter os nomes, as propriedades e as regras de composição, respeitando a sintaxe de cada framework. As definições de tema já ficam fora da integração Vue.

## Mais adiante: explorar outras plataformas

React Native, Flutter e integrações nativas diretas são possibilidades futuras. Nenhuma delas está em desenvolvimento no Mavis neste momento, e não há uma ordem de lançamento definida.

| Plataforma | Direção |
| --- | --- |
| NativeScript-Vue | Implementação experimental no repositório |
| Vue Web | Implementação experimental com telas compartilhadas |
| Demais frameworks do NativeScript | Expansão planejada |
| React Native | Possibilidade futura |
| Flutter | Possibilidade futura |
| Integrações nativas diretas | Possibilidade futura |

## Acompanhe o progresso

O [repositório no GitHub](https://github.com/getcortexlabs/mavis-ui) é o lugar para acompanhar a implementação. As instruções de instalação e a referência de API chegarão com o primeiro pacote utilizável.

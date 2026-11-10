import { useStore } from '@builder.io/mitosis'

export default function Words() {
  const state = useStore({
    input: '  Mavis UI  ',
    emoji: 'Hi 👋🏽',
    done: false,
    get trimmed(): string {
      return state.input.trim()
    },
    get summary(): string {
      return `${state.trimmed.length}/${state.emoji.length} ${state.trimmed.toUpperCase()} ${state.done}`
    },
    get checks(): string {
      return (
        (state.trimmed.includes('UI') ? 'has UI' : 'no UI') +
        ', ' +
        (state.trimmed.startsWith('Mav') && state.trimmed.endsWith('UI'))
      )
    },
  })
  return (
    <MColumn gap="sm">
      <MText>[{state.trimmed}]</MText>
      <MText>{state.summary}</MText>
      <MText>{state.checks}</MText>
      <MText>{'x' + 1 + true}</MText>
      <MColumn gap="xs">
        <MButton text="Unicode spaces" onClick={() => (state.input = '  Ünïcode﻿　')} />
        <MButton
          text="Append"
          onClick={() => {
            state.input += '!'
            state.done = !state.done
          }}
        />
        <MButton text="Lowercase" onClick={() => (state.input = state.input.toLowerCase())} />
        <MButton text="Blank" onClick={() => (state.input = '   ')} />
        <MButton text="Next line" onClick={() => (state.input = '\u0085Next\u0085')} />
      </MColumn>
    </MColumn>
  )
}

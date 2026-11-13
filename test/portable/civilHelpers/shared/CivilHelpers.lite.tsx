import { useStore } from '@builder.io/mitosis'
import { calendarSummary, leapSummary } from './calendar-tools'
export default function CivilHelpers() {
  const state = useStore({
    date: '2024-01-31',
    get summary(): string {
      return calendarSummary(state.date, 1)
    },
  })
  return (
    <MColumn gap="md">
      <MText>{state.summary}</MText>
      <MText>{leapSummary()}</MText>
      <MText>{calendarSummary('0001-01-01', -1)}</MText>
      <MText>{calendarSummary('9999-12-31', 1)}</MText>
      <MText>{calendarSummary('2024-02-01', 0.5)}</MText>
      <MButton
        text="Invalid date"
        onClick={() => {
          state.date = '2023-02-29'
        }}
      />
    </MColumn>
  )
}

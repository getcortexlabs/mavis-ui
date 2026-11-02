import type { ChoiceOption, CivilDate } from '@getcortexlabs/mavis-core'
export interface RegistrationDraft {
  name: string
  date: CivilDate | null
  dateValid: boolean
  place: string | null
  query: string
  selected: ChoiceOption | null
}

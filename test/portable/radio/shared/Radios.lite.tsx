import { useStore } from '@builder.io/mitosis'

export default function Radios() {
  const state = useStore({
    plan: undefined as ChoiceValue | undefined,
    billing: 'monthly' as ChoiceValue | undefined,
    frozen: false,
    plans: [
      { value: 'free', label: 'Free', helperText: 'One project' },
      { value: 'team', label: 'Team', helperText: 'Ten projects' },
      { value: 'enterprise', label: 'Enterprise', disabled: true },
    ] as ChoiceOption[],
    cycles: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ] as ChoiceOption[],
    regions: [
      { value: 'eu', label: 'Europe' },
      { value: 'us', label: 'United States' },
    ] as ChoiceOption[],
    // The source keeps the billing cycle while it is frozen.
    bill(next: ChoiceValue) {
      if (!state.frozen) state.billing = next
    },
  })

  return (
    <MColumn gap="md">
      <MRadioGroup
        id="plans"
        label="Plan"
        helperText="You can change it later"
        options={state.plans}
        value={state.plan}
        onChange={(value) => (state.plan = value)}
      />
      <MText id="plan-text">{`Chosen ${state.plan ?? 'nothing'}`}</MText>
      <MRadioGroup
        label="Billing"
        options={state.cycles}
        value={state.billing}
        onChange={(next) => state.bill(next)}
      />
      <MText>{`Billed ${state.billing ?? 'never'}`}</MText>
      <MSwitch
        label="Freeze billing"
        checked={state.frozen}
        onChange={(value) => (state.frozen = value)}
      />
      <MRadioGroup
        label="Region"
        options={state.regions}
        value="eu"
        onChange={(value) => (state.plan = value)}
        disabled
      />
    </MColumn>
  )
}

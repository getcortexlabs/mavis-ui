import { useScrollProbe } from './probe'
export default function Home() {
  const probe = useScrollProbe()
  return (
    <MScreen>
      <MColumn padding="lg" gap="md">
        <MText>{probe.report.value}</MText>
        <MButton text="Run navigation checks" onClick={() => probe.run()} />
      </MColumn>
    </MScreen>
  )
}

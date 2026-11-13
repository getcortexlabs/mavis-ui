import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMotionAnchorProbe } from './probe'
export default function Home() {
  const surface = createMotionSurface()
  const probe = useMotionAnchorProbe()
  return (
    <MColumn gap="md">
      <MBox motionSurface={surface}>
        <MText>Attachment lifecycle</MText>
      </MBox>
      <MText>{probe.report.value}</MText>
      <MButton text="Check attachments" onClick={() => probe.run()} />
    </MColumn>
  )
}

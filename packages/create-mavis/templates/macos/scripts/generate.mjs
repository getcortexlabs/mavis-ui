import { fileURLToPath } from 'node:url'
import { generateProject, PortableError } from '@getcortexlabs/mavis-compiler'

try {
  const result = await generateProject(fileURLToPath(new URL('..', import.meta.url)))
  console.log(
    `Generated ${result.targets.join(', ')} for ${result.components} shared component(s).`,
  )
} catch (error) {
  if (!(error instanceof PortableError)) throw error
  console.error(error.message)
  process.exitCode = 1
}

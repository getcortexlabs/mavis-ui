/** Experimental source compiler. Configured paths are project-relative. */
export class PortableError extends Error {
  diagnostics: { file?: string; line?: number; column?: number; message: string }[]
}
export const compilerName: string
export const joltSwift: Readonly<{ version: string; url: string }>
export function readShared(
  root: string,
  options?: { roots?: string[] },
): Promise<Map<string, string>>
export function readAssets(root: string, options?: { folder?: string }): Promise<string[]>
export function compileProject(
  files: Map<string, string>,
  options?: {
    theme?: string | object
    root?: string
    sourceRoot?: string
    shared?: string
    namespace?: string
    destinations?: unknown
    assets?: string[]
  },
): Promise<{
  model: unknown
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
  environment: string
}>
export function checkShared(
  files: Map<string, string>,
  theme?: unknown,
): Promise<
  {
    file: string
    ready: boolean
    problems: { line?: number; column?: number; message: string }[]
  }[]
>
export function generateProject(root: string): Promise<{ targets: string[]; components: number }>

export function macAppSettings(
  input?: {
    name?: string
    bundleId?: string
    minWidth?: number
    minHeight?: number
    icon?: string
  },
  name?: string,
): { name: string; bundleId: string; minWidth: number; minHeight: number; icon?: string }

export function startupPlan(model: unknown, startup?: unknown): unknown[]

export const compilerVersion: string

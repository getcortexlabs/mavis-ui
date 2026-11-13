// A Vue host receives authored SFCs as written, or generated SFCs with their TypeScript
// value/store modules. The generated route table replaces the compiler input table: keeping
// both would make native TypeScript check imports of .lite files that no longer exist.
export function hostedFixtureFiles(fixture, generated) {
  if (fixture.output.direct.length)
    return [...fixture.files].map(([path, text]) => [path.slice('shared/'.length), text])
  const route = fixture.output.model.navigation?.path
  return [
    ...generated,
    ...[...fixture.files].filter(([path]) => path.endsWith('.ts') && path !== route),
  ]
}

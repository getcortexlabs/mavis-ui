import { useStore } from '@builder.io/mitosis'

export default function Cover() {
  const state = useStore({
    crop: undefined as ImageCrop | undefined,
    loaded: 'nothing yet',
    exported: 'nothing yet',
  })

  return (
    <MColumn gap="md" width={320}>
      <MBox id="cover">
        <MColumn paddingX={77}>
          <MColumn height={122} />
          <MRow justify="between">
            <MColumn id="near" width={6} height={6} />
            <MColumn id="mid" width={6} height={6} />
          </MRow>
          <MColumn height={154} />
          <MRow justify="end">
            <MColumn id="far" width={6} height={6} />
          </MRow>
        </MColumn>
        <MImageCropper
          label="Cover"
          src="~/assets/cropper-scene.png"
          value={state.crop}
          onChange={(value) => (state.crop = value)}
          animated={false}
          onLoad={(picture) => (state.loaded = `${picture.width} by ${picture.height}`)}
          onExport={(picture) =>
            (state.exported = `${picture.width} by ${picture.height} ${picture.mimeType}`)
          }
        />
      </MBox>
      <MText>Loaded {state.loaded}</MText>
      <MText>Turned {state.crop?.rotation ?? 0}</MText>
      <MText>Exported {state.exported}</MText>
    </MColumn>
  )
}

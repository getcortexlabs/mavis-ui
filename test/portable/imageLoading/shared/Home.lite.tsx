import { useStore } from '@builder.io/mitosis'
export default function Home() {
  const state = useStore({ eager: 0, lazy: 0, errors: 0, source: '~/assets/gallery-blue.png' })
  return (
    <MScreen id="image-scroll" scroll>
      <MColumn gap="sm" padding="md">
        <MButton
          text="Switch hidden"
          onClick={() =>
            (state.source =
              state.source === '~/assets/gallery-blue.png'
                ? '~/assets/gallery-green.png'
                : '~/assets/gallery-blue.png')
          }
        />
        <MText>
          {'Eager ' + state.eager + ' / Lazy ' + state.lazy + ' / Errors ' + state.errors}
        </MText>
        <MColumn height={8000} />
        <MImage
          src="~/assets/gallery-blue.png"
          alt="Eager"
          loading="eager"
          width={180}
          height={120}
          onLoad={() => state.eager++}
          onError={() => state.errors++}
        />
        <MImage
          src={state.source}
          alt="Lazy"
          loading="lazy"
          width={180}
          height={120}
          onLoad={() => state.lazy++}
          onError={() => state.errors++}
        />
      </MColumn>
    </MScreen>
  )
}

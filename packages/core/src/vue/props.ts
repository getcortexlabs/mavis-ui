import type { PropType } from '@vue/runtime-core'
import type { Spacing, Radius } from '../theme/types.js'

export const spacingProp = { type: [String, Number] as PropType<Spacing>, default: undefined }

export const boxProps = {
  padding: spacingProp,
  paddingX: spacingProp,
  paddingY: spacingProp,
  radius: { type: [String, Number] as PropType<Radius | number>, default: undefined },
  grow: { type: Number, default: 0 },
  shrink: { type: Number, default: undefined },
  width: [Number, String],
  height: [Number, String],
  backgroundColor: String,
}

export interface BoxProps {
  padding?: Spacing
  paddingX?: Spacing
  paddingY?: Spacing
  radius?: Radius | number
  grow: number
  shrink?: number
  width?: number | string
  height?: number | string
  backgroundColor?: string
}

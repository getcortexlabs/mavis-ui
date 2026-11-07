<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const animated = ref(true)

import { mountains, coast } from '../atlas/photos'
import type { ImageCrop, CropExport } from '@getcortexlabs/mavis-core'
const crop = ref<ImageCrop | null>(null),
  alternate = ref(false),
  result = ref<CropExport>(),
  error = ref('')
function exported(image: CropExport) {
  void result.value?.dispose()
  result.value = image
}
function changeImage() {
  crop.value = null
  alternate.value = !alternate.value
  error.value = ''
}
onBeforeUnmount(() => {
  void result.value?.dispose()
})
</script>
<template>
  <MColumn gap="lg">
    <MText text="THE FIELD GUIDE / 04" variant="overline" tone="primary" />
    <MText
      :text="t('Find the frame that feels right.', 'Encontre o enquadramento certo.')"
      variant="title"
    />
    <MStack direction="column" :responsive="{ at: 900, direction: 'row' }" gap="lg" align="start">
      <MBox :grow="1"
        ><MImageCropper
          id="studio-cropper"
          v-model="crop"
          :src="alternate ? coast : mountains"
          :animated="animated"
          :label="t('The cover photograph', 'A fotografia de capa')"
          :output="{ mimeType: 'image/png', quality: 1, width: 480 }"
          :zoomLabel="t('Zoom', 'Zoom')"
          :rotateLabel="t('Rotate clockwise', 'Girar à direita')"
          :resetLabel="t('Reset', 'Redefinir')"
          :exportLabel="t('Export image', 'Exportar imagem')"
          :moveLabel="t('Move image', 'Mover imagem')"
          :leftLabel="t('Move left', 'Mover à esquerda')"
          :rightLabel="t('Move right', 'Mover à direita')"
          :upLabel="t('Move up', 'Mover acima')"
          :downLabel="t('Move down', 'Mover abaixo')"
          :loadingLabel="t('Loading image', 'Carregando imagem')"
          @export="exported"
          @error="error = $event.message"
      /></MBox>
      <MCard padding="md" :width="220"
        ><MColumn gap="md"
          ><MText :text="t('Ready for the cover', 'Pronta para a capa')" variant="heading" /><MImage
            v-if="result"
            :src="result.uri"
            :height="180"
            :alt="t('Exported crop', 'Recorte exportado')" /><MText
            id="crop-result"
            :text="
              result
                ? `${result.width} × ${result.height}`
                : t('Your export appears here.', 'Seu recorte aparece aqui.')
            "
            variant="caption" /><MText v-if="error" :text="error" /></MColumn
      ></MCard>
    </MStack>
    <MButton
      :text="t('Change photograph', 'Trocar fotografia')"
      variant="secondary"
      @click="changeImage"
    />
    <MText
      id="crop-value"
      :text="crop ? `${Math.round(crop.x)},${Math.round(crop.y)},${crop.rotation}` : 'original'"
      variant="caption"
      tone="muted"
    />

    <MSwitch v-model="animated" :label="t('Animate changes', 'Animar mudanças')" />
  </MColumn>
</template>

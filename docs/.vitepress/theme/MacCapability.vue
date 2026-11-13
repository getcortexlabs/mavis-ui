<script setup>
import { computed } from 'vue'
import { macosCapabilities, targetCapabilities } from '@getcortexlabs/mavis-core'
const props = defineProps({
  name: { type: String, required: true },
  locale: { type: String, default: 'en' },
})
const entry = computed(() => macosCapabilities.components[props.name])
const pt = computed(() => props.locale === 'pt')
const language = computed(() => (pt.value ? 'pt' : 'en'))
</script>

<template>
  <details v-if="entry" class="mac-capability">
    <summary>
      Mac · {{ name }} ·
      {{
        entry.status === 'partial'
          ? pt
            ? 'parcial / experimental'
            : 'partial / experimental'
          : pt
            ? 'não suportado'
            : 'unsupported'
      }}
    </summary>
    <p>
      {{
        pt
          ? 'Inventário do fonte em desenvolvimento. Registro não comprova paridade integral nem validação de runtime.'
          : 'Inventory of development source. Registration does not establish full parity or runtime validation.'
      }}
      <a :href="`${pt ? '/pt-BR' : ''}/guide/macos-capabilities`">{{
        pt ? 'Matriz e limites compartilhados' : 'Matrix and shared limits'
      }}</a>
      ·
      <a :href="`https://github.com/getcortexlabs/mavis-ui/issues/${entry.issue}`"
        >#{{ entry.issue }}</a
      >
    </p>
    <p>
      {{
        pt
          ? 'Próxima release: em desenvolvimento. Baseline publicada dos pacotes:'
          : 'Next release: in development. Published package baseline:'
      }}
      <code>{{ targetCapabilities.publishedBaseline }}</code
      >.
    </p>
    <ul v-if="entry.limits.length">
      <li v-for="limit in entry.limits" :key="limit.en">{{ limit[language] }}</li>
    </ul>
    <p>
      <strong
        >{{
          pt ? 'Props Vue aceitas pelo compilador' : 'Vue props accepted by the compiler'
        }}:</strong
      >
      <code>{{ entry.props.join(', ') || '—' }}</code>
    </p>
    <p v-if="entry.events.length">
      <strong>{{ pt ? 'Eventos' : 'Events' }}:</strong>
      <code>{{ entry.events.map((event) => `@${event}`).join(', ') }}</code>
    </p>
    <p v-if="entry.slots.length">
      <strong>Slots:</strong> <code>{{ entry.slots.join(', ') }}</code>
    </p>
    <p v-if="entry.ignoredProps.length">
      <strong>{{ pt ? 'Aceitas sem efeito no Mac' : 'Accepted without a Mac effect' }}:</strong>
      <code>{{ entry.ignoredProps.join(', ') }}</code>
    </p>
    <p v-if="entry.rejectedProps.length">
      <strong
        >{{
          pt ? 'Props do contrato ainda recusadas no Mac' : 'Contract props still rejected on Mac'
        }}:</strong
      >
      <code>{{ entry.rejectedProps.join(', ') }}</code>
    </p>
    <p>
      {{
        pt
          ? 'Os valores e expressões continuam sujeitos ao subconjunto compartilhado. Confira seu arquivo com'
          : 'Values and expressions remain subject to the shared subset. Check your file with'
      }}
      <code>create-mavis --check-portability</code>.
    </p>
  </details>
</template>

<style scoped>
.mac-capability {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
summary {
  cursor: pointer;
  font-weight: 600;
}
code {
  overflow-wrap: anywhere;
}
</style>

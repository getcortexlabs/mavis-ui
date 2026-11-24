<script setup>
import { computed } from 'vue'
import { describeContract } from '@getcortexlabs/mavis-core'
const props = defineProps({
  name: { type: String, required: true },
  locale: { type: String, default: 'en' },
})
const contract = computed(() => describeContract(props.name))
function value(field) {
  if (!('default' in field) || field.default?.unset) return '—'
  return JSON.stringify(field.default)
}
</script>

<template>
  <details>
    <summary>{{ name }}</summary>
    <table>
      <thead>
        <tr>
          <th>Prop</th>
          <th>{{ locale === 'pt' ? 'Tipo / valores' : 'Kind / values' }}</th>
          <th>{{ locale === 'pt' ? 'Padrão' : 'Default' }}</th>
          <th>{{ locale === 'pt' ? 'Restrições' : 'Constraints' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(field, key) in contract.props" :key="key">
          <td>
            <code>{{ key }}</code>
          </td>
          <td>
            <code>{{
              field.values?.join(' | ') ??
              (Array.isArray(field.kind) ? field.kind.join(' | ') : field.kind)
            }}</code>
          </td>
          <td>
            <code>{{ value(field) }}</code>
          </td>
          <td>
            {{
              [
                field.required && 'required',
                field.token && `token: ${field.token}`,
                field.units && `units: ${field.units}`,
                field.runtimeOnly && 'runtime only',
              ]
                .filter(Boolean)
                .join(', ') || '—'
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </details>
</template>

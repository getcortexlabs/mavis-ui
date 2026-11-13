<script setup>
import { targetCapabilities } from '@getcortexlabs/mavis-core'
defineProps({ locale: { type: String, default: 'en' } })
const targets = targetCapabilities.targets
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>{{ locale === 'pt' ? 'Integração' : 'Integration' }}</th>
        <th>Client</th>
        <th>HTML / hydration / SSG</th>
        <th>{{ locale === 'pt' ? 'Validação' : 'Validation' }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="target in targets" :key="target.id">
        <td>
          <code>{{ target.id }}</code>
        </td>
        <td>{{ target.rendering.client }}</td>
        <td>
          {{ target.rendering.serverHTML }} / {{ target.rendering.hydration }} /
          {{ target.rendering.ssg }}
        </td>
        <td v-if="target.ssr">
          Nuxt {{ target.ssr.hostVersion }}, Vue {{ target.ssr.vueVersion }}, Node
          {{ target.ssr.nodeVersion }} · {{ target.ssr.preset }} · {{ target.ssr.availability }}
        </td>
        <td v-else-if="target.id === 'macos-swiftui'">
          {{
            locale === 'pt'
              ? `macOS ${target.minimumOS}+ · compilador experimental · fonte da próxima release, em desenvolvimento`
              : `macOS ${target.minimumOS}+ · experimental compiler · development source for the next release`
          }}
        </td>
        <td v-else>iOS / Android</td>
      </tr>
    </tbody>
  </table>
</template>

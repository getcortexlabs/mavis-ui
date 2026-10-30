import { reactive } from 'vue'

export const workload = reactive({
  active: false,
  controls: false,
  count: 4,
  depth: 0,
  revision: 0,
  busy: false,
  value: 0,
  revealed: false,
})

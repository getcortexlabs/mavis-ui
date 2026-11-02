<script setup lang="ts">
import { ref } from 'vue'
import FormDemo from '../demos/FormDemo.vue'
import StepsDemo from '../demos/StepsDemo.vue'
import PaginationDemo from '../demos/PaginationDemo.vue'

const attempts = ref(0)
</script>
<template>
  <m-screen scroll
    ><m-column gap="xl" padding="lg"
      ><FormDemo lang="en" /><StepsDemo lang="en" /><PaginationDemo lang="en" /><m-pagination
        :modelValue="2"
        :total="90"
        :pageSize="10"
        label="Parent controlled pages"
        @update:modelValue="attempts++"
      /><m-text id="pagination-attempts">{{ attempts }}</m-text></m-column
    ></m-screen
  >
</template>

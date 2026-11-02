<script setup lang="ts">
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-web'
useMavisTheme().setAppearance('dark')
useToast({ scope: 'app' }).show({ message: 'This failed request must not reach another request.' })
throw createError({ statusCode: 503, statusMessage: 'Expected fixture failure' })
</script>

<template><div /></template>

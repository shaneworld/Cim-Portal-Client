<script setup lang="ts">
import Toaster from '@/lib/ui/Toaster.vue'
import SupportBar from '@/lib/ui/SupportBar.vue'
</script>
<template>
  <div class="flex min-h-dvh flex-col">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in"><component :is="Component" /></Transition>
    </RouterView>
    <SupportBar />
  </div>
  <Toaster />
</template>
<style>
.page-enter-active,.page-leave-active{transition:opacity .18s ease}
.page-enter-from,.page-leave-to{opacity:0}
</style>

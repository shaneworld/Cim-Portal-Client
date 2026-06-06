<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
</script>
<template>
  <div class="grid min-h-screen place-items-center p-6">
    <GlassCard class="max-w-md p-10 text-center animate-fade-up">
      <ShieldAlert class="mx-auto size-12 text-amber-500" />
      <h1 class="mt-3 text-xl font-semibold">账号无法访问门户</h1>
      <p class="mt-2 text-ink-2">您的账号已停用或未在系统中配置,请联系管理员。</p>
    </GlassCard>
  </div>
</template>

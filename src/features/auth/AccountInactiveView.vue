<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
</script>
<template>
  <div class="flex min-h-screen items-center justify-center p-4 sm:p-6">
    <GlassCard class="w-full max-w-md p-8 text-center animate-fade-up sm:p-10">
      <ShieldAlert class="mx-auto size-12 text-amber-500" />
      <h1 class="mt-3 text-xl font-semibold">账号无法访问门户</h1>
      <p class="mt-2 text-ink-2">您的账号已停用或未在系统中配置,请联系管理员。</p>
    </GlassCard>
  </div>
</template>

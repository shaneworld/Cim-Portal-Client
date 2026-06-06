<script setup lang="ts">
import { ShieldCheck, Users, FileText, Activity, Award } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'

const items = [
  { icon: ShieldCheck, label: 'SSO 安全登录' },
  { icon: Users, label: 'RBAC 角色权限' },
  { icon: FileText, label: '审计日志' },
  { icon: Activity, label: '99.98% 可用率' },
  { icon: Award, label: 'ISO 9001' },
]
</script>

<template>
  <GlassCard class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 p-3.5">
    <span v-for="it in items" :key="it.label" class="flex items-center gap-1.5 text-xs font-medium text-ink-2">
      <component :is="it.icon" class="size-3.5 text-[hsl(var(--primary))]" />{{ it.label }}</span>
  </GlassCard>
</template>

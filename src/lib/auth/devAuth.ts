import { request } from '@/lib/api/client'
import type { AuthProvider, DevIdentity } from './AuthProvider'

export const DEV_IDENTITIES: DevIdentity[] = [
  { employeeId: 'ADMIN1', nameZh: '亚当管理', nameEn: 'Adam', hint: 'IT · PORTAL_ADMIN' },
  { employeeId: 'OP1', nameZh: '欧阳操作', nameEn: 'Oliver', hint: 'FAB1-PROD · OPERATOR' },
  { employeeId: 'ENG1', nameZh: '伊森工程', nameEn: 'Ethan', hint: 'FAB1-PROD · PROCESS_ENGINEER' },
  { employeeId: 'QA1', nameZh: '乔安质量', nameEn: 'Joan', hint: 'QA · QA_ENGINEER' },
  { employeeId: 'OP2', nameZh: '欧阳二厂', nameEn: 'Oscar', hint: 'FAB2-PROD · OPERATOR' },
  { employeeId: 'LEAD1', nameZh: '李班长', nameEn: 'Leo', hint: 'FAB1-PROD · SHIFT_LEAD' },
  { employeeId: 'MNT1', nameZh: '孟技师', nameEn: 'Max', hint: 'MAINT · MAINTENANCE_TECH' },
  { employeeId: 'LOG1', nameZh: '卢物流', nameEn: 'Luke', hint: 'LOGISTICS · OPERATOR' },
  { employeeId: 'OFF1', nameZh: '周离职', nameEn: 'Olivia', hint: 'QA · (已停用)' },
]
export function createDevAuth(): AuthProvider {
  return { async login(employeeId?: string) {
    const r = await request<{ access_token: string }>('GET', `/dev/token?employeeId=${encodeURIComponent(employeeId ?? '')}`)
    return r.access_token
  } }
}

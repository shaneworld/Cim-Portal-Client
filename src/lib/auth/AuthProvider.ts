export interface AuthProvider { login(employeeId?: string): Promise<string> }
export interface DevIdentity { employeeId: string; nameZh: string; nameEn: string; hint: string }

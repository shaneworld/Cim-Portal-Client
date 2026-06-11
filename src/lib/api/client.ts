import type { ApiErrorBody, ApiFieldError } from './types'

export class ApiError extends Error {
  status: number; code: string; fieldErrors: ApiFieldError[]
  constructor(body: ApiErrorBody) { super(body.message); this.name = 'ApiError'; this.status = body.status; this.code = body.code; this.fieldErrors = body.fieldErrors ?? [] }
}
interface ClientConfig { baseUrl: string; getToken: () => string | null; getLocale: () => string; onUnauthorized: () => void }
let config: ClientConfig = { baseUrl: '', getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} }
export function configureClient(c: Partial<ClientConfig>) { config = { ...config, ...c } }

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Accept-Language': config.getLocale() }
  const token = config.getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(config.baseUrl + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  if (res.status === 401) config.onUnauthorized()
  if (!res.ok) {
    let parsed: ApiErrorBody
    try { parsed = (await res.json()) as ApiErrorBody } catch { parsed = { timestamp: '', status: res.status, error: res.statusText, code: 'INTERNAL_ERROR', message: res.statusText, path } }
    throw new ApiError(parsed)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** POST FormData (multipart/form-data) without setting Content-Type so the browser sets the boundary. */
export async function requestFormData<T>(method: string, path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = { 'Accept-Language': config.getLocale() }
  const token = config.getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(config.baseUrl + path, { method, headers, body: formData })
  if (res.status === 401) config.onUnauthorized()
  if (!res.ok) {
    let parsed: ApiErrorBody
    try { parsed = (await res.json()) as ApiErrorBody } catch { parsed = { timestamp: '', status: res.status, error: res.statusText, code: 'INTERNAL_ERROR', message: res.statusText, path } }
    throw new ApiError(parsed)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

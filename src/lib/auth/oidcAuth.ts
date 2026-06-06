import type { AuthProvider } from './AuthProvider'
/** Stub for uat/prod — wired in a later phase. */
export function createOidcAuth(): AuthProvider {
  return { async login() { throw new Error('OIDC 登录尚未在本期实现') } }
}

import { env } from '@/env'
import { createDevAuth } from './devAuth'
import { createOidcAuth } from './oidcAuth'
import type { AuthProvider } from './AuthProvider'
export type { AuthProvider, DevIdentity } from './AuthProvider'
export { DEV_IDENTITIES } from './devAuth'
export function createAuthProvider(): AuthProvider { return env.authMode === 'oidc' ? createOidcAuth() : createDevAuth() }

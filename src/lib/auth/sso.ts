import { UserManager } from 'oidc-client-ts'
import type { PortalConfig } from '@/lib/api/portal'

function manager(cfg: PortalConfig) {
  return new UserManager({
    authority: cfg.authority!,
    client_id: cfg.clientId!,
    redirect_uri: location.origin + '/auth/callback',
    response_type: 'code',
    scope: cfg.scopes,
  })
}

export async function startSso(cfg: PortalConfig) {
  await manager(cfg).signinRedirect()
}

export async function completeSso(cfg: PortalConfig): Promise<string> {
  const user = await manager(cfg).signinRedirectCallback()
  return user.access_token
}

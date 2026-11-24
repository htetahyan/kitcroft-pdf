/**
 * Shared LIVE-PREVIEW OAuth client (server-only — NEVER import from the client).
 *
 * The sandbox serves each live preview on a dynamic `https://*.grok-sandbox.com`
 * URL, which can't be pre-registered per app. The broker instead exposes ONE
 * shared "preview" client that accepts any
 * `https://*.grok-sandbox.com/api/auth/oauth2/callback/*`
 * (broker: `app-builder-deployer/auth/src/preview-oauth.ts`). Live-preview OAuth
 * is optional and configured via env on the server: set `PREVIEW_CLIENT_SECRET`
 * to enable real sign-in (no demo/mock users). When deployed the deployer injects
 * a per-app `GROK_AUTH_*` that overrides these (see `server.ts`).
 *
 * `PREVIEW_CLIENT_ID` is the public preview client id. The client secret is read
 * only from `PREVIEW_CLIENT_SECRET` and is an empty string when that variable is
 * unset. This is a dedicated, low-privilege client (preview-only,
 * `*.grok-sandbox.com`).
 */
export const PREVIEW_CLIENT_ID = "grok_preview";
export const PREVIEW_CLIENT_SECRET = process.env.PREVIEW_CLIENT_SECRET?.trim() ?? "";

/** The shared auth broker issuer (OIDC discovery lives under it). */
export const GROK_ISSUER_DEFAULT = "https://auth.grok.me";

/**
 * Host patterns whose callbacks the preview client accepts. Better Auth derives
 * the live preview's real origin from the request host and validates it against
 * this list (wildcard-matched), so the OAuth `redirect_uri` becomes the concrete
 * `https://<preview-host>/api/auth/oauth2/callback/...` the broker allows.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;

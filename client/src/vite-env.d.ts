/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Set to "true" for testing: allow /dashboard without Google (use with server AUTH_BYPASS) */
  readonly VITE_AUTH_BYPASS?: string;
  readonly VITE_AUTH_BYPASS_USER_ID?: string;
  readonly VITE_AUTH_BYPASS_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

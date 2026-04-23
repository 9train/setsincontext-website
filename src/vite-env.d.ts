/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_RUNTIME_ORIGIN?: string;
  readonly VITE_REMOTE_RUNTIME_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

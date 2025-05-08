/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_AWS_S3_BUCKET_NAME: string;
  readonly VITE_TEMPO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 여기에 사용하는 다른 환경 변수들도 추가하면 좋습니다.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
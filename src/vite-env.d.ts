/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 开发构建下显示「诊断信息」入口（Batch 4.5 第七节）；仅 DEV 时生效。 */
  readonly VITE_ENABLE_ONTOLOGY_DIAGNOSTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

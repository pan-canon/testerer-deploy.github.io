// src/config/paths.js
export const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/testerer-deploy.github.io/Testerer/game"
  : "";
export const ASSETS_PATH    = `${BASE_PATH}/assets`;
export const SQL_WASM_URL   = `${ASSETS_PATH}/libs/db/sql-wasm.js`;
export const TFJS_URL       = `${ASSETS_PATH}/libs/tf.min.js`;
export const COCO_SSD_URL   = `${ASSETS_PATH}/libs/coco-ssd.min.js`;
export const COCO_SSD_MODEL = `${ASSETS_PATH}/models/coco-ssd/model.json`;
export const SW_VERSION     = 'v7';
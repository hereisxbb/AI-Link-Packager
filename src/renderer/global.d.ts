import type { AiLinkPackagerApi } from "../../electron/preload";

declare global {
  interface Window {
    aiLinkPackager: AiLinkPackagerApi;
  }
}

export {};

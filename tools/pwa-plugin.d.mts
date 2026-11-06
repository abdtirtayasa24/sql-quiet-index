import type { Plugin } from 'vite';

/** The project's build adapter API, not a replacement declaration for vite-plugin-pwa. */
export declare const proofPwaOptions: Readonly<Record<string, unknown>>;
export declare function pwaProof(): Plugin[];

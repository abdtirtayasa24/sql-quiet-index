import { VitePWA } from 'vite-plugin-pwa';

// Build-only JS adapter: upstream optional-generator/Workbox declarations do not
// satisfy this project's strict DOM tooling config. Browser/SW TS stays strict.
export const proofPwaOptions = {
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'prompt',
  injectRegister: false,
  includeAssets: ['icons/*.png'],
  manifest: {
    id: '/technical-proof',
    name: 'The Quiet Index — Technical Proof',
    short_name: 'Quiet Index Proof',
    description:
      'Engineering proof only. Download the PG/parser demo explicitly; no missions or durable saves.',
    start_url: '/technical.html',
    scope: '/',
    display: 'standalone',
    theme_color: '#192028',
    background_color: '#192028',
    icons: [192, 512].map((size) => ({
      src: `/icons/proof-${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
    })),
  },
  injectManifest: {
    globPatterns: ['**/*.{js,css,html}', 'm0-assets-*.json'],
    globIgnores: [
      '**/*.worker-*.js',
      '**/nodefs-*',
      '**/memfs2opfs-*',
      '**/opfs-ahp-*',
      '**/*.wasm',
      '**/*.data',
      '**/*.snapshot',
    ],
    maximumFileSizeToCacheInBytes: 1_000_000,
    dontCacheBustURLsMatching: /^(?:assets\/|m0-assets-)/,
  },
};
export function pwaProof() {
  return VitePWA(proofPwaOptions);
}

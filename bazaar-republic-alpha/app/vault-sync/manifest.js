export default function manifest() {
  return {
    name: 'The Bazaar Republic',
    short_name: 'Bazaar DAO',
    description: 'Decentralized Security and MESH Protocol. E-Network Genesis Node.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary', // Locks the S23 Ultra to portrait to preserve UI logic
    background_color: '#020617', // Strict Tailwind slate-950
    theme_color: '#2563eb', // Strict Tailwind blue-600
    icons: [
      {
        src: '/icons/mesh-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/mesh-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
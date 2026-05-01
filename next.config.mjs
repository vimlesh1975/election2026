/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', '*'],
  async headers() {
    const noStore = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
      {
        key: 'Pragma',
        value: 'no-cache',
      },
      {
        key: 'Expires',
        value: '0',
      },
      {
        key: 'Surrogate-Control',
        value: 'no-store',
      },
    ];

    return [
      {
        source: '/template',
        headers: noStore,
      },
      {
        source: '/aitc-symbol.svg',
        headers: noStore,
      },
      {
        source: '/bjp-symbol.svg',
        headers: noStore,
      },
      {
        source: '/cpim-symbol.svg',
        headers: noStore,
      },
      {
        source: '/inc-symbol.svg',
        headers: noStore,
      },
      {
        source: '/oth-symbol.svg',
        headers: noStore,
      },
    ];
  },
};

export default nextConfig;

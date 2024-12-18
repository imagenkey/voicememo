/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-src 'self' https://vercel-live-git-george-toolbar-zero.vercel.sh http://localhost:* https://*.vusercontent.net/ https://*.lite.vusercontent.net/ https://generated.vusercontent.net/ https://vercel.live/ https://vercel.com https://vercel.fides-cdn.ethyca.com/ https://js.stripe.com/ https://*.supabase.co/;`
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/auth/callback',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig


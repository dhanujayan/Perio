import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The API lives in src/app/api (Next.js route handlers); on Netlify these run as functions.
  poweredByHeader: false,
  // Keep these as plain Node modules in the server bundle
  serverExternalPackages: ['pg', 'bcryptjs'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

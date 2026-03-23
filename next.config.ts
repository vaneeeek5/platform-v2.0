import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'ioredis', 'bullmq', 'bcryptjs'],
  turbopack: {
    root: '/private',
  },
}

export default nextConfig

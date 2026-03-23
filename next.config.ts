import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg', 'ioredis', 'bullmq', 'bcryptjs'],
  },
}

export default nextConfig

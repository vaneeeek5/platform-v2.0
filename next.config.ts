import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'ioredis', 'bullmq', 'bcryptjs'],
}

export default nextConfig

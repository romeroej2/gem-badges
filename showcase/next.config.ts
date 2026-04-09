import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['gem-badges', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
}

export default nextConfig

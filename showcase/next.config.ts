import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['fancy-buttons', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
}

export default nextConfig

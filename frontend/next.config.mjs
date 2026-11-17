/** @type {import('next').NextConfig} */
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  // Pin the app root so Next.js does not misdetect it from stray lockfiles
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Handle ES modules and external packages
  serverExternalPackages: [
    'viem', 'wagmi',
    '@polkadot/api', '@polkadot/extension-dapp', '@polkadot/react-identicon',
    'sails-js',
  ],

  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Polyfills for Web3/Polkadot
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      vm: 'vm-browserify',
      process: 'process/browser',
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Handle viem and other ESM packages
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        'viem': 'commonjs viem',
        'wagmi': 'commonjs wagmi'
      })
    }

    // Only warn about missing env vars instead of throwing
    if (isServer && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      console.warn('⚠️ Warning: Missing Supabase environment variables. Using mock data for development.')
    }
    
    return config;
  },

  // Proxy /api requests to the backend API
  // Uses NEXT_PUBLIC_GROWSTREAMS_API env var; falls back to live Railway API
  async rewrites() {
    let raw = (process.env.NEXT_PUBLIC_GROWSTREAMS_API || '').trim().replace(/^["']|["']$/g, '');
    if (raw && !raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('/')) {
      raw = `https://${raw}`;
    }
    const apiBase = (raw || 'http://localhost:3001').replace(/\/+$/, '');
    const destination = `${apiBase}/api/:path*`;

    if (!destination.startsWith('http://') && !destination.startsWith('https://') && !destination.startsWith('/')) {
      return [];
    }

    return {
      fallback: [
        {
          source: '/api/:path*',
          destination,
        },
      ],
    };
  },
};

export default nextConfig;

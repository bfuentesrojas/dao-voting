/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, dev }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignorar módulos de React Native que no son necesarios en el navegador
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }

    // Ignorar módulos problemáticos en el cliente
    config.plugins = config.plugins || [];
    
    // Asegurar que los módulos JSON se manejen correctamente
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Configuración mejorada para WebSocket en desarrollo
    if (dev && !isServer) {
      // Configurar watchOptions para mejorar la detección de cambios
      config.watchOptions = {
        ...config.watchOptions,
        poll: false, // No usar polling por defecto
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  // Desactivar optimizaciones que podrían causar problemas con el ABI
  swcMinify: true,
  // Configuración del servidor de desarrollo para mejorar estabilidad de WebSocket
  experimental: {
    // Mejorar la estabilidad de HMR
    optimizePackageImports: ['@tanstack/react-query', 'wagmi', 'viem'],
  },
};

module.exports = nextConfig;



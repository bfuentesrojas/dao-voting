/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
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
    
    return config;
  },
  // Desactivar optimizaciones que podrían causar problemas con el ABI
  swcMinify: true,
};

module.exports = nextConfig;



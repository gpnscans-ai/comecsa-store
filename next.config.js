/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desactivado porque el modo estricto de React monta/desmonta los componentes
  // dos veces en desarrollo, y react-leaflet (mapa de "Nuestras Sucursales") no
  // soporta ese doble montaje — lanza "Map container is already initialized".
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

module.exports = nextConfig;

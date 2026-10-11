/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/MAGICRINGSILICONNEGRO", destination: "/magic-ring-pilates-negro", permanent: true },
      { source: "/MAGICRINGSILICONNUDE", destination: "/magic-ring-pilates-nude", permanent: true },
      { source: "/MAGICRINGSILICONROSA", destination: "/magic-ring-pilates-rosa", permanent: true },
      { source: "/MAGICRINGSILICONAZUL", destination: "/magic-ring-pilates-azul", permanent: true },
      { source: "/MAGICRINGSILICONNARANJA", destination: "/magic-ring-pilates-naranja", permanent: true },
      { source: "/MAGICRINGSILICONARENA", destination: "/magic-ring-pilates-arena", permanent: true },
    ];
  },
};

module.exports = nextConfig;

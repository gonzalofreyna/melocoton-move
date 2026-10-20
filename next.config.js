/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sharp contiene binarios nativos para cada plataforma. Next no debe
  // integrarlos en el bundle webpack de la ruta de trazado.
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/trace-logo": [
      "./logo-trace-api/node_modules/@img/**/*",
      "./logo-trace-api/node_modules/sharp/**/*",
    ],
  },
};

module.exports = nextConfig;

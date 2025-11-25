/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  async redirects() {
    return [
      // Redirect old agent route names to new names
      {
        source: "/alpha",
        destination: "/aloha",
        permanent: true,
      },
      {
        source: "/app/alpha",
        destination: "/app/aloha",
        permanent: true,
      },
      {
        source: "/xi",
        destination: "/sync",
        permanent: true,
      },
      {
        source: "/app/xi",
        destination: "/app/sync",
        permanent: true,
      },
      {
        source: "/mu",
        destination: "/studio",
        permanent: true,
      },
      {
        source: "/app/mu",
        destination: "/app/studio",
        permanent: true,
      },
      {
        source: "/beta",
        destination: "/insight",
        permanent: true,
      },
      {
        source: "/app/beta",
        destination: "/app/insight",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf2json"],
  },
  // redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/auth",
  //       permanent: false,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   redirects() {
//     return [
//       {
//         source: "/",
//         destination: "/chat",
//         permanent: false,
//       },
//     ];
//   },
// };

// module.exports = nextConfig;

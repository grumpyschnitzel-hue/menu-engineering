/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdf-parse/pdfjs-dist uses canvas as an optional dependency.
    // We don't need it server-side (no image rendering), so alias to false.
    config.resolve.alias.canvas = false
    return config
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "playwright"],
  // The agents read their skills from brain/ at runtime; bundle those files with the deployment.
  outputFileTracingIncludes: {
    "/**": ["./brain/skills/**/*.md", "./brain/design/fluid-email-designer/**/*.md", "./brain/flows/*.json"],
  },
};

export default nextConfig;

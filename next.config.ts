import type { NextConfig } from "next";

const base_path = process.env.NEXT_PUBLIC_BASE_PATH || "";

const next_config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  ...(base_path ? { basePath: base_path, assetPrefix: base_path } : {}),
};

export default next_config;

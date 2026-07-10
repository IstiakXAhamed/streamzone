import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enables React's native <ViewTransition> for route-level animation
    // (components/layout/PageTransition.tsx). Next.js 16 requires this flag.
    viewTransition: true,
  },
  images: {
    // Required in Next.js 16 whenever a <Image quality> other than the
    // default 75 is used anywhere in the app. 50 is used for low-priority
    // thumbnails (e.g. Downloads list); 75 is the default/high-quality tier.
    qualities: [50, 75],
    // Drive/CDN hosts for remote poster/backdrop images. Until a host is
    // listed here, `components/ui/Media.tsx` falls back to `unoptimized`
    // rendering so remote images never hit the Next.js 400 rejection.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

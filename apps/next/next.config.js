/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')
const { withTamagui } = require('@tamagui/next-plugin')
const path = require('path')
const { join } = require('path')

const disableExtraction =
  process.env.DISABLE_EXTRACTION === 'true' || process.env.NODE_ENV === 'development'

const plugins = [
  withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: process.env.ANALYZE === 'true',
  }),
  withTamagui({
    enableLegacyFontSupport: true,
    appDir: false,
    themeBuilder: {
      input: '../../packages/app/ds/tamagui/themes/themes-old.tsx',
      output: '../../packages/app/ds/tamagui/themes/theme-generated.ts',
    },
    config: '../../packages/app/ds/tamagui/tamagui.config.ts',
    components: ['tamagui', 'app'],
    importsWhitelist: ['constants.js', 'colors.js'],
    // outputCSS: process.env.NODE_ENV === 'production' ? './public/tamagui.css' : null,
    logTimings: false,
    disableExtraction,
    shouldExtract: (path) => {
      if (path.includes(join('packages', 'app'))) {
        return true
      }
    },
    excludeReactNativeWebExports: [
      'VirtualizedList',
      'Switch',
      'ProgressBar',
      'Picker',
      'CheckBox',
      'FlatList',

      // these are used by @expo/react-native-action-sheet...ugh
      // 'Touchable',
      // 'Animated',
    ],
    useTamaguiSVG: false,
  }),
  (nextConfig) => {
    return {
      webpack: (webpackConfig, options) => {
        webpackConfig.resolve.alias = {
          ...webpackConfig.resolve.alias,
          // 'react-native-svg': '@tamagui/react-native-svg',
        }
        // if (!options.isServer) {
        //   webpackConfig.plugins.push(
        //     WorkerPlugin({
        //       // use "self" as the global object when receiving hot updates.
        //       globalObject: 'self',
        //     })
        //   )
        // }
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, options)
        }
        return webpackConfig
      },
    }
  },
]

/** @type {import('next').NextConfig} */
let config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: '192.168.0.23',
      },
      {
        hostname: 'i.postimg.cc', // TODO remove
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
    ],
  },

  modularizeImports: {
    '@tamagui/lucide-icons': {
      transform: `@tamagui/lucide-icons/dist/esm/icons/{{kebabCase member}}`,
      skipDefaultConversion: true,
    },
  },

  transpilePackages: [
    'typescript',
    'zeego',
    'burnt',
    'solito',
    'react-native-web',
    'expo-linking',
    'expo-constants',
    'expo-modules-core',
    'expo-image-picker',
    'expo-web-browser',
    'expo-auth-session',
    'react-native-gesture-handler',
    'geist',
    '@nandorojo/anchor',
    'expo-auth-session',
    'expo-crypto',
    'react-syntax-highlighter',
    '@expo/react-native-action-sheet',
  ],
  experimental: {
    // https://blog.arcjet.com/structured-logging-in-json-for-next-js/
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
    scrollRestoration: true,
    typedRoutes: true,
    instrumentationHook: true,
    // nextScriptWorkers: true,
    // optimizeCss: true,

    optimizePackageImports: [
      '@tamagui/lucide-icons',
      'app',
      'tamagui',
      'react-native',
      'react-native-web',
      'react-native-reanimated',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXT_PUBLIC_IS_ELECTRON: process.env.IS_ELECTRON ? 'true' : 'false',
  },
  rewrites: () => [
    {
      source: '/@:profileSlug/:path*',
      destination: '/profiles/:profileSlug/:path*',
    },
  ],
}

for (const plugin of plugins) {
  config = {
    ...config,
    ...plugin(config),
  }
}

if (process.env.IS_ELECTRON) {
  config.output = 'standalone' // TODO
  // config.distDir = process.env.NODE_ENV === 'production' ? '../electron-app/app' : '.next'
  // config.trailingSlash = true
  // config.images ??= {}
  // config.images.unoptimized = true
  console.log('⚡️ ⚡️ [next.config.js] electron')
}

module.exports = config


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "params-19",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);

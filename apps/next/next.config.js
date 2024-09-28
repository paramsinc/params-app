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
    appDir: true,
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
      'Touchable',
      'FlatList',
      'Animated',
      // 'Modal',
    ],
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
    'react-native-gesture-handler',
    'geist',
    '@nandorojo/anchor',
  ],
  experimental: {
    scrollRestoration: true,
    typedRoutes: true,
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

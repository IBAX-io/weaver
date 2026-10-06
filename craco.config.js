const path = require('path');
const webpack = require('webpack');

module.exports = {
  babel: {
    plugins: [
      // Allow namespace tags in JSX (needed for SVGs with xmlns:sketch etc.)
    ],
    loaderOptions: (babelLoaderOptions) => {
      // Find and modify the preset-react to set throwIfNamespace: false
      if (babelLoaderOptions.presets) {
        babelLoaderOptions.presets = babelLoaderOptions.presets.map(preset => {
          if (Array.isArray(preset)) {
            const [presetName, presetOptions] = preset;
            if (presetName && presetName.includes('preset-react')) {
              return [presetName, { ...presetOptions, throwIfNamespace: false }];
            }
          }
          return preset;
        });
      }
      return babelLoaderOptions;
    }
  },
  webpack: {
    configure: (webpackConfig) => {
      // Keep electron modules as external so require() works in Electron renderer
      webpackConfig.externals = {
        ...(webpackConfig.externals || {}),
        electron: 'commonjs electron',
        '@electron/remote': 'commonjs @electron/remote'
      };

      // Add src/app as a module resolution root (preserves old baseUrl: "src/app" behavior)
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'src/app'),
        'node_modules',
        ...(webpackConfig.resolve.modules || [])
      ];

      // Webpack 5 no longer polyfills Node.js core modules
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        process: require.resolve('process/browser.js'),
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        crypto: false,
        path: false,
        os: false,
        fs: false,
        module: false,
      };

      // Fix for ESM modules that reference 'process/browser' without extension
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      });

      // Skip url() resolution for absolute paths in CSS (e.g. /img/jqui/..., /fonts/...)
      // The pre-built sass.css contains absolute url() paths that shouldn't be resolved by webpack
      // But relative urls (e.g. in font-awesome, simple-line-icons) must still be resolved
      const cssRules = webpackConfig.module.rules.find(rule => Array.isArray(rule.oneOf));
      if (cssRules) {
        cssRules.oneOf.forEach(rule => {
          if (rule.use) {
            rule.use.forEach(loader => {
              if (typeof loader === 'object' && loader.loader && loader.loader.includes('css-loader') && !loader.loader.includes('postcss')) {
                loader.options = {
                  ...loader.options,
                  url: {
                    filter: (url) => !url.startsWith('/')
                  }
                };
              }
            });
          }
        });
      }

      // Provide process and Buffer globals
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      return webpackConfig;
    }
  }
};

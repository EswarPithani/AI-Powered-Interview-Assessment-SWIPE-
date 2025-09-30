const webpack = require('webpack');
const path = require('path');

module.exports = {
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            // Add fallbacks for Node.js core modules
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                "fs": false,
                "http": require.resolve("stream-http"),
                "https": require.resolve("https-browserify"),
                "url": require.resolve("url/"),
                "buffer": require.resolve("buffer/"),
                "util": require.resolve("util/"),
                "stream": require.resolve("stream-browserify"),
                "zlib": require.resolve("browserify-zlib"),
                "path": require.resolve("path-browserify"),
                "crypto": require.resolve("crypto-browserify"),
                "os": require.resolve("os-browserify/browser"),
                "assert": require.resolve("assert/")
            };

            // Provide plugins for global variables
            webpackConfig.plugins = [
                ...webpackConfig.plugins,
                new webpack.ProvidePlugin({
                    process: 'process/browser.js',
                    Buffer: ['buffer', 'Buffer'],
                })
            ];

            // Handle ES module extensions
            webpackConfig.resolve.extensions = [
                ...webpackConfig.resolve.extensions,
                '.mjs', '.js', '.jsx', '.ts', '.tsx'
            ];

            // Configure module rules for ES modules
            webpackConfig.module.rules.push({
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false, // Disable the behavior that requires .js extension
                },
            });

            return webpackConfig;
        }
    },
    jest: {
        configure: {
            moduleNameMapping: {
                "^@/(.*)$": "<rootDir>/src/$1"
            }
        }
    }
};
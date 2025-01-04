const path = require('path');
const webpack = require("webpack");
const PACKAGE = require('./package.json');

const ReplaceHashInFileWebpackPlugin = require('replace-hash-in-file-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        index: './src/index.js',
    },

    output: {
        filename: 'script.js',
        path: path.resolve(__dirname, 'index'),
        clean: true,
        publicPath: '',
    },

    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin(),
        ],
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            },
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: `./src/index.html`,
            filename: `index.html`,
            favicon: "./src/assets/favicon.svg",
            inject: true,
            minify: false,
            hash: true,
            version: PACKAGE.version,
            manifest: '<link rel="manifest" href="manifest.json" />',
        }),
        new MiniCssExtractPlugin({
            filename: 'style.css',
        }),
        new webpack.DefinePlugin({ USE_SW: JSON.stringify(true) }),
        new CopyPlugin({
            patterns: [
                { from: "src/assets/sw.js", to: "" },
                { from: "src/assets/manifest.json", to: "" },
                { from: "src/assets/icon.png", to: "" },
            ],
        }),
        new ReplaceHashInFileWebpackPlugin([{
            dir: 'index',
            files: ['sw.js'],
            rules: [{
                search: /@cachename/,
                replace: '[hash]'
            }]
        }])
    ],

    mode: 'production',
};
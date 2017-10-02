var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var helpers = require('./helpers');
var path = require('path');


module.exports = webpackMerge(commonConfig, {
    devtool: 'cheap-module-eval-source-map',

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: [
                    {
                        loader: 'awesome-typescript-loader',
                        options: { configFileName: helpers.root('src', 'tsconfig.json') }
                    },
                    'angular-router-loader',
                    'angular2-template-loader'
                ]
            }
        ]
    },

    output: {
        path: helpers.root('../backend/static/ng'),
        publicPath: '/static/ng/',
        filename: '[name].js',
        sourceMapFilename: '[name].js.map',
        chunkFilename: '[id].chunk.js'
    },

    plugins: [
        // Workaround for https://github.com/angular/angular/issues/11580
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)@angular/,
            path.resolve(__dirname, '../src')
        ),
        new ExtractTextPlugin('[name].css'),
    ],
});

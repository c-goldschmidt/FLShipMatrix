var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var helpers = require('./helpers');
var AotPlugin = require('@ngtools/webpack').AotPlugin;

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

module.exports = webpackMerge(commonConfig, {
    devtool: 'source-map',
    
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: '@ngtools/webpack'
            }
        ]
    },

    output: {
        path: helpers.root('../backend/static/js/'),
        filename: '[name].min.js',
        chunkFilename: '[id].chunk.min.js',
        publicPath: '/static/js/',
    },

    plugins: [
        new AotPlugin({
            tsConfigPath: "src/tsconfig.json",
            skipCodeGeneration: false,
            locale: language,
            i18nFile: helpers.root('src/locale/messages.' + language + '.xlf'),
            i18nFormat: 'xlf',
            mainPath: helpers.root('src/main.ts'), // path must be absolute!
        }),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({ // https://github.com/angular/angular/issues/10618
            mangle: {
                keep_fnames: true
            },
            sourceMap: false // set to true for debugging issues with the bundle
        }),
        new ExtractTextPlugin('[name].min.css'),
        new webpack.DefinePlugin({
            'process.env': {
                'ENV': JSON.stringify(ENV)
            }
        }),
        new webpack.LoaderOptionsPlugin({
            htmlLoader: {
                minimize: false // workaround for ng2
            }
        })
      ]
});
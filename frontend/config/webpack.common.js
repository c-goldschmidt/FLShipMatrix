var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./helpers');

module.exports = {
    entry: {
        'polyfills': './src/polyfills.ts',
        'app': './src/main.ts'
    },

    resolve: {
        extensions: ['.ts', '.js', '.less'],
        modules: ['node_modules']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: 'pre',
                loader: 'tslint-loader',
                exclude: ['node_modules'],
                options: {
                tsConfigFile: 'src/tsconfig.json',
                configFile: 'tslint.json',
                emitErrors: false,
                failOnHint: false,
                typeCheck: false, // typeCheck heavily impacts compilation time
                },
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file-loader?name=assets/[name].[hash].[ext]'
            },
            {
                test: /\.css$/,
                include: helpers.root('src', 'app'),
                loader: 'raw-loader'
            },
            // This loader is specially for dragula or any other npm modules
            {
                test: /\.css$/,
                include: helpers.root('node_modules'),
                loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
            },
            {
                test: /.less$/,
                include: helpers.root('src', 'app'),
                loader: 'raw-loader!less-loader'
            },
            // This loader is specially for angular material theme
            {
                test: /.scss$/,
                include: helpers.root('src', 'app'),
                loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!sass-loader' })
            }
        ]
    },

        
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ['app', 'polyfills']
        }),
    ]
};
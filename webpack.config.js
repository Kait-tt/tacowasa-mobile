const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// development
const webpackConfig = {
    entry: {
        index: path.join(__dirname, '/src/js/entries/index.js'),
        newtask: path.join(__dirname, '/src/js/entries/newtask.js'),
        edit: path.join(__dirname, '/src/js/entries/edit.js'),
        gesture: path.join(__dirname, '/src/js/entries/gesture.js'),
        test_qrreader: path.join(__dirname, '/src/js/entries/test_qrreader.js'),
        test_gesture: path.join(__dirname, '/src/js/entries/test_gesture.js')
    },
    output: {
        publicPath: '/',
        path: path.join(__dirname, '/dist'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            // html loaderの設定をここに定義するとscssの読込がバグるのでやらないこと
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel'
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader')
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file'
            },
            {
                test: /\.(woff|woff2)$/,
                loader: 'url?prefix=font/&limit=5000'
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=application/octet-stream'
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=image/svg+xml'
            }
        ]
    },
    htmlLoader: {
        attrs: ['minimize']
    },
    sassLoader: {
        includePaths: [path.join(__dirname, '/src/scss')]
    },
    devtool: '#source-map',
    resolve: {
        extensions: ['', '.js', '.json']
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('common.js'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new ExtractTextPlugin('[name].css'),
        function () {
            this.plugin('watch-run', (watching, callback) => {
                console.log('Begin compile at ' + new Date());
                callback();
            });
        }
    ]
};

// production
if (process.env.NODE_ENV === 'production') {
    const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
    });
    webpackConfig.plugins.push(uglifyJsPlugin);
}

module.exports = webpackConfig;

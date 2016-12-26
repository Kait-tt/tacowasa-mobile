const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// development
const webpackConfig = {
    entry: {
        index: path.join(__dirname, '/src/js/entries/index.js'),
        kanban: path.join(__dirname, '/src/js/entries/kanban.js'),
	    newtask: path.join(__dirname, '/src/js/entries/newtask.js'),
        qrread: path.join(__dirname, '/src/js/entries/qrread.js'),
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

module.exports = webpackConfig;

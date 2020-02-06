/**
 * Created by bvanlew on 11/05/2017.
 */
// refer to https://webpack.js.org/concepts/

var path = require('path');
//const WebpackShellPlugin = require('webpack-shell-plugin');
//const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const webPackConfig = {

    //define the base path as parent
    context: path.resolve(__dirname, './'), // eslint-disable-line no-undef
    // entry:  Where to start creating the dependency graph for the bundle
    // allows multiple entry points to handle separate bundles
    entry: {
        'config': './example_config.js',
    },
    // output: Where to place the output bundle
    output: {
        // path relative to this file
        path: path.resolve('./'), // eslint-disable-line no-undef
        filename: '[name].js', // output name from entry name (key)
        library: 'Config',
        libraryTarget: 'umd'
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // limit support to these browser versions and above
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    'targets': {
                                        'chrome': '58',
                                        'opera': '45',
                                        'firefox': '52',
                                        'safari': '10.1.2'
                                    }
                                }
                            ]
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties' // for static methods
                        ]
                    }
                }
            }
        ]
    },
    node: {
        fs: 'empty'
    },
    // Add plugins for Uglify or creation of a dist/index.html with all
    //plugins: [new webpack.HotModuleReplacementPlugin(), new HtmlWebpackPlugin()],
    plugins: [

        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        // copy the outputs to the test directories after the build
        /*new WebpackShellPlugin({
            onBuildExit:[
                'echo "Copy files to webdriver test"...',
                'cp -v ../ReScatter/dist/rescatter.js test/browser_tests/html/',
                'cp -v ../BrainScope/app/static/js/vendor/webix.js test/browser_tests/html/',
                'echo "Copy files to BrainScope website framework"...',
                'cp -v ../ReScatter/dist/rescatter.css ../BrainScope/app/static/js/framework',
                'cp -v ../ReScatter/dist/rescatter.js ../BrainScope/app/static/js/framework',
                'echo "Copy files to example framework"...',
                'cp -v ../ReScatter/dist/rescatter.css ../ReScatter/example/framework',
                'cp -v ../ReScatter/dist/rescatter.js ../ReScatter/example/framework',
            ]
        })*/
    ]
};


module.exports = webPackConfig;

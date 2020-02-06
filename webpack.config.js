/**
 * Created by bvanlew on 11/05/2017.
 */
// refer to https://webpack.js.org/concepts/

process.traceDeprecation = true;
const path = require('path');
const rf = require('rimraf');

const WebpackShellPlugin = require('webpack-shell-plugin-next');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const isProd = (process.env.NODE_ENV === 'production');
const isDev = !isProd;

// copy the outputs to the test directories after the build
console.log('clean old dist directory');
rf.sync('./dist');
const webPackShell = new WebpackShellPlugin({
    onBuildExit:{

        scripts: [
            'echo-cli "Copy rescatter files to webdriver test"...',
            'copyfiles -V -f ../ReScatter/dist/rescatter.js test/browser_tests/html/',
            'copyfiles -V -f ../BrainScope/app/static/js/vendor/webix.js test/browser_tests/html/',
            'echo-cli "Copy rescatter files to BrainScope website framework"...',
            'copyfiles -V -f ../ReScatter/dist/rescatter_dark.css ../BrainScope/app/static/css',
            'copyfiles -V -f ../ReScatter/dist/rescatter.js ../BrainScope/app/static/js/framework',
            'copyfiles -V -f ../ReScatter/dist/fonts/*.* ../BrainScope/app/static/css',
            'echo-cli "Copy rescatter files to example framework"...',
            'copyfiles -V -f ../ReScatter/src/rescatter_layouts.js ../ReScatter/example/framework',
            'copyfiles -V -f ../ReScatter/dist/rescatter_dark.css ../ReScatter/example/framework',
            'copyfiles -V -f ../ReScatter/dist/rescatter_light.css ../ReScatter/example/framework',
            'copyfiles -V -f ../ReScatter/dist/rescatter.js ../ReScatter/example/framework',
            'copyfiles -V -f ../ReScatter/dist/rescatter.js.map ../ReScatter/example/framework',
            'echo-cli "Copy rescatter files to tools framework"...',
            'copyfiles -V -f ../ReScatter/dist/rescatter.js ../ReScatter/tools/framework',
            'copyfiles -V -f ../ReScatter/dist/rescatter.js.map ../ReScatter/tools/framework',
            'copyfiles -V -f ../ReScatter/dist/fonts/*.* ../ReScatter/example/framework/fonts'
        ],
        blocking: true,
        parallel: false
    }
});

let webPackConfig = {

    //define the base path as parent
    context: path.resolve(__dirname, './'), // eslint-disable-line no-undef
    // entry:  Where to start creating the dependency graph for the bundle
    // allows multiple entry points to handle separate bundles
    entry: {
        'rescatter': './src/index.js',
        'rescatter_light': './src/themes/light/rescatter_light.less',
        'rescatter_dark': './src/themes/dark/rescatter_dark.less'
    },
    // output: Where to place the output bundle
    output: {
        // path relative to this file
        path: path.resolve(__dirname, 'dist'), // eslint-disable-line no-undef
        filename: '[name].js', // output name from entry name (key)
        library: 'ReScatter',
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
                        //    '@babel/plugin-transform-runtime',
                            '@babel/plugin-proposal-class-properties' // for static methods
                        ]
                    }
                }

            },
            {
                test: /\.(png|jpg)$/,
                use: {
                    loader: 'url-loader?limit=8192' //inline base64 images up to 8k
                }
            },
            {
                test: /\.(frag|vert)$/,
                use: {
                    loader: 'webpack-glsl-loader'
                }
            },
            {
                test: /\.less$/,
                use: [
                    {
                        // emit CSS as separate file
                        loader: 'file-loader',
                        options: {
                            name: '[name].css',
                            outputPath: '.' //relative to main output above
                        }
                    },
                    {
                        // extract the CSS from the bundle
                        loader: 'extract-loader'
                    },
                    {
                        loader:'css-loader', options: {sourceMap: isDev}
                    },
                    {
                        // Resolve the file relative imports in less
                        // Remove any query URL component (found in webix material less)
                        // since we are loading from a local directory
                        loader:'resolve-url-loader'
                    },
                    {
                        loader: 'less-loader', options: {sourceMap: isDev}
                    }
                ]
            },
            {
                test: /\.(woff|woff2)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'fonts/[name].[ext]',
                        }
                    }
                ]
            }
        ]
    },
    node: {
        fs: 'empty'
    },
    // Add plugins for Uglify or creation of a dist/index.html with all
    //plugins: [new webpack.HotModuleReplacementPlugin(), new HtmlWebpackPlugin()],
    plugins: [
        webPackShell,
    ],
    externals: {
        webix: 'webix', //webix is external and available at the global variable webix
        'pixi.js': 'pixi.js'
    },
    resolve: {
        alias: {
            'jquery-resizable-dom': 'jquery-resizable-dom/dist/jquery-resizable.min.js'
        }
    }


};

if (isProd) {
    webPackConfig.plugins.push(
        new UglifyJsPlugin({
            test: [
                /\.js$/i
            ],
            sourceMap: true,
            uglifyOptions: {
                ecma: 8,
                compress: { warnings: false, unused: false },
                output: { comments: false },
            },
        })
    );
}



module.exports = webPackConfig;

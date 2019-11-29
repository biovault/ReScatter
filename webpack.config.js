/**
 * Created by bvanlew on 11/05/2017.
 */
// refer to https://webpack.js.org/concepts/

process.traceDeprecation = true;
const path = require('path');

const WebpackShellPlugin = require('webpack-shell-plugin-next');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const isProd = (process.env.NODE_ENV === 'production');
const isDev = !isProd;
        // copy the outputs to the test directories after the build
const webPackShell = new WebpackShellPlugin({
            onBuildStart:{
                scripts: [
                    'echo "clean old dist directory"',
                    'rm -rf ../ReScatter/dist/*'
                ],
                blocking: true,
                parallel: false
            },
            onBuildExit:{
                scripts: [
                    'echo "Copy files to webdriver test"...',
                    'cp -v ../ReScatter/dist/rescatter.js test/browser_tests/html/',
                    'cp -v ../BrainScope/app/static/js/vendor/webix.js test/browser_tests/html/',
                    'echo "Copy files to BrainScope website framework"...',
                    'cp -v ../ReScatter/dist/rescatter_dark.css ../BrainScope/app/static/css',
                    'cp -v ../ReScatter/dist/rescatter.js ../BrainScope/app/static/js/framework',
                    'cp -v -r ../ReScatter/dist/fonts ../BrainScope/app/static/css',
                    'echo "Copy files to example framework"...',
                    'cp -v ../ReScatter/dist/rescatter_dark.css ../ReScatter/example/framework',
                    'cp -v ../ReScatter/dist/rescatter_light.css ../ReScatter/example/framework',
                    'cp -v ../ReScatter/dist/rescatter.js ../ReScatter/example/framework',
                    'cp -v -r ../ReScatter/dist/fonts ../ReScatter/example/framework'
                ],
                blocking: true,
                parallel: false
            }
        });

if (isDev) {
    const devSteps = [
                'echo "Copy development files to BrainScope website framework"...',
                'cp -v ../ReScatter/dist/rescatter_dark.css.map ../BrainScope/app/static/css',
                'cp -v ../ReScatter/dist/rescatter.js.map ../BrainScope/app/static/js/framework',
                'echo "Copy development files to example framework"...',
                'cp -v ../ReScatter/dist/rescatter_dark.css.map ../ReScatter/example/framework',
                'cp -v ../ReScatter/dist/rescatter_light.css.map ../ReScatter/example/framework',
                'cp -v ../ReScatter/dist/rescatter.js.map ../ReScatter/example/framework'
            ];
    webPackShell.options.onBuildExit.scripts.push(...devSteps);
}

webPackConfig = {

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
                                    "chrome": "58",
                                    "opera": "45",
                                    "firefox": "52",
                                    "safari": "10.1.2"
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
                        loader: "file-loader",
                        options: {
                            name: "fonts/[name].[ext]",
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
        webix: 'webix' //webix is external and available at the global variable webix
    },



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
    )
}



module.exports = webPackConfig;

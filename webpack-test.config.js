/**
 * Created by bvanlew on 12/05/2017.
 */

// refer to https://webpack.js.org/concepts/

var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var glob = require('glob');
var assert = require('assert');
var buildTarget = process.env.BUILD_TARGET;

var entry = {};
var output = {};

// Supporting several BUILD_TARGET s:
// browser_tests - the mocha webdriver.io tests for browser GUI
// browser_script - compile the javascript used in the browser for the GUI test
if (buildTarget == 'browser_tests' ) {
    var entries = glob.sync('./test/browser_tests/*.js');

    entries.forEach(function (v, i, a) {
        'use strict';
        a[i] = './ReScatter' + a[i].substr(1);
    });

    // insert babel-polyfill into the bundle to support async/await
    entries.splice(0, 0, 'babel-polyfill');

    entry = {
        'test/dist/test_browser': entries
    }
    output = {
        // path relative to this file
        path: path.resolve('./'), // eslint-disable-line no-undef
        filename: '[name].js' // output name from entry name (key)
    };

} else if (buildTarget == 'browser_script') {
    entries = ['./ReScatter/test/browser_tests/script/index.js'];
    entry = {
        'test/browser_tests/html/test_functions': entries
    };
    output = {
        // path relative to this file
        path: path.resolve('./'), // eslint-disable-line no-undef
        filename: '[name].js', // output name from entry name (key)
        library: 'BrowserTest',
        libraryTarget: 'umd'
    };
} else {
    assert(false, 'Unnown build target: ' + buildTarget +  ' Set the target in environment variable BUILD_TARGET ');
}

console.log(entries);
module.exports = {

    //define the base path as parent
    context: path.resolve(__dirname, '../'), // eslint-disable-line no-undef
    // entry:  Where to start creating the dependency graph for the bundle
    // allows multiple entry points to handle separate bundles
    // Because only one out is supportd in webpack 2.x we trick the
    // output by including relative paths in the file name
    entry: entry,
    // output: Where to place the output bundle
    output: output,
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                presets: ['es2015'],
                plugins: ['transform-async-to-generator']
            }
        }]
    },
    // Add plugins for Uglify or creation of a dist/index.html with all
    //plugins: [new webpack.HotModuleReplacementPlugin(), new HtmlWebpackPlugin()],
    plugins: [
        // copy the output bundles (including the main bundle) to the test directories
        new CopyWebpackPlugin([
            {from:  'ReScatter/dist/rescatter.js', to: 'test/browser_tests/html'},
            {from:  'DimRS/distClient/dimrs.js', to: 'test/browser_tests/html'}
        //    {from:  'ReScatter/test/dist/testtsne.js', to: 'test/tsnetest/html'},
        ])
    ],
    externals: {
        webix: 'webix' //webix is external and available at the global variable webix
    }

};

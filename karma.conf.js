// import the config and remove the entry
// see http://mike-ward.net/2015/09/07/tips-on-setting-up-karma-testing-with-webpack/
var webpackConfig = require('./webpack-test.config.js');
webpackConfig.entry = {};
module.exports = function (config) {
    config.set({
        // To run in additional browsers:
        // 1. install corresponding karma launcher
        //    http://karma-runner.github.io/0.13/config/browsers.html
        // 2. add it to the `browsers` array below.
        // Alter windows posn and size see http://stackoverflow.com/questions/21968124/start-minimized-browser-instance-with-karma
        browsers: ['Chrome_small'],
        customLaunchers: {
            Chrome_small: {
                base: 'Chrome' ,
                flags: [
                    '--window-size=400,400',
                    '--window-position=-600,200'
                ]
            }
        },
        port: 9877, // allow parallel testing with DimRS (port 9876)
        // sinon-chai must be at end to avoid masking chai
        frameworks: ['mocha', 'chai', 'chai-datetime', 'sinon-chai'],
        reporters: ['mocha'],
        // list of files / patterns to load in the browser
        // To test sections of ReScatter that us the dimensionality
        // reduction service must include DimRS
        // basePath is from top of parent project
        basePath: '../',
        files: [
            'ReScatter/src/index.js',
            'ReScatter/test/tsnetest/index.js',
            // Built externally - no preprocessor declared
            'DimRS/dist/dimrs.js',
        ],
        preprocessors: {
            'ReScatter/src/index.js': ['webpack'],
            'ReScatter/test/testtsne/index.js': ['webpack'],
        },
        // webpack config - included
        webpack: webpackConfig,
        // list of files to exclude
        exclude: [
        ],
        //proxies : {
        //    '/':  'http://localhost:3000'
       // },
        // enable / disable colors in the output (reporters and logs)
        colors: true,
        logLevel: config.DEBUG,
        // ** ADD THIS IN ** (vue-cli's webpack template doesn't add it by default)
        plugins: [
            // Preprocessors,
            'karma-webpack',
            // Launchers
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            // Test Libraries
            'karma-mocha',
            'karma-sinon-chai',
            'karma-chai',
            'karma-chai-datetime',
            // Reporters
            'karma-mocha-reporter',
        ],
    });
};

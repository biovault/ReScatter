const EXAMPLE_PORT = 8080;
// imports for file download
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

global.downloadDir = '/tmp/Downloads';
global.hostDownloadDir = path.join(__dirname, 'tempDownload');
global.dataDir = path.join(__dirname, 'tempData');
global.CI = process.env.CI;

const exampleDir = path.join(__dirname, 'example');

// longer timeout for CI
const timeout = process.env.CI ? 100000 : process.env.DEBUG ? 9999999: 50000;
const selenium_image = process.env.DEBUG ? 'selenium/standalone-chrome-debug' : 'selenium/standalone-chrome';
// manually start selenium docker container on the CI - devtools gives extra access to chrome
const services = process.env.CI ?
    ['static-server', ['devtools',{debuggerAddress: '0.0.0.0:9222'}]] :
    ['static-server', 'docker', ['devtools',{debuggerAddress: '0.0.0.0:9222'}]];

// This is the web server host run bu webdriverio
// Need to fix the /etc/hosts file in docker on the CI for this
const serverhost = process.env.CI ? 'http://host.docker.internal' : 'http://host.docker.internal';

let chromeArgs = [
    '--whitelisted-ips',
    '--proxy-server=direct://',
    '--proxy-bypass-list=*',
    '--no-sandbox',
    '--disable-web-security',
    '--disable-extensions',
    '--disable-download-notification',
    '--allow-running-insecure-content',
    '--safebrowsing-disable-download-protection',
    '--window-size=1920,1080',
    '--remote-debugging-port=9222',
    '--remote-debugging-address=0.0.0.0'
];

// except for local debug chrome must be headless with no gpu
if (!process.env.DEBUG) {
    chromeArgs.push('--headless');
    chromeArgs.push('--disable-gpu');
}
var config = {

    // ==================================
    // Where should your test be launched
    // ==================================
    //
    //runner: 'local',
    //
    // =====================
    // Server Configurations
    // =====================
    // Host address of the running Selenium server. This information is usually obsolete, as
    // WebdriverIO automatically connects to localhost. Also if you are using one of the
    // supported cloud services like Sauce Labs, Browserstack, or Testing Bot, you also don't
    // need to define host and port information (because WebdriverIO can figure that out
    // from your user and key information). However, if you are using a private Selenium
    // backend, you should define the `hostname`, `port`, and `path` here.
    //
    hostname: 'localhost',
    port: 4444,
    path: '/wd/hub',

    featureFlags: {
        specFiltering: true
    },
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called.
    //
    // If you are calling `wdio` from an NPM script (see https://docs.npmjs.com/cli/run-script),
    // then the current working directory is where your `package.json` resides, so `wdio`
    // will be called from there.
    //
    specs: [
        'test/specs/*.js'
    ],
    // Patterns to exclude.
    exclude: [
        //'test/spec/multibrowser/**',
        //'test/spec/mobile/**'
    ],

    //
    // Set a base URL in order to shorten `url()` command calls. If your `url` parameter starts
    // with `/`, the `baseUrl` is prepended, not including the path portion of `baseUrl`.
    //
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the `baseUrl`
    // gets prepended directly.
    baseUrl: `${serverhost}:${EXAMPLE_PORT}`,

    // Services:
    // docker: for selenium browser testing
    // static-server: to host the examples/test sites
    services: services,
    // Server the example directory for testing purposes
    staticServerFolders: [
        { mount: '/', path: `${exampleDir}` },
    ],
    staticServerPort: EXAMPLE_PORT,

    dockerOptions: {
        // to debug use selenium/standalone-chrome-debug - vnc over 5900 pw secret
        image: selenium_image,
        healthCheck: {
            url: 'http://localhost:4444',
            maxRetries: 3,
            inspectInterval: 1000,
            startDelay: 5000
        },
        options: {
            p: ['4444:4444', '0.0.0.0:9222:9222'],
            // map the default download dir to the host dir
            v:[`${global.hostDownloadDir}:${global.downloadDir}`],
            shmSize: '2g',
        }
    },

    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your `capabilities`, you can overwrite the `spec` and `exclude`
    // options in order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set `maxInstances` to 1. wdio will spawn 3 processes.
    //
    // Therefore, if you have 10 spec files and you set `maxInstances` to 10, all spec files
    // will be tested at the same time and 30 processes will be spawned.
    //
    // The property basically handles how many capabilities from the same test should run tests.
    //
    // single instance - tests are sequential
    maxInstances: 1,
    //
    // Or set a limit to run tests with a specific capability.
    maxInstancesPerCapability: 1,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            prefs: {
                'profile.default_content_settings.popups': 0,
                'directory_upgrade': true,
                'download.default_directory': '/tmp/Downloads',
                'download.prompt_for_download':false,
                'download.directory_upgrade':true,
                'download.extensions_to_open': '',
                'download.open_pdf_in_system_reader':false,
                'download_restrictions': 0,
                'safebrowsing.enabled':true,
                'safebrowsing.disable_download_protection':true
            },
            args:chromeArgs,
        // to run chrome headless the following flags are required
        // (see https://developers.google.com/web/updates/2017/04/headless-chrome)
        //args: ['--verbose'], //, '--disable-gpu'],
        },
        //platformName: 'Linux' // OS platform
    }],
    //
    // Additional list of node arguments to use when starting child processes
    execArgv: [],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'trace',
    //
    // Set specific log levels per logger
    // use 'silent' level to disable logger
    logLevels: {
        webdriver: 'debug',
        '@wdio/applitools-service': 'debug'
    },
    //
    // Set directory to store all logs into
    outputDir: __dirname,
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,

    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 1000,
    //
    // Add files to watch (e.g. application code or page objects) when running `wdio` command
    // with `--watch` flag. Globbing is supported.
    filesToWatch: [
        // e.g. rerun tests if I change my application code
        // './app/**/*.js'
    ],
    //
    // Framework you want to run your specs with.
    // The following are supported: 'mocha', 'jasmine', and 'cucumber'
    // See also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    specFileRetries: 1,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // See also: https://webdriver.io/docs/dot-reporter.html , and click on "Reporters" in left column
    reporters: ['dot', 'spec'],
    //
    // Options to be passed to Mocha.
    // See the full list at: http://mochajs.org
    mochaOpts: {
        timeout: timeout,
        ui: 'bdd'
    },

    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides a several hooks you can use to interfere the test process in order to enhance
    // it and build services around it. You can either apply a single function to it or an array of
    // methods. If one of them returns with a promise, WebdriverIO will wait until that promise is
    // resolved to continue.
    //

    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    onPrepare: function (/*config, capabilities*/) {
        // cleanup download directory
        return new Promise((resolve /*, reject*/) => {
            if(global.CI) {
                console.log(`Download dir already exists in CI - listing: ${global.hostDownloadDir}`);
                fs.readdir(global.hostDownloadDir, function(err, items) {
                    console.log(items);

                    for (var i=0; i<items.length; i++) {
                        console.log(items[i]);
                    }
                });
                resolve();
                return;
            }
            if (fs.existsSync(global.hostDownloadDir)) {
                rimraf.sync(global.hostDownloadDir + '/*');
                rimraf.sync(global.hostDownloadDir);
            }
            fs.mkdirSync(global.hostDownloadDir);
            resolve();
        });
    },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    beforeSession: function (/*config, capabilities, specs*/) {
    },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    before: function () {

    },
    /**
     * Gets executed before the suite starts.
     * @param {Object} suite suite details
     */
    //beforeSuite: function (/*suite*/) {
    //},
    /**
     * This hook gets executed _before_ a hook within the suite starts.
     * (For example, this runs before calling `beforeEach` in Mocha.)
     *
     * (`stepData` and `world` are Cucumber-specific.)
     *
     */
    //beforeHook: function (/*test, context/*, stepData, world*/) {
    //},
    /**
     * Hook that gets executed _after_ a hook within the suite ends.
     * (For example, this runs after calling `afterEach` in Mocha.)
     *
     * (`stepData` and `world` are Cucumber-specific.)
     */
    //afterHook: function (/*test, context, { error, result, duration, passed, retries }/*, stepData, world*/) {
    //},
    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     */
    //beforeTest: function (/*test, context*/) {
    //},
    /**
     * Runs before a WebdriverIO command is executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that the command would receive
     */
    //beforeCommand: function (/*commandName, args*/) {
    //},
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object, if any
     */
    //afterCommand: function (/*commandName, args, result, error*/) {
    //},
    /**
     * Function to be executed after a test (in Mocha/Jasmine)
     */
    //afterTest: function (/*test, context, { error, result, duration, passed, retries }*/) {
    //},
    /**
     * Hook that gets executed after the suite has ended.
     * @param {Object} suite suite details
     */
    //afterSuite: function (/*suite*/) {
    //},
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    //after: function (/*result, capabilities, specs*/) {
    //},
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    //afterSession: function (/*config, capabilities, specs*/) {
    //},
    /**
     * Gets executed after all workers have shut down and the process is about to exit.
     * An error thrown in the `onComplete` hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    //onComplete: function (/*exitCode, config, capabilities, results*/) {
    //    rimraf.sync(global.downloadDir);
    //},
    /**
    * Gets executed when a refresh happens.
    * @param {String} oldSessionId session ID of the old session
    * @param {String} newSessionId session ID of the new session
    */
    //onReload: function(/*oldSessionId, newSessionId*/) {
    //},
    /**
     * Cucumber-specific hooks
     */
    //beforeFeature: function (/*uri, feature, scenarios*/) {
    //},
    //beforeScenario: function (/*uri, feature, scenario, sourceLocation*/) {
    //},
    //beforeStep: function (/*uri, feature, stepData, context*/) {
    //},
    //afterStep: function (/*uri, feature, { error, result, duration, passed }, stepData, context*/) {
    //},
    //afterScenario: function (/*uri, feature, scenario, result, sourceLocation*/) {
    //},
    //afterFeature: function (/*uri, feature, scenarios*/) {
    //}
};

if (process.env.DEBUG) {
    config.dockerOptions.options.p.push('5900:5900');
}
exports.config = config;
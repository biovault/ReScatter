const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const { assert } = require('chai');

exports.getDownloadPath = function(file) {
    return path.join(global.hostDownloadDir, file);
};

exports.getGoldPath = function(file) {
    return path.join(global.hostDownloadDir, '..', 'test', 'compare_images', file);
};

const retryTimer = function (lenMs, testFn) {
    setTimeout(() => {
        if (!testFn() ) {
            retryTimer(lenMs, testFn);
        }
        return true;
    }, lenMs);
};

exports.retryTimer = retryTimer;

// Adapted from https://stackoverflow.com/a/47764403
exports.waitForFileExists = function (filePath, timeout, onSuccess, onFailure) {
    let inFileTest = false;
    return new Promise(function (resolve, reject) {

        let masterTimeout = setTimeout(function () {
            watcher.close();
            console.log('Hit timeout waiting for file.');
            onFailure();
            reject(new Error('File did not exists and was not created during the timeout.'));
        }, timeout);

        // If the download is complete the browser closes to file
        // Detect this by trying to open the file as writeable.
        let isFileReady = function() {
            if (inFileTest) {
                return false;
            }
            inFileTest = true;
            try {
                //console.log(`Attempting to open for write: ${filePath}`);
                const stats = fs.statSync(filePath);
                if (stats.size === 0) {
                    inFileTest = false;
                    return false;
                }
                const fd = fs.openSync(filePath, 'r+');
                fs.closeSync(fd);
                clearTimeout(masterTimeout);
                watcher.close();
                onSuccess();
                resolve(true);
                return true;
            } catch (err) {
                // couldn't open
                return false;
            } finally {
                inFileTest = false;
            }
        };
        // does the file already exist
        fs.access(filePath, fs.constants.R_OK, function (err) {
            if (!err) {
                //console.log(`File found at 1st attempt: ${filePath}`);
                // wait for file ready - check each 1/2 second
                if (!isFileReady()) {
                    retryTimer(500, isFileReady.bind(null, onSuccess));
                }
            } else {
                console.log(`File access error : ${err}`);
            }
        });

        let dir = path.dirname(filePath);
        let basename = path.basename(filePath);
        let watcher = fs.watch(dir, function (eventType, filename) {
            //console.log(`Filename: ${filename} Basename: ${basename}`);
            if (eventType === 'rename' && filename === basename) {
                // wait for file ready - check each 1/2 second
                if (!isFileReady()) {
                    retryTimer(500, isFileReady);
                }
            }
        });
    });
};

exports.assertPng = function(comparePath, filePath, maxErrors, msg) {
    console.log(`Loading images for compare: ${comparePath} ${filePath}`);
    const goldBuffer = fs.readFileSync(filePath);
    const goldImage = PNG.sync.read(goldBuffer);
    assert.notEqual(goldImage, undefined, 'Gold image not loaded');
    const replacer = function(key, value) {
        if ( key === 'data') {
            return `Buffer data... length:${value.data.length}`;
        }
        return value;
    };
    console.log(`Gold image ${JSON.stringify(goldImage, replacer)}`);
    const compareBuffer = fs.readFileSync(comparePath);
    const compareImage = PNG.sync.read(compareBuffer);
    assert.notEqual(compareImage, undefined, 'Compare image not loaded');
    console.log(`Compare image ${JSON.stringify(compareImage, replacer)}`);
    const {width, height} = compareImage;
    const {width: widthG, height: heightG} = goldImage;
    assert.strictEqual(widthG, width, 'Image widths must match');
    assert.strictEqual(heightG, height, 'Image heights must match');
    //console.log(`width ${width} height ${height}`);
    const diff = new PNG({width, height});
    const mismatches = pixelmatch(goldImage.data, compareImage.data, diff.data, width, height, {threshold: 0.1});
    assert.isAtMost(mismatches, maxErrors, msg);
    console.log(`PNG Compare done - mismatches: ${mismatches}`);
};

/**
 * Created by baldur on 8/5/15.
 */
import {inflate} from 'pako';
//<Class definition for the DataCache>
let instance = null;
export default class DataCache {
    constructor() {
        if (instance) {
            return instance;
        }
        this.cache = {};
        instance = this;

    }

    /**
     * Make a promise for retrieving data and place it in a promise array
     * Files identified as gz are auto decompressed (only arraybuffer or json are supported compressed)
     * @param promises - an array to push to promise to
     * @param path - the path to get
     * @param responseType - the response type
     * @private
     */
    __makePromise (promises, path, responseType) {
        'use strict';
        if (!this.cache.hasOwnProperty(path)) {
            promises.push(new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest();
                xhr.timeout = 10000; // 10s TODO add to interface
                xhr.open('GET', path, true);
                if (path.endsWith('.gz')) {
                    xhr.responseType = 'arraybuffer';
                } else {
                    xhr.responseType = responseType;
                }
                let self = this;
                xhr.onload = function () {
                    // Handle
                    if (path.endsWith('.gz')) {
                        let compressed = new Uint8Array(this.response);
                        if (responseType === 'json') {
                            self.cache[path] = {'data': JSON.parse(inflate(compressed, {to: 'string'}))};
                        } else {
                            self.cache[path] = {'data': inflate(compressed)};
                        }
                    } else {
                        self.cache[path] = {'data': this.response};
                    }
                    resolve();
                };
                xhr.onerror = function () {
                    console.log('Error retrieving: ' + path +
                        ' status: ' + xhr.statusText + ' response: ' + xhr.responseText);
                    reject({status: xhr.statusText, response: xhr.responseText});
                };
                //console.log("XHR get Data Map: " + this.filePath);
                xhr.send();
            }));
        }
    }

    /**
     * Get files from remote and cache or from cache
     * if already present
     * @param pathAndTypeList - array of objects {path: <siteRelativeURL>, type: <responseType>}
     *         where <responseType> can be any valid XMLHttpRequest.responseType
     * @param callback - called as callback(). The callback is responsible for retrieving
     *          the cached data.
     * @param errorCallback  - optional error callback called as errorCallback(errorObject)
     *          errorObj contains status and response
     */
    loadFiles(pathAndTypeList, callback, errorCallback) {
        'use strict';
        let deferredGets = [];
        let files = [];
        // collect the necessary files into arrays

        // remember to bind to this before calling (with forEach thisArg
        function getPaths(pathAndType) {
            /*jshint validthis:true */
            files.push(pathAndType.path);
            this.__makePromise(deferredGets, pathAndType.path, pathAndType.type);
        }
        pathAndTypeList.forEach(getPaths, this);
        if (deferredGets.length > 0) {
            Promise.all(deferredGets).then(function () {
                callback();
            }).catch(function(errorObj){
                if (errorCallback) {
                    errorCallback(errorObj);
                }
            });
        } else {
            callback();
        }
    }

    /**
     * Get files from remote and cache or from cache
     * if already present. Async (ES7) version of loadFiles
     * @param pathAndTypeList - array of objects {path: <siteRelativeURL>, type: <responseType>}
     *         where <responseType> can be any valid XMLHttpRequest.responseType
     *
     *  return - when all the files are loaded it returns or, in a case of a (network) failure,
     *  it will throw
     */
    async asyncLoadFiles(pathAndTypeList) {
        let deferredGets = [];
        let files = [];
        // collect the necessary files into arrays

        // remember to bind to this before calling (with forEach thisArg
        function getPaths(pathAndType) {
            /*jshint validthis:true */
            files.push(pathAndType.path);
            this.__makePromise(deferredGets, pathAndType.path, pathAndType.type);
        }
        pathAndTypeList.forEach(getPaths, this);
        if (deferredGets.length > 0) {
            return await Promise.all(deferredGets);
        }
        return;
    }

    isInCache(filePath) {
        return this.cache.hasOwnProperty(filePath);
    }

    /**
     * Return a single item from the cache
     * @param filePath
     */
    getFromCache (filePath) {
        return this.cache[filePath].data;
    }

    /**
     * Insert something into the cache. This allows temporary data
     * (from for example embedding jobs)
     * to be retrieved by the usual mechanism even though they are not
     * persistent on the server
     * @param data - the data to be saved
     * @param key - the cache key
     * @param forceOverwrite - if true will overwrite an identical key (default false)
     */
    insertInCache(data, key, forceOverwrite) {
        'use strict';
        let overwrite = (forceOverwrite === undefined) ? false : forceOverwrite;
        if (!overwrite) {
            if (this.isInCache(key)) {
                throw new Error('Trying to overwrite cache without explicit force');
            }
        }
        this.cache[key] = {data:data};
    }

    /**
     * Return a list of items from the cache
     * @param fileList
     * @returns {Array}
     */
    getCachedList (fileList) {
        // private function return the corresponding data in an array
        // retrieve an array of data from the cache
        'use strict';
        let dataArray = [];
        for (let i = 0,len = fileList.length; i < len; i++) {
            dataArray.push(this.cache[fileList[i]].data);
        }
        return dataArray;
    }
}
//</Class definition for the DataCache>

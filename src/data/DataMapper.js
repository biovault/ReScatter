/**
 * Created (migrated to ES6) by baldur on 7/31/15.
 */
/* eslint-disable no-undef */
const nrrdjs = require('nrrd-js');
const ndarray = require('ndarray');
const ndops = require('ndarray-ops');
/* eslint-enable no-undef */
const maps = {mapDict:{}};
export default class DataMapper {
//<Class definition for the DataMapper>
    constructor(filePath) {
        // DataMapper will contain a number of functions to map large
        // dataarrays from the server to compact results
        // Currently supported:
        //      sumColumns
        // .... more to come...
        this.filePath = filePath;
        this.array = undefined;
        this.status = DataMapper.status.NULL;

    }

    static get maps() {
        return maps;
    }

    // Set the data maps that will be produced
    static setDataMaps(dataMaps) {
        DataMapper.maps.mapDict = {};
        if (!dataMaps) {
            ReScatter.utils.warn('No data maps defined');
            return;
        }
        dataMaps.forEach(function(map) {
            DataMapper.maps.mapDict[map.id] =
               new DataMapper(map.filePath);
        });
    }

    static getDataMap = function(id) {
        return DataMapper.maps.mapDict[id];
    };

    // TODO  improve on this with option of user supplied function objects
    /**
     * Enum mapOp determines which mapping is performed given the selection dataPoints and the map Data
     * in addition it determines how the result is passed to the values param of the user supplied mapFn.
     * @readonly
     * @enum {number}
     */
    static get mapOp() {return {
        // undefined: the selection dataPoints are passed to the values param
        SUMROW: 0, /** @property {number}  SUMROW - the rows indicated by dataPoints are summed, passed to values parameter */
        AVGROW: 1, /** @property {number}  AVGROW - the rows indicated by dataPoints are averaged, passed to values parameter */
        SUMCOL: 2, /** @property {number}  SUMCOL - the columns indicated by dataPoints are summed, passed to values parameter */
        AVGCOL: 3, /** @property {number}  AVGCOL - the rows indicated by dataPoints are averaged, passed to values parameter */
        ALLROW: 4, /** @property {number}  ALLROW - values containing 0...n where n is row length -1 */
        ALLCOL: 5, /** @property {number}  ALLCOL - values containing 0...n where n is col length -1 */
        PASSROW: 6,  /** @property {number} PASSROW - pass row 0 (x = 0..sizeX-1 y=0) of the array */
        PASSCOL: 7,  /** @property {number} PASSCOL - pass col 0 (x = 0 y=0..sizeY-1) of the array */
        // The next two return 2D data
        PASSALLROW: 8,  /** @property {number} PASSALLROW - pass all rows for the column indices (x = 0..sizeX-1 y=0) of the array */
        PASSALLCOL: 9  /** @property {number} PASSALLCOL - pass all cols for the row indices (x = 0 y=0..sizeY-1) of the array */
    };}

    static get propAssign() { return {
        // undefined: property is assigned to the point group in common
        POINT: 0 // property assigned point by point
    };}

    // How the incoming selection defines a group of points
    static get groupdef() { return {
        // undefined: dataPoints points are in the group
        ALL: 0 // all points in the target are in the selection group
        //MAPPED: 1 // proint group defined by mapping function
    };}

    // The state of this data mapper - the file has to be loaded in an async operation
    static get status() { return {
        // undefined: dataPoints points are in the group
        NULL: 0 ,// map file not loaded
        BUSY: 1, // map file loading or in use - caller should wait
        AVAIL: 2, // mapper available for use
        FAIL: 3 // get failed
    };}


    // The file must contain a json object defining a rectangular matrix
    // as a number of rows
    // {data:[[n,n,n,...],[n,n,n,....],[n,n,n,...]]}
    setData (filePath) {
        'use strict';
        this.filePath = filePath;
        this.array = undefined;
        this.status = DataMapper.status.NULL;
    }

    // Calling this function returns a promise - chain the appropriate resolver function
    // the supplied data is an array of row indices
    // the columns are summed.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Example_using_new_XMLHttpRequest()
    // for the inspiration for this and how to use it
    // The function is designed to support delayed loading of the DataMapper data
    // to this end if more than one caller is trying to perform a mapping
    // and the data is not available the first performs a GET while the
    // rest wait for the MDataMapper to become available.
    mapData (rowIndices, mapping) {
        'use strict';
        let self = this;

        switch (this.status) {
        case DataMapper.status.NULL: {
            //console.log("Fetching Data Map");
            this.status = DataMapper.status.BUSY;
            let pathAndTypeList = [{path: this.filePath, type: 'arraybuffer'}];
            return new Promise(function (resolve, reject) {
                let callback = function () {
                    let arrayBuffer = ReScatter.dataModel.dataCache.getFromCache(self.filePath);
                    let nrrdfile = nrrdjs.parse(arrayBuffer);
                    self.array = ndarray(nrrdfile.data, nrrdfile.sizes.slice().reverse());
                    self.__resolveMapping(resolve, self, rowIndices, mapping);
                };
                let errorCallback = function (errorObj) {
                    self.status = DataMapper.status.FAIL;
                    console.log('Error retrieving: ' + self.filePath);
                    reject(errorObj);
                };
                ReScatter.dataModel.dataCache.loadFiles(pathAndTypeList, callback, errorCallback);
            });
        }
        case DataMapper.status.BUSY: {
            // wait for AVAIL
            // TODO Handle failure - reject
            let delay = function (resolve/*, reject*/) {
                setTimeout(function () {
                    resolve();
                }, 200);
            };

            return new Promise(function (resolve) {
                let loop = function () {
                    if (self.status === DataMapper.status.AVAIL) {
                        self.__resolveMapping(resolve, self, rowIndices, mapping);
                    } else {
                        return new Promise(delay)
                            .then(loop)
                            .catch(function (e) {
                                console.log('Error in DataMapper delay ' + e);
                            });
                    }
                };
                setTimeout(function () {
                    loop();
                }, 1);
            });
        }
        //setTimeout(self.mapData, 500, rowIndices, mapping);
        case DataMapper.status.AVAIL: {
            // perform operation
            //console.log("Data Map Available");
            this.status = DataMapper.status.BUSY;
            // TODO handle error via reject
            return new Promise(function (resolve/*, reject*/) {
                self.__resolveMapping(resolve, self, rowIndices, mapping);
            });
        }
        }
    }

    __resolveMapping (resolve, self, rowIndices, mapping) {
        let result;
        try {
            result = self.__performMapping(rowIndices, mapping);
        } catch(e) {
            // TODO reject from promise
            console.log('Error in data mapping: ' + e);
        } finally {
            self.status = DataMapper.status.AVAIL;
            resolve(result);
        }
    }

    __performMapping (indices, mapping) {
        switch (mapping) {
        case DataMapper.mapOp.AVGROW:
            return this.averageRows(indices);
        case DataMapper.mapOp.SUMROW:
            return this.sumRows(indices);
        case DataMapper.mapOp.AVGCOL:
            return this.averageCols(indices);
        case DataMapper.mapOp.SUMCOL:
            return this.sumCols(indices);
        case DataMapper.mapOp.ALLROW: {
            let rowLen = this.array.shape[1];
            return this.getIndexArray(rowLen);
        }
        case DataMapper.mapOp.ALLCOL: {
            let colLen = this.array.shape[0];
            return this.getIndexArray(colLen);
        }
        case DataMapper.mapOp.PASSROW:
            return this.passRow(indices);
        case DataMapper.mapOp.PASSCOL:
            return this.passCol(indices);
        case DataMapper.mapOp.PASSALLROW:
            return this.passAllRow(indices);
        case DataMapper.mapOp.PASSALLCOL:
            return this.passAllCol(indices);
        default:
            return this.sumRows(indices);
        }
    }

    getIndexArray (len) {
        let indices = new Array(len);
        for (let i = 0; i < len; i++) {
            indices[i] = i;
        }
        return indices;
    }

    sumRows (rowIndices) {
        // For the given rowIndices sum all the columns in the data
        // and return the result via the callback as an array
        if (!this.array) {
            return([]);
        }
        // This works because TypedArrays are initialized to 0 by definition
        let sumArray = ndarray(new Float32Array(this.array.shape[0]), [this.array.shape[0]]);
        for (let i = 0, len = rowIndices.length; i<len; i++) {
            let curRow = this.array.pick(null, rowIndices[i]);
            ndops.add(sumArray, sumArray, curRow);
        }
        return(Array.prototype.slice.call(sumArray.data));
    }

    averageRows (rowIndices) {
        let totalArray = this.sumRows(rowIndices);
        let div = rowIndices.length;
        for (let i =0, len = totalArray.length; i< len; i++) {
            totalArray[i] = totalArray[i]/div;
        }
        return totalArray;
    }

    sumCols (colIndices) {
        // For the given rowIndices sum all the columns in the data
        // and return the result via the callback as an array
        if (!this.array) {
            return([]);
        }
        // This works because TypedArrays are initialized to 0 by definition
        let sumArray = ndarray(new Float32Array(this.array.shape[1]), [this.array.shape[1]]);
        for (let i = 0, len = colIndices.length; i<len; i++) {
            let curCol = this.array.pick(colIndices[i], null);
            ndops.add(sumArray, sumArray, curCol);
        }
        return(Array.prototype.slice.call(sumArray.data));
    }

    averageCols (colIndices) {
        let totalArray = this.sumCols(colIndices);
        let div = colIndices.length;
        for (let i =0, len = totalArray.length; i< len; i++) {
            totalArray[i] = totalArray[i]/div;
        }
        return totalArray;
    }

    passCol (indices) {
        if (!this.array) {
            return([]);
        }
        let resultArray = new Array(indices.length);
        for (let i =0, len = indices.length; i< len; i++) {
            resultArray[i] = this.array.get(0,indices[i]);
        }
        return resultArray;
    }

    passRow (indices) {
        if (!this.array) {
            return([]);
        }
        let resultArray = new Array(indices.length);
        for (let i =0, len = indices.length; i< len; i++) {
            resultArray[i] = this.array.get(indices[i],0);
        }
        return resultArray;
    }

    passAllCol (indices) {
        if (!this.array) {
            return([]);
        }
        let resultArray = new Array(indices.length);
        for (let i =0, len = indices.length; i< len; i++) {
            let colArray = new Array(this.array.shape[0]);
            for (let j=0; j < this.array.shape[0]; j++) {
                colArray[j] = this.array.get(j,indices[i]);
            }
            resultArray[i] = colArray;
        }
        return resultArray;
    }

    passAllRow (indices) {
        if (!this.array) {
            return([]);
        }
        let resultArray = new Array(indices.length);
        for (let i =0, len = indices.length; i< len; i++) {
            let rowArray = new Array(this.array.shape[1]);
            for (let j=0; j < this.array.shape[1]; j++) {
                rowArray[j] = this.array.get(indices[i], j);
            }
            resultArray[i] = rowArray;
        }
        return resultArray;
    }
}

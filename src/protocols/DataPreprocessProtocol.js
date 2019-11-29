import * as protocol from 'protoduck';

/**
 * DataPreprocessProtocol needs to implemented for each supported analysis.
 * To perform an re-analysis (i.e. create a new plot) based on a subset of the original data the
 * point values will need to be subsampled (based on the chosen row or column indices)
 * and any relevant normalization will be performed.
 * Two sets of data need to be produced (these may or may not be the
 * same data depending on the analysis)
 *  1.: The input to the analysis.
 *  2.: The display data
 * The protocol supports two functions that produce these.
 */
const DataPreprocessProtocol = protocol.define([
    'operationGuid',
    'dataCache',
    'recalcConfig',
    'dataMap',
    'selectionIndexes',
    'selectionId'], {
    /**
     * operationGuid - a guid string that can be used in combination to create unique cache entries
     * dataCache - a Rescatter DataCache object used to retrieve original data
     * recalcConfig - the recalculation config for a layout
     * rawDataList - a list or one of more keys to the raw input data via the global cache
     * selectionIndices - a list of indices indicating the rows or columns
     * selectionId - a string representing the selection group
     *
     * side effect - save expression data in cache with suitable keys
     * returns -  array of [name, value] objects containing the data for the jobs
     */
    getRecalculationData: [
        'operationGuid',
        'dataCache',
        'recalcConfig',
        'dataMap',
        'selectionIndexes',
        'selectionId'],
    /**
     * Return an object mapping the dataMap keys to new
     * cache data (this will be the subselected and preprocessed data
     * for the new plots.
     * If any data can be reused without preprocessing then simply
     * omit it from the map. The old data will be inherited.
     */
    getDataMap: []

});


export default DataPreprocessProtocol;

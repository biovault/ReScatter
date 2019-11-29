/**
 * Created by baldur on 12/9/15.
 * renamed and ported to ES6 8/8/2017
 */

/**
 * @classdesc
 * This provides a central point to access the loaded Plot Data
 * including per-point meta-data (i.e. data other than the x-y coords)
 * that is associated with each plot
 *
 * One of the main functions of the class is to separate plot versus
 * plot group (as defined by selectionOut id) properties.
 * Each plot may have individual properties. Groups of plots (defined
 * by the same selectionOut id ) have common selection properties.
 * Users enter selection do this via the selection properties,
 * mouse interactions on the plot use the plot properties.
 */
const uuid4 = require('uuid/v4');
export default class PlotDataModel {
    constructor() {
        "use strict";
        this.layoutDef = undefined;
        this.props = {}; // meta-data indexed by plot id
        this.plotDefs = {}; // plot definition indexed by plot id
        this.selectionDefs = {}; //indexed by selectionId
        this.selectionPropKeys = {}; // indexed by selectionOut id
        this.selectionProps = {}; // indexed by selectionOut id
        this.dataCache = new ReScatter.data.DataCache();
    }

    /**
     * Selections (mouse-over, drawn etc) in a tSNE plot choose rows or columns in the
     * underlying data. While this information is implicitly encoded in the (plot-specific) mapping functions
     * it needs to be recorded for generating new tSNE plots based on sub-selections.
     * @readonly
     * @enum {number}
     */
    static get axis() { return {
        // undefined: the selection dataPoints are passed to the values param
        ROW: 0, /** @property {number}  ROW - the selection number is a zero-indexed row number */
        COL: 1, /** @property {number}  ROW - the selection number is a zero-indexed column number */
    };}

    // The data model for storing data properties
    // comprises ordered an id to identify the property set.
    // The props are an ordered array of dicts containing the values
    // associated with that index.

    // Note that data props are indexed using the selectionOut id.
    // Identical selections will have identical properties
    /**
     * Asynchronously load the data associated with the layoutDef into the
     * cache and call the callback
     * @param layoutDef - the layout configuration
     * @param {function(Array, Array  Array, Array)} callback
     *  the callback for success, received lists of the files loaded and
     *  an index into the pointFiles for the plots in the layout
     *  pointFiles, propFiles, renderPlotIndexes, ontFiles
     */
    loadLayoutDefData (layoutDef, callback) {
        "use strict";
        this.layoutDef = layoutDef;
        let pointFiles = [];
        let propFiles = [];
        let renderPlotIndexes = [];
        let ontFiles = [];

        let pathAndTypeList = [];
        // space layouts have no data and are marked as such by a -1 data index
        for (let plotDef of layoutDef.plots) {
            if (!ReScatter.layoutManager.isSpaceLayout(plotDef)) {
                pointFiles.push(plotDef.data.points);
                pathAndTypeList.push({path: plotDef.data.points, type: 'json'});
                propFiles.push(plotDef.data.props);
                pathAndTypeList.push({path: plotDef.data.props, type: 'json'});
                renderPlotIndexes.push(pointFiles.length - 1);
            } else {
                renderPlotIndexes.push(-1);
            }
        }
        if (layoutDef.ontologies) {
            for (let ont of layoutDef.ontologies) {
                ontFiles.push(ont.ontology_file);
                pathAndTypeList.push({path: ont.ontology_file, type: 'json'});
            }
        }
        this.dataCache.loadFiles(pathAndTypeList, function() {
            callback(pointFiles, propFiles, renderPlotIndexes, ontFiles)
        });
    }

    putDataProps (plotDef, props) {
        this.props[plotDef.id] = props;
        this.plotDefs[plotDef.id] = plotDef;
        this.selectionProps[plotDef.selections.selectionOut] = props;
        this.selectionPropKeys[plotDef.selections.selectionOut] = Object.keys(props);
        this.selectionDefs[plotDef.selections.selectionOut] = plotDef;
    }

    getSelectionPropAtIndex (id, index, propName, defaultValue) {
        "use strict";
        let props = this.selectionProps[id];
        if (props === undefined) {
            return defaultValue;
        }
        return props[propName][index];
    }

    getUniqueSelectionPropValues (id, prop) {
        let props = this.selectionProps[id];
        let values = props[prop];
        return values.filter(function(value, index, self) {
            return self.indexOf(value) === index;
        });
    }

    getSelectionPrimaryProp (id) {
        return this.selectionDefs[id].format.primary;
    }

    getAllSelectionPropsAtIndex (id, index) {
        "use strict";
        let allProps = {};
        let propKeys = this.selectionPropKeys[id];
        propKeys.forEach(function(key) {
            allProps[key] = this.selectionProps[id][key][index];
        }, this);
        return allProps;
    }

    getSelectionPropKeys (id) {
        "use strict";
        return Object.keys(this.selectionProps[id]);
    }

    // Reverse lookup points based on prop values
    getSelectionIndexes (selectionId, propName, propVal, caseInsensitive) {
        let props = this.selectionProps[selectionId];
        let ci = caseInsensitive ? true: false;
        let indexes = [];
        let test = String(propVal).toUpperCase();
        // could save an uppercase copy on first uppercase usage for speed.
        props[propName].forEach(function(val, index) {
            if (ci) {
                if ((String(val).toUpperCase() === test)) {
                    indexes.push(index);
                }
            } else if (val === propVal) {
                indexes.push(index);
            }
        });

        return indexes;
    }

    // As above but for cases where only one index is expected and no case check
    getSelectionIndex (selectionId, propName, propVal) {
        let props = this.selectionProps[selectionId];
        let indexes = [];
        let test = typeof(props[propName][0]) === "number" ? parseInt(propVal): propVal;
        let index = props[propName].indexOf(test);
        if (index > 0) {
            indexes.push(index);
        }
        return indexes;
    }

    destroy () {
        this.props = {}; // indexed by plot id
        this.plotDefs = {}; // indexed by plot id
        this.selectionDefs = {}; //indexed byy selectionId
        this.selectionPropKeys = {}; // indexed by selectionOut id
        this.selectionProps = {}; // indexed by selectionOut id
        this.dataCache = undefined;
    }

    /**
     * Get a sub-selection of the properties for the given plot key. The indices are
     * simple indexes into the prop arrays. Returns an object containing the props.
     * @param plotId - the plot id
     * @param selectionId - if the selectionId matches the plot selectionOut then a subset is returned
     *                      otherwise the complete set of props.
     * @param selectionIndices - indices to choose - only if the selectionOutKey matches
     */
    getPlotPropSubSelection(plotId, selectionId, selectionIndices) {
        "use strict";
        let props = this.props[plotId];
        let plotDef = this.plotDefs[plotId];
        // If the selection is not target at this plot return all props
        if (plotDef.selections.selectionOut !== selectionId) {
            return {voxel_props: props};
        }
        // otherwise get the subselection.
        let subProps = {};
        // for-of actually ES6 but is already in all main browsers
        for (let k of Object.keys(props)) {
            subProps[k] = [];
            selectionIndices.forEach(function(v) {
                subProps[k].push(props[k][v]);
            })

        }
        return {voxel_props: subProps};
    }

    /**
     *
     * @param selectionId - the selection used to subset. If it matches a predefinedSelection target id
     *  then we need a subselection. Otherwise the selection indices are used to create a
     *  subset of the original selection that is pushed into the cache.
     * @param selectionIndices - the selected indices into the data.
     * @param {function(Array)} callback - is called with an array of predefined selections
     * @param errorCallback
     */
    getPredefinedSelectionsSubSelection(selectionId, selectionIndices, callback, errorCallback) {
        "use strict";
        // the null case - no predefines
        if (!this.layoutDef.predefinedSelections) {
            callback(undefined);
        }
        let predefinedSubselectionsConfig = [];
        let pathAndTypeList = [];
        let replaceIndexes = [];
        let index = 0;
        for (let selection of this.layoutDef.predefinedSelections) {
            // Perform a lightweight clone of the predefined selection
            // section in the plot config.
            // If the targetId of the predefinedSelection in the layout configuration
            // matches the selection then a sub selection needs to be performed.
            predefinedSubselectionsConfig.push(JSON.parse(JSON.stringify(selection)));
            if (selectionId === selection.targetId) {
                pathAndTypeList.push({path: selection.preselect, type: 'json'});
                replaceIndexes.push(index);
            }
            index++;
        }
        if (pathAndTypeList.length === 0) {
            callback(predefinedSubselectionsConfig);
        }
        let self = this;
        // Based on the selection indices redo the subselections and push
        // them into the cache
        let remakeSubselections = function() {
            pathAndTypeList.forEach(function(pathAndType, subIndex) {
                let newPredefSelections = [];
                // Predefined selections are an array
                let predefSelections = self.dataCache.getFromCache(pathAndType.path);
                // TODO - fix this is a bug they should always be json
                if (typeof(predefSelections) === 'string') {
                    predefSelections = JSON.parse(predefSelections);
                }
                for (let predefSelection of predefSelections) {
                    // Each array member will be subselected others will be
                    // cloned
                    let newSelection = {};
                    let selectionKeys = Object.keys(predefSelection);
                    let arrayTypeKeys = []; // except dataPoints key
                    for (let key of selectionKeys) {
                        if (predefSelection[key] instanceof Array) {
                            if (key !== 'dataPoints') {
                                arrayTypeKeys.push(key);
                            }
                            newSelection[key] = [];
                        } else {
                            newSelection[key] = JSON.parse(JSON.stringify(predefSelection[key]))
                        }
                    }
                    // The index key in the predefined selection is called dataPoints
                    selectionIndices.forEach(function (val, index) {
                        let indexInPredef = predefSelection.dataPoints.indexOf(val);
                        if (indexInPredef !== -1) {
                            newSelection.dataPoints.push(index);
                            for (let otherArrayKey of arrayTypeKeys) {
                                newSelection[otherArrayKey].push(predefSelection[otherArrayKey][indexInPredef]);
                            }
                        }

                    });
                    // if the selection is empty don't record it
                    if (newSelection.dataPoints.length > 0) {
                        newPredefSelections.push(newSelection)
                    }
                }
                let replaceIx = replaceIndexes[subIndex];
                let dataName = uuid4();
                this.dataCache.insertInCache(newPredefSelections, dataName, true);
                predefinedSubselectionsConfig[replaceIx]['preselect'] = dataName;
            }, self);
            callback(predefinedSubselectionsConfig);
        };
        this.dataCache.loadFiles(pathAndTypeList, remakeSubselections);

    }
};

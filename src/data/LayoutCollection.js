// Implementation note: LayoutCollection is a singleton based on the pattern in
// Stoyan Stefanov's JavaScript Patterns 2010 pg 145
// Calling new on LayoutCollection() returns a single instance
// the prototype can be extended as shown.
//<Class definition for the LayoutCollection>

let instance = null;

/**
 * Maintains a list of data layouts (layouts of plots).
 * The layouts are an Array
 * Handles both the pre-defined and those resulting from tSNE jobs
 * Provide cloning functionality to create new layouts based on existing ones.
 * @param layoutData - the first instance should be initialized with the user defined array of layouts
 * @returns {LayoutCollection singleton}
 * @constructor
 */
const PubSub = require('pubsub-js');
export default class LayoutCollection {
    constructor(layoutData) {
        if (instance) {
            return instance;
        }

        this.layoutData = layoutData;
        this.ids = []; // The unique ids for all layouts
        this.__updateIds();
        this.pubsubid = 'DYNAMICCONTENT_' + Date.now();
        instance = this;
        return instance;

    }

    /**
     * Getnext numerical id to be used for a new layout
     * @returns {*} integer id
     */
    getNextId () {
        "use strict";
        if (this.ids.length > 0) {
            return this.ids.slice(-1)[0] + 10;
        }
        return 10;
    }

    /**
     * Add a layout to this layout collection
     * @param layout - a layout, usually cloned from and existing layout
     */
    addLayout (layout) {
        "use strict";
        if (this.ids.indexOf(layout.id) !== -1) {
            throw new Error('Plot data plot ids must be unique');
        }
        this.layoutData.push(layout);
        this.__updateIds();
        PubSub.publish(this.pubsubid, {layouts: this});
    }

    /**
     * Remove a plot data item (send a notification)
     * @param id
     */
    removeLayout (id) {
        this.layoutData = this.layoutData.filter(function(plot) {
            "use strict";
            return plot.id !== id;
        });
        this.__updateIds();

    }

    cloneLayout(layout) {
        "use strict";
        let clone = JSON.parse(JSON.stringify(layout));
        // Special handling for elements that may contain functions
        // these are not handled by the stringify clone technique.
        // For all plots and chropleth entries
        // the following can be functions:
        // In plots:
        //      plotProps: any entry may be a function
        // In plots & choropleths:
        //      selectionIn: all entries are functions
        //      dynamicSelectionIn: all entries are functions
        if (layout.selectionConfigs) {
            clone.selectionConfigs = Array.from(layout.selectionConfigs);
        }
        if (layout.recalculation) {
            clone.recalculation = layout.recalculation;
        }
        for (let i = 0; i < layout.plots.length; i++) {
            let sourcePlot = layout.plots[i];
            let destPlot = clone.plots[i];
            // spacer plots are empty otherwise.
            if (destPlot.layoutTarget === ReScatter.control.LayoutController.LayoutTarget.SPACER) {
                continue;
            }
            for (let propKey of Object.keys(sourcePlot.format)) {
                if (typeof(sourcePlot.format[propKey]) === 'function') {
                    destPlot.format[propKey] = sourcePlot.format[propKey];
                }
            }

            // For now just (reference) copy the entire mapping object
            if (!destPlot.selections) {
                destPlot.selections = {};
            }

            // Plots can have selectionIn/dynamicSelectionIn or switchableSelections
            if (sourcePlot.selections.selectionIn) {
                destPlot.selections.selectionIn = {};
                for (let selKey of Object.keys(sourcePlot.selections.selectionIn)) {
                    destPlot.selections.selectionIn[selKey] = sourcePlot.selections.selectionIn[selKey];
                }
            }
            if (sourcePlot.selections.dynamicSelectionIn) {
                destPlot.selections.dynamicSelectionIn = {};
                for (let selKey of Object.keys(sourcePlot.selections.dynamicSelectionIn)) {
                    destPlot.selections.dynamicSelectionIn[selKey] = sourcePlot.selections.dynamicSelectionIn[selKey];
                }
            }
            if (sourcePlot.selections.switchableSelections) {
                destPlot.selections.switchableSelections = sourcePlot.selections.switchableSelections;
            }
        }
        if (layout.choropleths) {
            for (let i = 0; i < layout.choropleths.length; i++) {
                let sourceChoropleth = layout.choropleths[i];
                let destChoropleth = clone.choropleths[i];
                // for now just (reference) copy the entire mapping object
                for (let selKey of Object.keys(sourceChoropleth.selectionIn)) {
                    destChoropleth.selectionIn[selKey] = sourceChoropleth.selectionIn[selKey];
                }
                for (let selKey of Object.keys(sourceChoropleth.dynamicSelectionIn)) {
                    destChoropleth.dynamicSelectionIn[selKey] = sourceChoropleth.dynamicSelectionIn[selKey];
                }
            }
        }
        return clone;
    }

    /**
     * A factory for creating and adding new layouts based on existing ones
     * @param sourceId - id of the layout to copy
     * @param title - title to assign to the new layout
     * @param description - description to assign to the new layout
     * @param plotMap - x-y coordinates for plots - indexed by plot id.
     * @param propMap - x-y coordinates for plot meta data - indexed by plot id.
     * @param newLayoutDataMap - a new map containing an id mapped to a data path
     * @param selectionId - the selectionOut id (group) used to make this layout
     * @param selectionIndices - the point indices in the selection
     */
    addDerivedLayout (sourceId, title, description, plotMap, propMap, newLayoutDataMap, selectionId, selectionIndices) {
        "use strict";
        let source = this.layoutData.filter(function(plot) {
            return plot.id === sourceId;
        });
        if (source.length !== 1) {
            throw new Error('No plot found to clone');
        }
        let clone = this.cloneLayout(source[0]);
        clone.id = this.getNextId();
        clone.title = title;
        clone.description = description;

        Object.keys(plotMap).forEach(function(plotId) {
            let insertPlot = clone.plots.find(function(plot) {
                return plot.id === plotId;
            });
            insertPlot.data.points = plotMap[plotId];
            insertPlot.data.props = propMap[plotId];
        });

        let dataMaps = [];
        for (let key of Object.keys(newLayoutDataMap)) {
            let map = {id: key, filePath: newLayoutDataMap[key]};
            dataMaps.push(map);
        }
        clone.dataMaps = dataMaps;
        let self = this;
        let updatePredefs = function(newPredefConfig) {
            if (!newPredefConfig) {
                self.addLayout(clone);
            }
            clone.predefinedSelections = newPredefConfig;
            self.addLayout(clone);
        };
        ReScatter.dataModel.getPredefinedSelectionsSubSelection(selectionId, selectionIndices, updatePredefs)
    }

    __updateIds() {
        let ids = [];
        this.layoutData.forEach(function(plot) {
            if (ids.indexOf(plot.id) > -1) {
                throw new Error('Plot data plot ids must be unique');
            }
            if (typeof(plot.id) !== 'number') {
                throw new Error('Plot ids must be numeric');
            }
            ids.push(plot.id);
        });
        ids.sort(function(a,b) {return a - b; });
        this.ids = ids;
    }

    getLayoutConfig() {
        "use strict";
        return this.layoutData;
    }
};


//</Class definition for the LayoutCollection>

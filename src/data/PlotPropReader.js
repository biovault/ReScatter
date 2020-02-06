/**
 * Created by bvanlew on 15-3-18.
 *
 * Refactored code from the PixijsPlotController.
 * This code is non specific and is simply a way of retrieving plot related
 * property data based om generic property names and point  point indexes.
 * The user configures properties, point indexes and access functions

 */

export default class PlotPropReader {
    /**
     * Create a reader using the given information
     * @param props - an object containing named arrays of properties
     *                  one per plot point
     * @param plotFormat - an object containing a mapping between the generic
     *                  either literal property values or indexing into
     *                  the plot meta data (plotFormat) to retrieve a value
     *
     *                  The generic property names are as follows:
     *                  color : get point color
     *                  id: get a unique point id
     *                  symbol: get a value that can be used to annotate the point
     *                  shape: The point shape to use in a plot
     *                  size: The diameter of the plot point sprite
     *                  background: Background color for a plot
     */
    constructor(props, plotFormat) {
        this.props = props;
        this.propKeys = Object.keys(props);
        this.plotFormat = plotFormat;
    }

    /**
     * Use the plotFormat (in the plot configuration) and meta-data defined
     * for an indexed plot point to get a display property for that point.
     *
     * If the propName is not in plotFormat look it up directly in the the point
     * meta-data. If it is defined in plot props perform one of the following depending
     * on the type of entry in plotFormat
     * plotFormat entry is:
     *      object: get the value from the object and looks up the meta-data with it
     *      function: execute the function with the pont meta-data as argument
     *      string: use the string to select an entry from the meta-data for the point
     *      other: (e.g number) use the value from plotFormat
     * @param index - point and point meta-data index
     * @param propName - the plot property to set via the definition in the plotFormat
     * @param defaultValue - if propName not defined in plotFormat or in the point
     *                  meta-data use this default
     * @returns {*}
     */
    getPlotProp (index, propName, defaultValue) {
        'use strict';
        let prop = this.getAllPropsAtPoint(index);
        switch (typeof(this.plotFormat[propName])) {
        case 'undefined': // Direct
            if (prop[propName]) {
                return prop[propName];
            } else {
                return defaultValue;
            }
            // eslint-disable-next-line no-unreachable
            break;

        case 'object': //Mapped
            return prop[this.plotFormat[propName[propName]]];

        case 'function': //Function
            return this.plotFormat[propName](prop);

        case 'string':
            return prop[this.plotFormat[propName]];

        default: //Literal
            return this.plotFormat[propName];
        }
    }

    getColor (index) {
        'use strict';
        return this.getPlotProp(index, 'color', 0x6C7B8B);
    }

    getId (index) {
        'use strict';
        return this.getPlotProp(index, 'id', '');
    }

    getSymbol (index) {
        'use strict';
        return this.getPlotProp(index, 'symbol', '');
    }

    getShape (index) {
        'use strict';
        return this.getPlotProp(index, 'shape', 'circle');
    }

    getSize (index) {
        'use strict';
        return this.getPlotProp(index, 'size', 3);
    }

    getGroup (index) {
        'use strict';
        return this.getPlotProp(index, 'group', undefined);
    }

    getPrimaryProp () {
        'use strict';
        return this.getPlotProp(0, 'primary', undefined);
    }

    getBackgroundColor() {
        'use strict';
        return this.getPlotProp(0, 'background', 0x000000);
    }

    getAllPropsAtPoint (index) {
        'use strict';
        let prop = {};
        let self = this;
        this.propKeys.forEach(function(key) {
            prop[key] = self.props[key][index];
        });
        return prop;
    }

    // Reverse lookup points based on prop values
    getPointIndexFromProp (propName, propVal, caseInsensitive) {
        //let start = 0;
        let ci = caseInsensitive ? true: false;
        let indexes = [];
        this.props[propName].forEach(function(val, index /*, array*/) {
            if (ci) {
                if ((String(val).toUpperCase() === String(propVal).toUpperCase())) {
                    indexes.push(index);
                }
            } else if (val === propVal) {
                indexes.push(index);
            }
        });
        //while ((start = this.props[propName].indexOf(propVal, start)) !==-1) {
        //    indexes.push(start);
        //    start = start + 1;
        //}
        return indexes;
    }
}

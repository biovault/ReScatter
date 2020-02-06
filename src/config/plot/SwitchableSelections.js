/**
 * Created by bvanlew on 28-6-17.
 */
/**
* @class SwitchableSelections - a class to hold and retrieve the
 * switchable display effect
 * mappings that are used when a selection is drawn onto a plot.
 */
/**
 *
 * @param mappingData - a dictionary (object) of mapping objects
 * @constructor
 */
export default class SwitchableSelections{
    constructor(configNames, mappingData) {
        this.mappings = mappingData;
        this.configNames = configNames;
    }

    /**
     * @function newFromPlotInfo - create a SwitchableSelections from
     *            plotInfo that has the old style definition
     * @param plotInfo - an old style (with a single selectionIn and dynamicSelectionIn at top level) plotDefinition
     * @returns {SwitchableSelections}
     */
    static newFromPlotInfo(plotInfo) {
        return new SwitchableSelections(
            ['Default'], {
                'Default': {
                    selectionIn: plotInfo.selections.selectionIn,
                    dynamicSelectionIn: plotInfo.selections.dynamicSelectionIn
                }
            }
        );
    }

    getSelectionMapping(name) {
        return this.mappings[name].selectionIn;
    }

    getDynamicSelectionMapping(name) {
        return this.mappings[name].dynamicSelectionIn;
    }
}


/**
 * Centralizes and abstracts access to individual plot layouts.
 * Handle layout defaults.
 * Provides facilities to clone (complex) layouts.
 */

import PlotDataModel from './PlotDataModel';
import DataMapper from './DataMapper';
import PixiPlotController from '../control/plot/PixijsPlotController';
import ChoroplethLoader from '../control/choropleth/ChoroplethLoader';
import SwitchableSelections from '../config/plot/SwitchableSelections';
import LayoutController from '../control/layout/LayoutController'

const legalize = require('../modules/legalize.js');

const filePathRegExp = /^[\.|\.\.|/][\w/\.]*$/;
// very naive URL detector - only really checking http(s)://
const urlRegExp = /^https?:\/\/[\S]+$/

const fileOrUrlRegexp = RegExp(filePathRegExp.source + "|" + urlRegExp.source);
/**
 * Schema mapping keys to data files for the point data
 * @type {{id: *, filePath: *}}
 */
const dataMapSchema = {
    id: legalize.string().minLength(1).required(),
    filePath: legalize.string().minLength(1).required(),
};

// plotProp supports a range op possible types each with a special action
const plotPropAllowedTypes = [
    legalize.object(),
    legalize.string(),
    legalize.func().length(1),
    legalize.number()
];

/**
 * Schema for the default properties applied to a scatter plot
 * @type {{color: *[], id: *[], symbol: *[], shape: *[], size: *[], group: *[], primary: *[], background: *[]}}
 */
const plotFormatSchema = {
    color: plotPropAllowedTypes,
    id: plotPropAllowedTypes,
    symbol: plotPropAllowedTypes,
    shape: plotPropAllowedTypes,
    size: plotPropAllowedTypes,
    group: plotPropAllowedTypes,
    primary: plotPropAllowedTypes,
    background: plotPropAllowedTypes
};

const dataPreprocessSchema = {
    preprocessPlugin: legalize.string().required(),
    basemapSelections: legalize.object().pattern([/\w+/, [...Object.values(PlotDataModel.axis)]]),
};


const analysisSchema = {
    inputData: legalize.string().required(),
    targetPlotId: legalize.string().required(),
    parameters: legalize.object().keys({
        calcAxis: legalize.number().required().valid(...Object.values(PlotDataModel.axis)),
        algorithmParams: legalize.object().pattern(
            [/^[\w/\.]+$/,
                legalize.alternatives(
                    legalize.number().required(),
                    legalize.bool().required())
            ]) // these are algorithm specific parameters which should be checked in the plugin
    })
};

const analysisRecalculationSchema = {
    baseDataMaps: legalize.array().includes(dataMapSchema).required(),
    dataAnalysis: legalize.object().keys({
        dataPreprocess: dataPreprocessSchema,
        analysisPlugin: legalize.string().required(),
        analyses: legalize.object().pattern([/^[\w/\.]+$/, analysisSchema]),
    })
};

/**
 * Schema for the the recalculation of a plot from a selection.
 * @type {{data: *, selectionAxis: *, calcAxis: *}}
 */
const recalculationSchema = {
    data: legalize.string().required(), // must be an id from the dataMaps array
    selectionAxis: legalize.object().pattern([/\w+/, [...Object.values(PlotDataModel.axis)]]),
    calcAxis: legalize.number().required().valid(...Object.values(PlotDataModel.axis)),
    parameters: legalize.any() // these are algorithm specific parameters which should be checked in the plugin
};

/**
 * Schema for the recalculation of choropleths - actually only sub sampling
 * @type {{data: *, selectionAxis: *}}
 */
const choroplethRecalculationSchema = {
    data: legalize.string().required(), // must be an id from the dataMaps array
    selectionAxis: legalize.object().pattern([/\w+/, [...Object.values(PlotDataModel.axis)]]),
};

/**
 * The configuration for the property calculation pipeline
 * @type {{propAssign: *, mapOp: *, mapFn: *}}
 */
const calculatePropSchema = {
    propAssign: legalize.number().valid(...Object.values(DataMapper.propAssign)).optional(),
    mapOp:  legalize.number().valid(...Object.values(DataMapper.mapOp)).optional(),
    // max length is choropleth - should split this
    mapFn: legalize.func().optional() //.minLength(3).maxLength(6)
};

/**
 * The properties that can be changed as the results of incoming selections
 * @type {{dataMap: *, propMap: {color: {propAssign: *, mapOp: *, mapFn: *}, size: {propAssign: *, mapOp: *, mapFn: *}, group: {propAssign: *, mapOp: *, mapFn: *}, effects: {propAssign: *, mapOp: *, mapFn: *}}}}
 */
const selectionMapSchema = {
    dataMap: legalize.string().required(),
    propMap: legalize.object().keys({
        color: calculatePropSchema,
        size:  calculatePropSchema,
        group: [calculatePropSchema, {}],
        effects:  legalize.array().includes(['O', 'X']).optional() // point can be either a filled dot (default), a circle or and X
    }).required()
};

/**
 * Schema for handling transitive selections
 * @type {{propFilter: {mapFn: *}}}
 */
const transitiveSelectionMapSchema = {
    propFilter: legalize.object().keys({
        mapFn: legalize.func().length(2)
    }).required()
};

const selectionInSchemas = legalize.alternatives(selectionMapSchema, transitiveSelectionMapSchema);

const plotDataSchema = {
    points: legalize.string().match(filePathRegExp),
    props: legalize.string().match(filePathRegExp),
};

const plotSelectionSchema = {
    selectionOut: legalize.string(),
    dynamicSelectionOut: legalize.string(),
    // **start Incoming selections
    // either using the object (if the behaviour is switchable
    switchableSelections: legalize.object().type(SwitchableSelections),
    // or
    // by defining the two possible incoming selections. Allow for different behaviour
    // between mouse-over (dynamic) and permanent selections
    selectionIn: legalize.object().pattern([/^[\w/\.]+$/, selectionInSchemas]),
    dynamicSelectionIn: legalize.object().pattern([/^[\w/\.]+$/, selectionInSchemas]),
    // ** end Incoming selections
    selectionDefaults: {
        numNeighbours: legalize.number().integer().min(0),
        selectOver: legalize.number().valid(...Object.values(PixiPlotController.SelectionEnum)).required(),
        mouseOverExcludeSeed: legalize.bool()
    }
};

const plotSchema = {
    id: legalize.string().minLength(1),
    layoutTarget: legalize.number().valid(...Object.values(LayoutController.LayoutTarget)).required(), // one of ReScatter.control.LayoutController.LayoutTarget
    data: plotDataSchema,
    format: plotFormatSchema,
    selections: plotSelectionSchema,
    recalculation: recalculationSchema,
};


const choroplethSchema = {
    id: legalize.string().minLength(1),
    // TODO allow either a plugin or an internal type
    plugin: legalize.string().minLength(1).optional(),
    type: legalize.number().valid(...Object.values(ChoroplethLoader.LoaderType)).optional(),
    svgTemplate: /^.*<svgid>.*$/,
    thumbnailTemplate: /^.*<svgid>.*$/,
    svgList: legalize.array().minLength(0).includes(/^[\w/\.]+$/),
    region_ids: /^[\w/\.]+$/,
    preselect: legalize.array().minLength(0).includes(/^[\w/\.]+$/), //selected from svgList
    props: /^[\w/\.]+$/,
    dynamicSelectionOut: legalize.string().minLength(1),
    recalculation: choroplethRecalculationSchema,
    switchableSelections: legalize.object().type(SwitchableSelections),
    // or
    // by defining the two possible incoming selections. Allow for different behaviour
    // between mouse-over (dynamic) and permanent selections
    selectionIn: legalize.object().pattern([/^[\w/\.]+$/, selectionInSchemas]),
    dynamicSelectionIn: legalize.object().pattern([/^[\w/\.]+$/, selectionInSchemas]),
    // ** end Incoming selections
    popupAttributeList: legalize.array().minLength(1).includes(/^.+$/)
};

const ontologySchema = {
    id: legalize.string().minLength(1),
    ontology_file: filePathRegExp,
    dynamicSelectionOut: legalize.string().minLength(1),
    openId: legalize.array().includes(legalize.number(), legalize.string())
};

const predefinedSelectionsSchema = legalize.array().includes(
    {
        preselect: legalize.string().match(filePathRegExp).required(),
        id: legalize.string().minLength(1).required(),
        title: legalize.string().minLength(1).required(),
        description: legalize.string().minLength(1).required(),
        targetId: legalize.string().minLength(1).required(),
    }
);

const layoutConfigSchema = {
    id: legalize.number().min(0).integer().required(),
    title: legalize.string().minLength(1).required(),
    ontology: legalize.string().minLength(1),
    description: legalize.string().minLength(1).required(),
    dataMaps: legalize.array().includes(dataMapSchema).required(),
    recalculation:  analysisRecalculationSchema,
    // required for switchableSelections in the plots
    selectionConfigs: legalize.array().minLength(1).includes(/^.+$/),
    plots: legalize.array().includes(plotSchema).required(),
    choropleths: legalize.array().length(1).includes(choroplethSchema),
    ontologies: legalize.array(ontologySchema),
    predefinedSelections: legalize.array(predefinedSelectionsSchema),
};

const tutorialConfigSchema = {
    title: legalize.string().minLength(1),
    location: fileOrUrlRegexp,
};

const siteConfigSchema = {
    SiteTitle:legalize.string().minLength(1).required(),
    Layouts: legalize.array().minLength(1).includes(layoutConfigSchema).required(),
    Tutorials: legalize.array().includes(tutorialConfigSchema).optional()
};

export default class LayoutSiteConfig {
    constructor(siteConfig) {
        this.unvalidatedSiteConfig = siteConfig;
        this.schema = siteConfigSchema;
        this.validatedConfig;
    }

    __validateSiteConfig() {
        let result = legalize.validate(this.unvalidatedSiteConfig, this.schema, {
            allowUnknown: true,
            warnUnknown: false
        });
        if (!result.error && !result.warnings) {
            this.validatedConfig = result.value;
        } else {
            let numErrs = result.error? result.error.length: 0;
            let numWarns = result.warnings? result.warnings.length: 0;
            let errorMessage = 'Errors: ' + numErrs +  '\n\n ' + JSON.stringify(result.error).replace('/},{/g','},\\n\\n{') +
                '\n\nWarnings: ' + numWarns + '\n\n ' + JSON.stringify(result.warnings).replace('/},{/g','},\\n\\n{');
            window.alert(errorMessage)
        }
    }

    get siteConfig() {
        if (!this.validatedConfig) {
            // BvL 2 March 2019 disable config validation due to problems with legalizejs
            //this.__validateSiteConfig();
            this.validatedConfig = this.unvalidatedSiteConfig;
        }
        return this.validatedConfig;
    }
}

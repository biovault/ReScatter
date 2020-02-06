const Joi = require('@hapi/joi');
// eslint-disable-next-line no-unused-vars
console.log('require rescatter');
const ReScatter = require('../../framework/rescatter.js');

/**
 * Centralizes and abstracts access to individual plot layouts.
 * Handle layout defaults.
 * Provides facilities to clone (complex) layouts.
 */

// Give more help for enum based valids - display the keys (Joi default shows the values)
const errMsgs = {
    plotAxis: `Value must be selected from the PlotDataModel.axis enum: ${Object.keys(ReScatter.data.PlotDataModel.axis)}`, 
    choroplethLoaderType: `Value must be selected from the ChoroplethLoader.LoaderType enum: ${Object.keys(ReScatter.control.ChoroplethLoader.LoaderType)}`,
    dataMapperProps: `Value must be selected from the DataMapper.propAssign enum: ${Object.keys(ReScatter.data.DataMapper.propAssign)}`, 
    dataMapperOps: `Value must be selected from the DataMapper.mapOp enum: ${Object.keys(ReScatter.data.DataMapper.mapOp)}`,
    plotSelection: `Value must be selected from the PixijsPlotController.SelectionEnum enum: ${Object.keys(ReScatter.control.PixijsPlotController.SelectionEnum)}`,
    layoutTarget: `Value must be selected from the LayoutController.LayoutTarget enum: ${Object.keys(ReScatter.control.LayoutController.LayoutTarget)}`
};

// absolute/relative path detector (assumes all characters are acceptable in names)
const filePathRegExp = /^\.{0,2}(\/[^/ ]*)+\/?$/;
const filePathString = Joi.string().pattern(filePathRegExp)
    .messages({
        'string.base': 'Expecting a file path',
    });
// very naive URL detector - only really checking http(s)://
const urlRegExp = /^https?:\/\/[\S]+$/;
/*const urlString = Joi.string().pattern(urlRegExp)
    .messages({
        'string.base': 'Expecting a URL',
    });*/
// Either file or URL 
const fileOrUrlString= Joi.string()
    .pattern(RegExp(filePathRegExp.source + '|' + urlRegExp.source))
    .messages({
        'string.base': 'Expecting a file path or a URL',
    });	
	
/**
 * Schema mapping keys to data files for the point data
 * @type {{id: *, filePath: *}}
 */
const dataMapSchema = {
    id: Joi.string().min(1).required(),
    filePath: Joi.string().min(1).required()
};

/**
 * Allowed alternatives for the plotProp
 */
 
const plotPropAllowedTypes = [
    Joi.object(),
    Joi.string(),
    Joi.function().arity(1),
    Joi.number()
];

/**
 * Schema for the default properties applied to a scatter plot
 * @type {{color: *[], id: *[], symbol: *[], shape: *[], size: *[], group: *[], primary: *[], background: *[]}}
 */
const plotFormatBaseSchema = Joi.object({
    color: plotPropAllowedTypes,
    id: plotPropAllowedTypes,
    symbol: plotPropAllowedTypes,
    shape: plotPropAllowedTypes,
    size: plotPropAllowedTypes,
    group: plotPropAllowedTypes,
    primary: plotPropAllowedTypes,
    background: plotPropAllowedTypes
});

const plotFormatSchema = plotFormatBaseSchema.unknown(); // to support user plot widgets

/**
 * Schema for the recalculation of choropleths - actually only sub sampling
 * @type {{data: *, selectionAxis: *}}
 */
const choroplethRecalculationSchema = {
    data: Joi.string().required(), // must be an id from the dataMaps array
    selectionAxis: Joi.object().pattern(/^\w+$/, Joi.number()
        .valid(
            ...Object.values(ReScatter.data.PlotDataModel.axis), 
        )
        .messages({'any.only': errMsgs.plotAxis}),
    ),
};

/**
 * The configuration for the property calculation pipeline
 * @type {{propAssign: *, mapOp: *, mapFn: *}}
 */
const calculatePropSchema = {
    propAssign: Joi.number()
        .valid(...Object.values(ReScatter.data.DataMapper.propAssign))
        .messages({'any.only': errMsgs.dataMapperProps}),
    mapOp: Joi.number()
        .valid(...Object.values(ReScatter.data.DataMapper.mapOp))
        .messages({'any.only': errMsgs.dataMapperOps}),
    // TODO: either 1) split mapFn into several types 
    // and/or 2) eliminate the difference 
    // between choropleth and plot selection prop functions.
    mapFn: Joi.function().maxArity(6)
};

/**
 * The properties that can be changed as the results of incoming selections
 * @type {{dataMap: *, propMap: {color: {propAssign: *, mapOp: *, mapFn: *}, size: {propAssign: *, mapOp: *, mapFn: *}, group: {propAssign: *, mapOp: *, mapFn: *}, effects: {propAssign: *, mapOp: *, mapFn: *}}}}
 */
const selectionMapSchema = {
    dataMap: Joi.string().required(),
    propMap: Joi.object({
        color: calculatePropSchema,
        size:  calculatePropSchema,
        group: [calculatePropSchema, {}],
        effects:  Joi.array().items('O', 'X') // point can be either a filled dot (default), a circle or and X
    }).required()
};

/**
 * Schema for handling transitive selections
 * @type {{propFilter: {mapFn: *}}}
 */
const transitiveSelectionMapSchema = {
    propFilter: Joi.object({
        mapFn: Joi.function().arity(2)
    }).required()
};

/**
 * Schema for the the recalculation of a plot from a selection.
 * @type {{data: *, selectionAxis: *, calcAxis: *}}
 */
const recalculationSchema = {
    data: Joi.string().required(), // must be an id from the dataMaps array
    selectionAxis: Joi.object().pattern(/\w+/, Joi.any()
        .valid(...Object.values(ReScatter.data.PlotDataModel.axis))
        .messages({'any.only': errMsgs.plotAxis})),
    calcAxis: Joi.number().required()
        .valid(...Object.values(ReScatter.data.PlotDataModel.axis))
        .messages({'any.only': errMsgs.plotAxis}),
    parameters: Joi.any() // these are algorithm specific parameters which should be checked in the plugin
};

const dataPreprocessSchema = {
    // The data preprocessing plugin id string
    preprocessPlugin: Joi.string().required(),
    // For each selecton group that can be recalculated declare a selection direction
    basemapSelections: Joi.object().pattern(/\w+/, Joi.any()
        .valid(...Object.values(ReScatter.data.PlotDataModel.axis))
        .messages({'any.only': errMsgs.plotAxis})),
};

const analysisSchema = {
    inputData: Joi.string().required(),
    targetPlotId: Joi.string().required(),
    parameters: Joi.object({
        calcAxis: Joi.number().required()
            .valid(...Object.values(ReScatter.data.PlotDataModel.axis))
            .messages({'any.only': errMsgs.plotAxis}),
        algorithmParams: Joi.object().pattern(
            /^[\w/.]+$/,
            Joi.alternatives().try(
                Joi.number().required(),
                Joi.bool().required())
        ) // these are algorithm specific parameters which should be checked in the plugin
    })
};


const analysisRecalculationSchema = Joi.object({
    baseDataMaps: Joi.array().items(dataMapSchema).required(),
    dataAnalysis: Joi.object({
        dataPreprocess: dataPreprocessSchema,
        analysisPlugin: Joi.string().required(),
        analyses: Joi.object().pattern(/^[\w/.]+$/, analysisSchema),
    })
});

const tutorialConfigSchema = Joi.object({
    title: Joi.string().min(1).required(),
    location: fileOrUrlString.required(),
});

const widgetBaseSchema = Joi.object({
    plugin: Joi.string().min(1).required(), // the widget (see plugins declaration above)
    contentId: Joi.string().min(1).required(), // id for the root HTML of the widget layout
    title: Joi.string().min(1).required(), // title for the widget tab
});

// Full widget schema adds unknown keys to the base
const widgetFullSchema = widgetBaseSchema.unknown();


/**
 * Handling selections in plots/choropleths is a matter of translating 
 * data and props (i.e. meta-data) to 
 * properties that can be visualized.
 * In the ReScatter architecture there are two different circumastances:
 * 1) standard - preprocess data and then map data + props to color, size, group or effects
 * 2) transitive - TODO
 */
const selectionInSchemas = Joi.alternatives().try(selectionMapSchema, transitiveSelectionMapSchema).required();

const plotDataSchema = Joi.object({
    points: filePathString.required(),
    props: filePathString.required(),
});

const plotSelectionSchema = Joi.object({
    selectionOut: Joi.string(),
    dynamicSelectionOut: Joi.string(),
    // **start Incoming selections
    // either using the object (if the behaviour is switchable
    switchableSelections: Joi.object().instance(ReScatter.config.SwitchableSelections),
    // or
    // by defining the two possible incoming selections. Allow for different behaviour
    // between mouse-over (dynamic) and permanent selections
    selectionIn: Joi.object().pattern(/^[\w/.]+$/, selectionInSchemas),
    dynamicSelectionIn: Joi.object().pattern(/^[\w/.]+$/, selectionInSchemas),
    // ** end Incoming selections
    selectionDefaults: {
        numNeighbours: Joi.number().integer().min(0),
        selectOver: Joi.number()
            .valid(...Object.values(ReScatter.control.PixijsPlotController.SelectionEnum)).required()
            .messages({'any.only': errMsgs.plotSelection}),
        mouseOverExcludeSeed: Joi.boolean()
    }
});

const predefinedSelectionsSchema = Joi.object({
    preselect: filePathString.required(),
    id: Joi.string().min(1).required(),
    title: Joi.string().min(1).required(),
    description: Joi.string().min(1).required(),
    targetId: Joi.string().min(1).required(),
});

const choroplethSchema = Joi.object({
    id: Joi.string().min(1),
    // TODO allow either a plugin or an internal type
    plugin: Joi.string().min(1).optional(),
    type: Joi.number()
        .valid(...Object.values(ReScatter.control.ChoroplethLoader.LoaderType))
        .messages({'any.only': errMsgs.choroplethLoaderType}),
    svgTemplate: /^.*<svgid>.*$/,
    thumbnailTemplate: /^.*<svgid>.*$/,
    svgList: Joi.array().min(0).items(/^[\w/.]+$/),
    region_ids: /^[\w/.]+$/,
    preselect: Joi.array().min(0).items(/^[\w/.]+$/), //selected from svgList
    props: /^[\w/.]+$/,
    dynamicSelectionOut: Joi.string().min(1),
    recalculation: choroplethRecalculationSchema,
    // Incoming selections affect the plot display
    // if the plot is subscribed to the selection channel.
    // The effects can be switchable 
    switchableSelections: Joi.object().instance(ReScatter.config.SwitchableSelections),
    // or by defining the two possible incoming selections. 
    // Allow for different behaviour
    // between mouse-over (dynamic) and permanent selections
    selectionIn: Joi.object().pattern(/^[\w/.]+$/, selectionInSchemas),
    dynamicSelectionIn: Joi.object().pattern(/^[\w/.]+$/, selectionInSchemas),
    // ** end Incoming selections
    popupAttributeList: Joi.array().min(1).items(/^.+$/)
});

const ontologySchema = Joi.object({
    id: Joi.string().min(1),
    ontology_file: filePathString,
    dynamicSelectionOut: Joi.string().min(1),
    openId: Joi.array().items(Joi.number(), Joi.string())
});

const plotSchema = Joi.object({
    plugin: Joi.string().min(1),
    id: Joi.string().min(1),
    layoutTarget: Joi.number()
        .valid(...Object.values(ReScatter.control.LayoutController.LayoutTarget)).required()
        .messages({'any.only': errMsgs.layoutTarget}), 
    data: plotDataSchema,
    format: plotFormatSchema,
    selections: plotSelectionSchema,
    recalculation: recalculationSchema,
});

const layoutConfigSchema = Joi.object({
    id: Joi.number().min(0).integer().required(),
    title: Joi.string().min(1).required(),
    description: Joi.string().min(1).required(),
    dataMaps: Joi.array().items(dataMapSchema).required(),
    plots: Joi.array().items(plotSchema).required(),            
    ontology: Joi.string().min(1),
    recalculation:  analysisRecalculationSchema,
    // required for switchableSelections in the plots
    selectionConfigs: Joi.array().min(1).items(/^.+$/),
    choropleths: Joi.array().length(1).items(choroplethSchema),
    ontologies: Joi.array().items(ontologySchema),
    predefinedSelections: Joi.array().items(predefinedSelectionsSchema),
});

const pluginSchema = Joi.object().pattern(/^\w+$/,Joi.function());

const siteConfigSchema = Joi.object({
    // Choropleth widgets - implementing X interface
    ChoroplethPlugins: pluginSchema.description('Declare any user supplied choropleth plugins'),
    // Plot widgets - implementing Y interface
    PlotPlugins: pluginSchema.description('Declare any user supplied plot widget plugins'),
    // Layout widgets - implementing Z interface
    LayoutPlugin: pluginSchema.description('Declare any user supplied control widget plugins'),
    // Site title
    SiteTitle: Joi.string().min(3).required(),
    // Data layouts
    Layouts: Joi.array().min(1).items(layoutConfigSchema).required().description('Data layouts that are included in the site'),
    // Tutorial videos
    Tutorials: Joi.array().items(tutorialConfigSchema).description('Tutorial videos for the tutorials popup'),
    // User provided control widgets
    Widgets: Joi.array().items(widgetFullSchema).description('Configuration for and user supplied control widget'),
});

module.exports = class Validator {
    constructor(siteConfig) {
        this.unvalidatedSiteConfig = siteConfig;
        this.schema = Joi.compile(siteConfigSchema);
        console.log('Active schema:\n');
        console.log(this.schema.describe());    
    }
    
    validate() {
        console.log('\nStarting validation ...');
        return this.schema.validate(this.unvalidatedSiteConfig);
    }
};


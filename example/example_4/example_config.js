import CanvasChoroplethPlugin from '../example_2/CanvasChoroplethPlugin.js';
import RadvizPlotPlugin from './RadvizPlotPlugin_v2.js';

var selectionMappings = {
    DigitsSelectionDigitsMapping : {
        dataMap: 'MNIST60000',
        propMap: {
            group: {},
            color: {
                // propAssign: ReScatter.data.DataMapper.propAssign.POINT
                mapFn: function () {
                    return 0x477F54;
                }
            }, // set size to 4 pixels
            size: {
                mapFn:function () {
                    return 4;
                }
            }
        }
    },
    DigitsSelectionPixelMapping : {
        dataMap: 'MNIST60000',
        propMap: {
            group: {
                /* An incoming digit will generate a color for every pixel. So select the entire column dimension in the data */
                mapOp: ReScatter.data.DataMapper.mapOp.ALLCOL
            },
            color: {
                /* Derived colours for each point by summing over the */
                propAssign: ReScatter.data.DataMapper.propAssign.POINT,
                mapOp: ReScatter.data.DataMapper.mapOp.SUMROW,
                mapFn: function (values) {
                    var colorRamp = new ReScatter.utils.ColorRamp();
                    colorRamp.colorIntervals = [0xFEFEFE, 0xFE0000];
                    var min = Math.min.apply(null, values);
                    var max = Math.max.apply(null, values);
                    colorRamp.range = [min, max];
                    var colors = new Array(values.length);
                    for (var i = 0, len = values.length; i < len; i++) {
                        if (isNaN(values[i])) {
                            colors[i] = 0x000000;
                            continue;
                        }
                        colors[i] = colorRamp.getColorInRange(values[i]);
                    }
                    return colors;
                }
            }, // copy colors from base plot
            size: {
                mapFn:function () {
                    return 4;
                }
            },
        }
    },
    // We use the same selection mapping for both static and dynamic (mouse over) selections
    // So declare it here once and use it below
    DigitsSelectionChoroplethMapping : {
        //dataMap: The name of the data to project onto the choropleth - from the dataMaps dictionary above
        dataMap: 'MNIST60000',
        propMap: {
            /** @property {object} color: how to color the points based on the selection*/
            color: {
                propAssign: ReScatter.data.DataMapper.propAssign.POINT, //mapFn returns array of colors per point
                mapOp: ReScatter.data.DataMapper.mapOp.AVGROW,
                // Tip: choropleth colors can also be returned as css strings - '#nnnnnn' or 'orange'
                /** @function mapFn
                 *  @param {array} sampleIndices: integer indices indicating the selection
                 *  @param {map} choroProps: properties of the choropleth itself (e.g. default region colors)
                 *  @param {int} selectionProp: a default color value set by the selection source
                 *  @param {array of string} choroRegionsOrdered: choropleth region ids in order
                 *  @param {map of string tostring array} choroRegionMap: choropleth region and the corresponding sample regions
                 *  @param {map} sourceProps: the properties of the selection source
                 */
                mapFn: function (mapOpVals, choroProps, selectionProp, choroRegionsOrdered/*, choroRegionMap, sourceProps*/) {
                    var colorRamp = new ReScatter.utils.ColorRamp();
                    colorRamp.colorIntervals = [0xFEFEFE, 0xFF0099];
                    colorRamp.range = [0, 2];
                    var regionColors = {};
                    mapOpVals.map(function (value, index) {
                        regionColors[choroRegionsOrdered[index]] = colorRamp.getColorInRange(value);
                    });
                    return regionColors;
                }
            }
        }
    },
    PixelSelectionPixelMapping : {
        dataMap: 'MNIST60000',
        propMap: {
            /** @property {object} effects: how to draw the points based on the selection*/
            effects: ['O'],// TODO support other selection marker effects - currently O and X marker
            /** @property {object} group: how to group the points based on the selection*/
            group: {}, // selected points
            /** @property {object} color: how to color the points based on the selection*/
            color: {propAssign: ReScatter.data.DataMapper.propAssign.POINT}, // copy colors from base plot
            /** @property {object} size: how to size the points based on the selection*/
            size: {
                mapFn:function () {
                    return 6;
                }
            }
        }
    },
    PixelSelectionDigitMapping : {
        dataMap: 'MNIST60000',
        propMap: {
            group: {
                /* An incoming pixel will generate a color for every digit. So select the entire row dimension in the data */
                mapOp: ReScatter.data.DataMapper.mapOp.ALLROW
            },
            color: {
                /* Derived colours for each point by summing over the column of selected pixel values*/
                propAssign: ReScatter.data.DataMapper.propAssign.POINT,
                mapOp: ReScatter.data.DataMapper.mapOp.SUMCOL,
                mapFn: function (values) {
                    var colorRamp = new ReScatter.utils.ColorRamp();
                    colorRamp.colorIntervals = [0xFEFEFE, 0xFE00FE];
                    var min = Math.min.apply(null, values);
                    var max = Math.max.apply(null, values);
                    colorRamp.range = [min, max];
                    var colors = new Array(values.length);
                    for (var i = 0, len = values.length; i < len; i++) {
                        if (isNaN(values[i])) {
                            colors[i] = 0x000000;
                            continue;
                        }
                        colors[i] = colorRamp.getColorInRange(values[i]);
                    }
                    return colors;
                }
            }, // copy colors from base plot
            size: {
                mapFn:function () {
                    return 4;
                }
            },
        }
    },
    PixelSelectionChoroplethMapping : {
        //dataMap: The name of the data to project onto the choropleth - from the dataMaps dictionary above
        dataMap: 'MNIST60000',
        propMap: {
            /** @property {object} color: how to color the points based on the selection*/
            color: {
                // non propAssign assign color to all in group
                // propAssign: ReScatter.data.DataMapper.propAssign.POINT, //mapFn returns array of colors per point
                // Tip: choropleth colors can also be returned as css strings - '#nnnnnn' or 'orange'
                mapFn: function (dataPoints, choroProps, selectionProp, choroRegionsOrdered/*, choroRegionMap, sourceProps*/) {
                    let regionColMap = {};
                    choroRegionsOrdered.map(function(val, index) {
                        if (dataPoints.includes(index)) {
                            regionColMap[val] = 0xFF0000;
                            return 0xFF0000;
                        } else {
                            regionColMap[val] = 0xFFFFFF;
                            return 0xFFFFFF;
                        }
                    });
                    return regionColMap;
                }
            }
        }
    },
};



var siteConfig = {
    ChoroplethPlugins: {
        'CanvasChoroplethPlugin': CanvasChoroplethPlugin
    },
    PlotPlugins: {
        'RadvizPlotPlugin': RadvizPlotPlugin
    },
    SiteTitle: 'Layout Example',
    Layouts: [
        {
            id: 100, title: 'Paired MNIST 60000 + radial plot view',
            description: `tSNA embedding based on 60000 28x28 MNIST digits and 
            a tSNE embedding of the pixels based on their values in the digits`,
            /** property {Array of Object} dataMaps
             * Each object identifies a nrrd file containing float data that can be used to
             * calculate overlay effects. In the MNIST example this data is the 10000x784 matrix
             * of digits/normalized pixel values
             */
            dataMaps: [
                {id: 'MNIST60000', filePath:'../data/np60000x784.nrrd.gz'},
                {id: 'MNIST_PCA5_60000', filePath:'../data/MNIST_PCA5_60000.nrrd'}
            ],
            /** @property {object} plots: definitions of the scatter plots in this layout*/
            plots: [
                /** Configuration for the Digits t-SNE plot where the pixels form the dimensions */
                {
                    /** @property {string] id: The display name of the plot */
                    id: 'Digits',
                    /** @property {enum} layoutTarget: Where the the plot will be displayed
                     * two options are supported GRID or MASTER
                     * GRID plots are placed in order in the grid
                     * MASTER plot (there is only a single master plot and up to 8 regular plots)
                     * The MASTER plot layout has one central master and up to 8 ancillary, smaller, plots.
                     * If not master plot is present the plots marked with GRID are distributed in order
                     * (left-right, top-bottom) over a 4x3 grid.
                     */
                    layoutTarget: ReScatter.control.LayoutController.LayoutTarget.GRID,
                    data: {
                        points: '../data/MNIST60000_tsne_plot.json',
                        props: '../data/MNIST60000_props.json',
                    },
                    format: {
                        id: 'label',
                        symbol: 'label',
                        primary: 'label',
                        color: function (prop) {
                            var colors = {
                                0: 0xFF0000,
                                1: 0xFF9900,
                                2: 0xCCFF00,
                                3: 0x33FF00,
                                4: 0x00FF66,
                                5: 0x00FFFF,
                                6: 0x0066FF,
                                7: 0x3300FF,
                                8: 0xCC00FF,
                                9: 0xFF0099
                            };
                            return colors[prop.label];
                        },
                    },
                    selections: {
                        /** @property {string} selectionOut: the id of the permanent selection generated by this plot*/
                        selectionOut: 'Digits',
                        /** @property {string} dynamicSelectionOut: the id of the dynamic selection generated by this plot*/
                        dynamicSelectionOut: 'DigitsDynamic',
                        /** @property {object} selectionIn: how to alter the plot properties
                         * based on an incoming permanent selection*/
                        selectionIn: {
                            Digits: selectionMappings.DigitsSelectionDigitsMapping,
                            Pixels: selectionMappings.PixelSelectionDigitMapping,
                        },
                        /** @property {object} dynamicSelectionIn: how to alter the plot properties
                         * based on an incoming dynamic selection
                         */
                        dynamicSelectionIn: {
                            DigitsDynamic: selectionMappings.DigitsSelectionDigitsMapping,
                            PixelsDynamic: selectionMappings.PixelSelectionDigitMapping,
                        },
                        /** @property {object} selectionDefaults: Indicates the default settings
                         * for the context menu in this plot.
                         */
                        selectionDefaults: {
                            numNeighbours: 49,
                            selectOver: ReScatter.control.PixijsPlotController.SelectionEnum.MOUSEOVER,
                            mouseOverExcludeSeed: false
                        }
                    }
                },
                /** Configuration for the Pixels t-SNE plot where the digits form the dimensions */
                {
                    id: 'Pixels',
                    layoutTarget: ReScatter.control.LayoutController.LayoutTarget.GRID,
                    data: {
                        points: '../data/MNIST784.json',
                        props: '../data/pixel_label_784.json',
                    },
                    format: {
                        id: 'label',
                        symbol: 'label',
                        primary: 'label',
                        color: 0x66ff33,
                    },
                    selections: {
                        selectionOut: 'Pixels',
                        /** The underlying data values and the direction of the selection all incoming selection should be listed**/
                        dynamicSelectionOut: 'PixelsDynamic',
                        selectionIn: {
                            Digits: selectionMappings.DigitsSelectionPixelMapping,
                            Pixels: selectionMappings.PixelSelectionPixelMapping,
                        },
                        dynamicSelectionIn: {
                            DigitsDynamic: selectionMappings.DigitsSelectionPixelMapping,
                            PixelsDynamic: selectionMappings.PixelSelectionPixelMapping,
                        },
                        selectionDefaults: {
                            numNeighbours: 0,
                            selectOver: ReScatter.control.PixijsPlotController.SelectionEnum.MOUSEOVER,
                            mouseOverExcludeSeed: false
                        }
                    }
                },
                /** Configuration for the d3 based radviz plot where the digits form the dimensions */
                {
                    plugin: 'RadvizPlotPlugin',
                    id: 'MNIST 5 PCA radial plot',
                    layoutTarget: ReScatter.control.LayoutController.LayoutTarget.GRID,
                    data: {
                        points: '../data/MNIST60000_tsne_plot.json',
                        props: '../data/MNIST60000_props.json',
                    },
                    format: {
                        id: 'mnist_index',
                        symbol: 'label',
                        primary: 'label',
                        // for d3 return CSS format colors
                        color: function (prop) {
                            var colors = {
                                0: '#FF0000',
                                1: '#FF9900',
                                2: '#CCFF00',
                                3: '#33FF00',
                                4: '#00FF66',
                                5: '#00FFFF',
                                6: '#0066FF',
                                7: '#3300FF',
                                8: '#CC00FF',
                                9: '#FF0099'
                            };
                            return colors[prop.symbol];
                        },
                        dimensions: ['pca0', 'pca1', 'pca2', 'pca3', 'pca4']
                    },
                    selections: {
                        dynamicSelectionIn: {
                            DigitsDynamic: {
                                dataMap: 'MNIST_PCA5_60000',
                                propMap: {}
                            }
                        },
                        selectionIn: {
                            Digits: {
                                dataMap: 'MNIST_PCA5_60000',
                                propMap: {}
                            }
                        },
                        dynamicSelectionOut: 'RadvizDynamic',
                    }
                }
            ],
            // choropleth: The thematic map (as SVG) that can be used to display selections (static or dynamic)
            // on a (schematic) representation of the data space. In this example we have an SVG containing
            // 784 squares arranged in a 28x28 grid (each square is an svg <path>) with unique
            // region ids from 0 to 783. e.g. <path id="670" ...>
            choropleths: [
                {
                    plugin: 'CanvasChoroplethPlugin',
                    // id: display name
                    id: 'MNIST Grid',
                    // A "SIMPLE_LOADER" or the choropleth loads a single svg
                    // also supported is the "IMAGE_STRIP_LOADER" which allows the user
                    // to add and remove SVG images via interaction with image thumbnails
                    // In this case we don't use a built-in SVG choropleth type so leave type undefined
                    // or use ReScatter.control.ChoroplethLoader.LoaderType.NO_LOADER
                    //type: ReScatter.control.ChoroplethLoader.LoaderType.SIMPLE_LOADER,
                    // svgTemplate: Partial path to locate the svg files
                    // <svgid> marks where the path will be completed
                    svgTemplate: './<svgid>',
                    // svgList: list of the svg file names that complete the svgTemplate path
                    svgList: [],
                    // preselect: The svgs that are preloaded
                    preselect:[],
                    props: '../data/SvgPixelProps.json',
                    // TODO Support selection out from choropleth with optional
                    // configurable selectionout mapping
                    dynamicSelectionOut: 'PixelsTransitive',

                    // region_ids: Map a Pixel index to a region id in the thematic map
                    // In this example there is a 1-to-1 correspondence between pixel
                    // plot point and svg region.
                    // This region_ids file contains a json dict of the form
                    // {"ordered_region_map": [
                    //    ["choropleth region_id corresponding_to_pixel_0"],
                    //    ["choropleth region_id corresponding_to_pixel_1"],
                    //    etc.
                    // ]}

                    // In a more complex situation where a single svg region represents
                    // one or more plot points the region map is of the form
                    // {"ordered_region_map": [
                    //    ["choropleth region_id corresponding_to_pixel_0", [mapped_plot_id_a, mapped_plot_id_b]],
                    //    ["choropleth region_id corresponding_to_pixel_1", [mapped_plot_id_x]],
                    //    etc.
                    // ]}
                    // This is the case in the Brainscope website where the multiple
                    region_ids:'../data/grid_pixel_region_map.json',

                    selectionIn: {
                        Digits : selectionMappings.DigitsSelectionChoroplethMapping,
                        Pixels :selectionMappings.PixelSelectionChoroplethMapping,
                    },
                    dynamicSelectionIn: {
                        DigitsDynamic : selectionMappings.DigitsSelectionChoroplethMapping,
                        PixelsDynamic : selectionMappings.PixelSelectionChoroplethMapping,
                        RadvizDynamic : selectionMappings.DigitsSelectionChoroplethMapping,
                    },
                    // only display the attributes listed here in the popup
                    popupAttributeList: ['structure_acronym', 'structure_name', 'agegroup']
                }
            ]
        }
    ]
};
if (Object.prototype.toString.call(global.process) === '[object process]') {
    exports.siteConfig = siteConfig;
} else {
    window.siteConfig = siteConfig;
}


import CanvasChoroplethPlugin from '../example_2/CanvasChoroplethPlugin.js';
import WheelWidgetPlugin from './WheelWidgetPlugin.js';

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
                // propAssign: ReScatter.data.DataMapper.propAssign.POINT,
                // mapFn returns array of colors per point
                // Tip: choropleth colors can also be returned as css strings - '#nnnnnn' or 'orange'
                mapFn: function (dataPoints, choroProps, selectionProp, choroRegionsOrdered/*, choroRegionMap, sourceProps*/) {
                    const regionColMap = {};
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

function getPlotConfig(displayName, pointJsonPath, propJsonPath) {
    return {
        /** @property {string] id: The display name of the plot */
        id: displayName,
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
            points: pointJsonPath,
            props: propJsonPath,
        },
        format: {
            id: 'label',
            symbol: 'label',
            primary: 'label',
            background: 0xF6F6F6,
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
                numNeighbours: 4,
                selectOver: ReScatter.control.PixijsPlotController.SelectionEnum.MOUSEOVER,
                mouseOverExcludeSeed: false
            }
        }
    };
}

function getMNISTChoroplethConfig() {
    return {
        plugin: 'CanvasChoroplethPlugin',
        // id: display name
        id: 'MNIST Grid',
        // A 'SIMPLE_LOADER' or the choropleth loads a single svg
        // also supported is the 'IMAGE_STRIP_LOADER' which allows the user
        // to add and remove SVG images via interaction with image thumbnails
        type: ReScatter.control.ChoroplethLoader.LoaderType.SIMPLE_LOADER,
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
        // {'ordered_region_map': [
        //    ['choropleth region_id corresponding_to_pixel_0'],
        //    ['choropleth region_id corresponding_to_pixel_1'],
        //    etc.
        // ]}

        // In a more complex situation where a single svg region represents
        // one or more plot points the region map is of the form
        // {'ordered_region_map': [
        //    ['choropleth region_id corresponding_to_pixel_0', [mapped_plot_id_a, mapped_plot_id_b]],
        //    ['choropleth region_id corresponding_to_pixel_1', [mapped_plot_id_x]],
        //    etc.
        // ]}
        // This is the case in the Brainscope website where the multiple
        region_ids:'../data/grid_pixel_region_map.json',

        selectionIn: {
            Digits : selectionMappings.DigitsSelectionChoroplethMapping,
            Pixels : selectionMappings.PixelSelectionChoroplethMapping,
        },
        dynamicSelectionIn: {
            DigitsDynamic : selectionMappings.DigitsSelectionChoroplethMapping,
            PixelsDynamic : selectionMappings.PixelSelectionChoroplethMapping,
            RadvizDynamic : selectionMappings.DigitsSelectionChoroplethMapping,
        },
        // only display the attributes listed here in the popup
        popupAttributeList: ['structure_acronym', 'structure_name', 'agegroup']
    };
}

let siteConfig = {
    ChoroplethPlugins: {
        'CanvasChoroplethPlugin': CanvasChoroplethPlugin
    },
    WidgetPlugins: {
        'WheelWidgetPlugin': WheelWidgetPlugin
    },

    SiteTitle: 'Compare umap & tSNE MNIST embeddings ',
    Layouts: [
        {
            id: 100, title: 'MNIST umap versus tSNE',
            description: '60000 MNIST digits embedded using umap and tSNE',
            /** property {Array of Object} dataMaps
             * Each object identifies a nrrd file containing float data that can be used to
             * calculate overlay effects. In the MNIST example this data is the 10000x784 matrix
             * of digits/normalized pixel values
             */
            dataMaps: [
                {id: 'MNIST60000', filePath:'https://dl.dropboxusercontent.com/s/h8fgyl3izp7h8r2/MNIST_data_all.nrrd.gz'},
            ],
            /** @property {object} plots: definitions of the scatter plots in this layout*/
            plots: [
                getPlotConfig('umap 60000 MNIST digits', '../data/MNIST60000_umap_plot.json.gz', '../data/MNIST_all_umap_props.json'),
                getPlotConfig('tsne 60000 MNIST digits', '../data/MNIST60000_tsne_plot.json.gz', '../data/MNIST_all_umap_props.json'),
            ],
            // choropleth: The thematic map (as SVG) that can be used to display selections (static or dynamic)
            // on a (schematic) representation of the data space. In this example we have an SVG containing
            // 784 squares arranged in a 28x28 grid (each square is an svg <path>) with unique
            // region ids from 0 to 783. e.g. <path id='670' ...>
            choropleths: [
                getMNISTChoroplethConfig(),
            ],

        },
        {
            id: 200, title: 'MNIST digits 4,7,9 umap versus tSNE',
            description: '60000 MNIST digits embedded using umap and tSNE',
            /** property {Array of Object} dataMaps
             * Each object identifies a nrrd file containing float data that can be used to
             * calculate overlay effects. In the MNIST example this data is the 10000x784 matrix
             * of digits/normalized pixel values
             */
            dataMaps: [
                {id: 'MNIST60000', filePath:'https://dl.dropboxusercontent.com/s/evxjbofln2p4t6e/MNIST_data_479.nrrd.gz'},
            ],
            /** @property {object} plots: definitions of the scatter plots in this layout*/
            plots: [
                getPlotConfig('umap MNIST digits 4,7,9', '../data/MNIST_479_umap_plot.json', '../data/MNIST_479_umap_props.json'),
                getPlotConfig('tsne MNIST digits 4,7,9', '../data/MNIST_data_479_tsne.json', '../data/MNIST_479_umap_props.json')
            ],
            // choropleth: The thematic map (as SVG) that can be used to display selections (static or dynamic)
            // on a (schematic) representation of the data space. In this example we have an SVG containing
            // 784 squares arranged in a 28x28 grid (each square is an svg <path>) with unique
            // region ids from 0 to 783. e.g. <path id='670' ...>
            choropleths: [
                getMNISTChoroplethConfig(),
            ],
        },
        {
            id: 300, title: 'MNIST digits 3,5,8 umap versus tSNE',
            description: '60000 MNIST digits embedded using umap and tSNE',
            /** property {Array of Object} dataMaps
             * Each object identifies a nrrd file containing float data that can be used to
             * calculate overlay effects. In the MNIST example this data is the 10000x784 matrix
             * of digits/normalized pixel values
             */
            dataMaps: [
                {id: 'MNIST60000', filePath:'https://dl.dropboxusercontent.com/s/xaqeyp0u9awzskx/MNIST_data_358.nrrd.gz'},
            ],
            /** @property {object} plots: definitions of the scatter plots in this layout*/
            plots: [
                getPlotConfig('umap MNIST digits 3,5,8', '../data/MNIST_358_umap_plot.json', '../data/MNIST_358_umap_props.json'),
                getPlotConfig('tsne MNIST digits 3,5,8', '../data/MNIST_data_358_tsne.json', '../data/MNIST_358_umap_props.json'),
            ],
            // choropleth: The thematic map (as SVG) that can be used to display selections (static or dynamic)
            // on a (schematic) representation of the data space. In this example we have an SVG containing
            // 784 squares arranged in a 28x28 grid (each square is an svg <path>) with unique
            // region ids from 0 to 783. e.g. <path id='670' ...>
            choropleths: [
                getMNISTChoroplethConfig(),
            ],
        },
        {
            id: 400, title: 'MNIST digits 0,1,2,6 umap versus tSNE',
            description: '60000 MNIST digits embedded using umap and tSNE',
            /** property {Array of Object} dataMaps
             * Each object identifies a nrrd file containing float data that can be used to
             * calculate overlay effects. In the MNIST example this data is the 10000x784 matrix
             * of digits/normalized pixel values
             */
            dataMaps: [
                {id: 'MNIST60000', filePath:'https://dl.dropboxusercontent.com/s/8nggbw8db2oj148/MNIST_data_0126.nrrd.gz?dl=0'},
            ],
            /** @property {object} plots: definitions of the scatter plots in this layout*/
            plots: [
                getPlotConfig('umap MNIST digits 0,1,2,6', '../data/MNIST_0126_umap_plot.json', '../data/MNIST_0126_umap_props.json'),
                getPlotConfig('tsne MNIST digits 0,1,2,6', '../data/MNIST_data_0126_tsne.json', '../data/MNIST_0126_umap_props.json'),
            ],
            // choropleth: The thematic map (as SVG) that can be used to display selections (static or dynamic)
            // on a (schematic) representation of the data space. In this example we have an SVG containing
            // 784 squares arranged in a 28x28 grid (each square is an svg <path>) with unique
            // region ids from 0 to 783. e.g. <path id='670' ...>
            choropleths: [
                getMNISTChoroplethConfig(),
            ],
        },
    ],
    // The Widgets list contains user designed control widgets.
    // These are located on extra tabs in the control widgets.
    // To couple with ReScatter they need to inherit from one of the ReScatter.widget.*Base
    // classes (or be wrapped by a class that does this).
    //
    // For now we only support a widget derived from the ReScatter.widget.LayoutWidgetBase
    // class but the mechanism is in principle extensible to other control widgets.
    Widgets:[
        {
            plugin: 'WheelWidgetPlugin', // the widget (see plugins declaration above)
            contentId: 'wheelcontrolinclude', // id for the root HTML of the widget layout
            title: 'Wheel Navigator', // title for the widget tab
            // what follows is configuration specific to the widget itself.
            dataPath: './layouthierarchy.json',
            active : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            // map the wheel names to the layout ids (defined about)
            // this allows the whell to load the coupled layouts
            // In this case we map the name in the hierarchy to the
            // the layout id
            wheelDiv: '#wheelMainView',
            wheelToLayoutMap: {
                'MNIST_Umap_groups' : 100,
                'Group_479' : 200,
                'Group_358' : 300,
                'Group_0126': 400
            }
        }
    ]
};

if (Object.prototype.toString.call(global.process) === '[object process]') {
    exports.siteConfig = siteConfig;
} else {
    window.siteConfig = siteConfig;
}



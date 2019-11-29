import CanvasChoroplethPlugin from '../../ReScatter/example/example_2/CanvasChoroplethPlugin.js';
import WheelWidgetPlugin from '../../ReScatter/example/example_5/WheelWidgetPlugin.js';

function getMNISTChoroplethConfig() {
    return {
        plugin: 'CanvasChoroplethPlugin',
        // id: display name
        id: 'MNIST Grid',
        // load_id unique id for internal use
        loadId: 'CharPixelGrid',
        // A 'SIMPLE_LOADER' or the choropleth loads a single svg
        // also supported is the 'IMAGE_STRIP_LOADER' which allows the user
        // to add and remove SVG images via interaction with image thumbnails
        type: '',
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
            Pixels :selectionMappings.PixelSelectionChoroplethMapping,
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

    SiteTitle: 'Compare umap & tSNE MNIST embeddings',
    
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
			/*plots: [
				getPlotConfig('umap 60000 MNIST digits', '../data/MNIST60000_umap_plot.json.gz', '../data/MNIST_all_umap_props.json'),
				getPlotConfig('tsne 60000 MNIST digits', '../data/MNIST60000_tsne_plot.json.gz', '../data/MNIST_all_umap_props.json'),
			],*/
			// choropleth: The thematic map (as SVG) that can be used to display selections (static or dynamic)
			// on a (schematic) representation of the data space. In this example we have an SVG containing
			// 784 squares arranged in a 28x28 grid (each square is an svg <path>) with unique
			// region ids from 0 to 783. e.g. <path id='670' ...>
			//choropleths: [
			//	getMNISTChoroplethConfig(),
			//],

		}
	]  
};



// When loaded in nodejs export the siteConfig to allow validation
/* eslint-disable no-undef */
if ((process !== undefined) && (process.release !== undefined) && (process.release.name === 'node')) {
    exports.siteConfig = siteConfig;
} else {
    window.siteConfig = siteConfig;
}
/* eslint-enable no-undef */



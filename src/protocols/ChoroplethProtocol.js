import * as protocol from 'protoduck';

/**
 * A choropleth (or thematic map) coomprises a base map
 * with regions that may be colored to represent data values correcponding
 * to the regions. This protocol represents the minimum requirements
 * for a dynamically recolorable choropleth view component.
 */
const ChoroplethProtocol = protocol.define(['colorMap'], {
    onPlethResize: [], // do whatever is needed to refresh the view on resize
    loadPleth: [], // load the choropleth base images
    clearPlethColors: [], // clear all region colors
    savePlethColors: [], // save the current region colors for later restore
    restorePlethColors: [], // restore the saved region colors
    setPlethColorsFromMap: ['colorMap'], // a map of region ids to RGB or CSS colors
});

export default ChoroplethProtocol;

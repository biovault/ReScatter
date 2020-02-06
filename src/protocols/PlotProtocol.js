import * as protocol from 'protoduck';

/**
 * A plot is a display of point data that can be loacated in the ReScatter grid.
 * The basic interface is minimal comprising loading of the points
 * and handling the resize event
 */
const PlotProtocol = protocol.define(['points', 'props', 'plotProps', 'resizeEvent'], {
    loadPlotData: ['points', 'props', 'plotProps'], // do whatever is needed to refresh the view on resize
    onResize: ['resizeEvent'], // load the choropleth base images
});

export default PlotProtocol;

import * as protocol from 'protoduck';

/**
 * A plot is a display of point data that can be loacated in the ReScatter grid.
 * The basic interface is minimal comprising loading of the points
 * and handling the resize event
 */
const LayoutWidgetProtocol = protocol.define([], {
    /**
     *
     * Called when new layout data is about to be loaded. Override to cleanup up previous layout data view
     */
    beforeContentChange: [],
    afterContentChange: [],
    resize: []
});

export default LayoutWidgetProtocol;

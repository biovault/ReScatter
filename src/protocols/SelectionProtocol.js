import * as protocol from 'protoduck';

/**
 * A plot is a display of point data that can be loacated in the ReScatter grid.
 * The basic interface is minimal comprising loading of the points
 * and handling the resize event
 */
const SelectionProtocol = protocol.define(['context'], {
    processSelectionEvent: ['context'], // do whatever is needed to refresh the view on resize
});

export default SelectionProtocol;

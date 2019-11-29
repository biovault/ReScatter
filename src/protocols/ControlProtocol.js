import * as protocol from 'protoduck';

/**
 * A plot is a display of point data that can be loacated in the ReScatter grid.
 * The basic interface is minimal comprising loading of the points
 * and handling the resize event
 */
const ControlProtocol = protocol.define(['context'], {
    onControlEvent: ['context'], // Handle the control events that are required for this component
});

export default ControlProtocol;

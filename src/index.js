/**
 * Created by bvanlew on 27/03/2017.
 */

/**
 *  @namespace ReScatter
 */
import * as jobs from './jobs';
import * as config from './config';
import * as view from './view';
import * as utils from './utils';
import * as events from './events';
import * as control from './control';
import * as data from './data';
import * as widget from './widget';
import * as protocols from './protocols';
// system globals
import ControlEventModel from './events/ControlEventModel';
import PermanentSelection from './data/PermanentSelection';
export {
    jobs,
    config,
    view,
    utils,
    events,
    control,
    data,
    widget,
    protocols,
};


export const controlEventModel = new ControlEventModel();
export const selectionModel = new PermanentSelection();
export * from './utils/const';


export const cursors = require.context('./cursors', true, /^\.\/.*\.png$/);
cursors.keys().map(cursors);

/**
 * Initialize: prepare the ReScatter for use.
 * It should be called once when the web-page is first loaded.
 */
export function initialize() {
    "use strict";
    utils.control_ids_to_strings();
}

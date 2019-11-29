import SelectionProtocol from "../../protocols/SelectionProtocol";

/**
 * Created by bvanlew on 9-4-18.
 * Provide a base for any type of layout widget including
 * the default LayoutTableWidget.
 * This base class inplements common functionality
 * for all layout loading widgets. Override the methods given and call
 * super where
 *
 */
const PubSub = require('pubsub-js');
import LayoutCollection from '../../data/LayoutCollection';
import {LayoutWidgetProtocol} from "../../protocols";

export default class LayoutTableWidgetBase {

    constructor() {
        if(!LayoutWidgetProtocol.hasImpl(new.target)) {
            alert('LayoutTableWidgetBase child: ' + new.target.name + " must implement the LayoutWidgetProtocol");
        }
        this.layouts = new LayoutCollection();
        this.layoutData = this.layouts.getLayoutConfig();
        let self = this;
        PubSub.subscribe(this.layouts.pubsubid, (msg,data) => {self._contentChanged(msg, data);});
    }

    /**
     * Called if the LayoutCollection singleton data have been modified
     * This can happen when new layouts are created and added to the data
     * (can be as a result of turning subselections into new layouts).
     * @param msg - from the the pubsub
     * @param data - complete layout data object
     * @private
     */
    _contentChanged (msg, data) {
        "use strict";
        this.beforeContentChange();
        this.layoutData = data.layouts.getLayoutConfig();
        this.afterContentChange();
    }

    /**
     * Subclass should call this when a new layout is selected.
     * @param newLayout - the new layout just selected
     */
    loadLayout(newLayout) {
        ReScatter.viewController.loadLayout(newLayout);
    }

}


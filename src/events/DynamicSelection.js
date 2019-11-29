/**
 * Created by bvanlew on 2015.
 * Ported to ES6 24-7-17.
 */

import Observable from '../events/Observable';
// Similar to Selection model except that a dynamic selection
// has two operation put and delete. Only provides a single point
// On put a previous
// selection of the same name is over written.
//<Class definition for the DynamicSelection>
// Use PubSubJS for event/subscriber

export default class DynamicSelection extends Observable {
    constructor () {
        "use strict";
        // superclass constructor
        super("update");
        // a brush selection is an object {'originator': originator, 'dataPoints': dataPoints};
        this.activeSelection = undefined;
    };

    /**
     * Send a dynamic selection signal (these are not set in the selection control)
     * @param originator - the originating view for the selection
     * @param dataPoints - a list containing point indexes
     * @param color - an RGB colour used to display this selection
     * @param id - the selection id in the plot data description
     * @param sourceProps - meta data for the source points
     */
    putDynamicSelection (originator, dataPoints, color, id, sourceProps) {
        // originator - the originating view for the selection
        // dataPoints - a list containing coordinate {'x': , 'y': } tuples
        // color - an RGB colour used to display this selection
        // description - text
        // id - the selection id in the plot data description
        "use strict";
        color = typeof color !== 'undefined' ?  color : 0x772222;
        //this.removeDynamicSelection();
        this.activeSelection = {'originator': originator,
            'dataPoints': dataPoints,
            'color': color,
            'selectionId': id,
            'sourceProps': sourceProps
        };
        // add the selection
        this.notify({'type':'dyna', 'op':'create', 'sel': this.activeSelection, 'id': id, 'background':false});
    }

    /**
     * Send a transitive selection signal. These are picked up by another widget and
     * retransmitted based on a mapping. Can be used to give multiple views of the same data .
     * e.g. Sample plot in brainscope and the brain choropleth. The choropleth generates
     * transitive selections.
     * @param originator - originator view for the selection
     * @param dataPoints - a list of point indexes
     * @param color - an dRGB color for the selection
     * @param id - the selection id in the plot data description
     */
    putTransitiveSelection (originator, dataPoints, color, id) {
        // originator - the originating view for the selection
        // dataPoints - a list containing coordinate {'x': , 'y': } tuples
        // color - an RGB colour used to display this selection
        // id - the selection id in the plot data description
        "use strict";
        color = typeof color !== 'undefined' ?  color : 0x772222;
        let activeSelection = {'originator': originator,
            'dataPoints': dataPoints,
            'color': color,
            'selectionId': id};
        // add the selection
        this.notify({'type':'dyna', 'op':'transitive', 'sel': activeSelection, 'id': id});
    }


    removeDynamicSelection (id) {
        if (this.activeSelection && (this.activeSelection.selectionId === id)) {
            this.notify({'type':'dyna', 'op': 'delete', 'sel': this.activeSelection, 'id': this.activeSelection.selectionId});
            this.activeSelection = undefined;
        }
    }

}


//</Class definition for the DynamicSelection>

/**
 * Created by bvanlew on 24-7-17.
 */
/**
 * Created by baldur on 11/10/15.
 * ES6 port 24/07/2017
 */

import ControlProtocol from '../protocols/ControlProtocol';
import Observable from './Observable';

// On put a previous selection of the same name is over written.
//<Class definition for the ControlEventModel>
// Use PubSubJS for event/subscriber

/**
 * Class designed to be used for simple synchronous control Event notifications
 */
export default class ControlEventModel extends Observable{
    constructor() {
        "use strict";
        super("onControlEvent");
        this.activeSelection = undefined;
    }

    /**
     * Submit an event for the subscribers
     * @param eventName - a unique label for the control event to allow the subscriber to filter
     * @param event - the event details
     */
    putControlEventModel (eventName, event) {
        // eventName -
        // event - the event details
        "use strict";
        this.notify({'eventName': eventName, 'event': event});
    }

    addObserver(observer) {
        if(!ControlProtocol.hasImpl(observer)) {
            alert('ControlEvent observer: ' + observer.constructor.name + " must implement the ControlProtocol");
        }
        super.addObserver(observer);
    }
}


//</Class definition for the ControlEventModel>

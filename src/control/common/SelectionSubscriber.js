/**
 * Original created by baldur on 10/13/15.
 * Migration to ES6 by bvanlew on 24-7-17.
 */
//</Class definition for the Observable/>

import SelectionProtocol from '../../protocols/SelectionProtocol';

/**
 * @constructor
//<Class definition for the SelectionSubscriber>
 * @param {dynamicLimit} - optional integer to limit the number of
 * dynamic selection events held in the queue. If set a maximum of
 * the latest dynamicLimit events are saved.
 *
 * Use this as the base class for subscribers to selection events
 * it preimplements two event queues. One for static selections
 * the other for dynamic selections. If the dynamic selections
 * queue exceeds the dynamicLimit (e.g. mouse over events)
 * some of the oldest events are dumped. Since dynamic selections are transient
 * this is not a problem.
 */
export default class SelectionSubscriber{
    constructor(dynamicLimit) {
        'use strict';
        if(!SelectionProtocol.hasImpl(new.target)) {
            alert('SelectionSubscriber child: ' + new.target.name + ' must implement the SelectionProtocol');
        }
        this.selectionEventQueue = [];
        this.dynamicEventQueue = [];
        this.dynamicLimit = dynamicLimit;
        this.processingSelectionEventQueue = false;
        this.ready = false;
        this.processLoopTimer = undefined;
        this.processWatchdogTimer = undefined;
        this.processTimedout = true;
    }

    update (context) {
        'use strict';
        if ((context.type === 'dyna') && (this.dynamicLimit !== undefined)) {
            this.dynamicEventQueue.push(context);
            if (this.dynamicEventQueue.length > this.dynamicLimit) {
                this.dynamicEventQueue.splice(0, this.dynamicEventQueue.length - this.dynamicLimit);
            }
        } else {
            this.selectionEventQueue.push(context);
        }
        if (this.processTimedout) {
            this.processingLoop(true);
        }
    }

    processingDone () {
        'use strict';
        if (this.processWatchdogTimer) {
            clearTimeout(this.processWatchdogTimer);
        }
        this.processTimedout = false;
        this.ready = true;
    }

    /**
     * @param force - force the processing loop to process the next event
     *
     * Call with force=true to start the loop from scratch.
     * The processing loop is called via a timeout every 10ms.
     * It checks if selection event processing is finished (indicated by this.ready)
     * and if so triggers processing of the next event.
     */
    processingLoop (force) {
        'use strict';
        let self = this;
        if (force && (this.processLoopTimer !== undefined)) {
            clearTimeout(this.processLoopTimer);
            if (this.processWatchdogTimer) {
                clearTimeout(this.processWatchdogTimer);
            }
            this.processTimedout = false;
        }
        this.ready = force || this.ready;
        if (this.ready) {
            this.__processNextEvent();
        }

        this.processLoopTimer  = setTimeout(function () {
            self.processingLoop(false);
        }, 10);
    }

    /**
     *
     * @returns {event} a static or dynamic selection event from the queue or undefined
     * if there are no outstanding events.
     * @private
     * Returns the next event from the static queu (if there is one) failing that
     * returns from the dynamic queue. Failing that returns undefined.
     */
    __getNextSelectionEvent () {
        'use strict';
        let event;
        try {
            if (this.selectionEventQueue.length > 0) {
                //console.log("> Event queue length: " + this.selectionEventQueue.length + this.id);
                event = this.selectionEventQueue.shift();
                //console.log("< Event queue length: " + this.selectionEventQueue.length + this.id);
            } else if (this.dynamicEventQueue.length > 0) {
                event = this.dynamicEventQueue.shift();
            }
        }catch(e) {
            console.log('Error fetching next event ' + e);
        }
        return event;
    }

    /**
     * @private
     * Get the next event to be processed, set this.ready to false to indicate
     * event in progress and start processing.
     * A watchdog time with a timeout of 1000ms is started to trap any failing
     * processing events
     */
    __processNextEvent () {
        'use strict';
        let self = this;
        let event = this.__getNextSelectionEvent();
        if (event) {
            //console.log("Event id: ", event.id);
            this.ready = false;
            this.processTimedout = false;
            if (this.processWatchdogTimer) {
                clearTimeout(this.processWatchdogTimer);
            }
            //console.log("Processing event " + this.dumpEvent(event, 2) + " in " + this.id);
            this.processWatchdogTimer = setTimeout(function() {self.processTimedout = true;}, 1000);
            this.processSelectionEvent(event);
        }
    }

    /**
     * @override
     * @param context - the selection context object
     * Subclass must implement this in the SelectionProtocol
     */
    //processSelectionEvent (context) {
    //    "use strict";
    //    alert("Oh dear you forgot to override the processSelectionEvent in a Subscriber inheritor!!");
    // Always call processingDone when an event has been handled - yes even if it fails.
    //    this.processingDone();
    //}

}
//</Class definition for the Subscriber>

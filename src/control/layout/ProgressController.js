/**
 * Created by bvanlew on 7-8-17.
 */

import ControlProtocol from '../../protocols/ControlProtocol';
let instance = null;

/**
 * @classdesc ProgressController controls the html elements
 * that display the progress of long running events such as plot loading.
 */
export default class ProgressController {
    constructor() {
        if (instance) {
            return instance;
        }
        this.pointGroup = {};
        instance = this;
        return instance;
    }

    makeProgressString() {
        let progressString = "Loaded: ";
        let grandTotal = 0;
        let loadTotal = 0;
        let ids = Object.getOwnPropertyNames(this.totals);
        ids.forEach(x => {
            progressString += x + ": " +
                Math.round((100 * this.totals[x].loaded)/this.totals[x].total) + "% <br/>";
                grandTotal += this.totals[x].total;
                loadTotal += this.totals[x].loaded;
        })
        progressString += " Loaded: " + loadTotal + " of " + grandTotal;
        return progressString;
    }


    loadingComplete() {
        this.totals = {};
    }

    showPrompt() {
        $("#" + ReScatter.CONTROL_ID.LOADINGOVERLAY).css('display','inline');
    }

    hidePrompt() {
        $("#" + ReScatter.CONTROL_ID.LOADINGOVERLAY).css('display', 'none');
    }
}

ControlProtocol.impl(ProgressController, [], {
    onControlEvent(eventContext) {
        switch (eventContext.eventName) {
            case "showProgress":
                console.log("Show progress");
                this.showPrompt();
                setTimeout(()=>{}, 10);
                break;
            case "hideProgress":
                console.log("Hide progress");
                setTimeout(()=>{}, 10);
                this.hidePrompt();
                break;
            case "startLoading":
                this.showPrompt();
                $("#" + ReScatter.CONTROL_ID.LOADINGPROMPT).text("Loading:  " + eventContext.event.info);
                this.totals = {};
                break;
            case "loadingProgress":
                this.totals[eventContext.event.id] = {
                    total: eventContext.event.total,
                    loaded: eventContext.event.loaded
                }
                $("#" +  ReScatter.CONTROL_ID.LOADINGPROMPT).html(this.makeProgressString());
                setTimeout(()=>{}, 10);
                break;
            case "selectionsProgress":
                $("#" +  ReScatter.CONTROL_ID.LOADINGPROMPT).html(eventContext.event.selectionState);
                setTimeout(()=>{}, 10);
                break;
            default:
                return;
        }
    }

});

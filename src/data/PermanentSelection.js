/**
 * Created by bvanlew on 25-7-17.
 */
/**
 * @constructor
 * <Class definition for the PermanentSelection>
 * Use PubSubJS for event/subscriber
 * The notify function in the subscriber that is called is called 'update'
 */

import Observable from '../events/Observable';
import LookupEnum from '../utils/LookupEnum';

export default class PermanentSelection extends Observable {
    constructor () {
        "use strict";
        // superclass constructor subscribers must supply a function update
        super('update');
        //this.dataSet = dataset; // the data currently loaded
        // a brush selection is an object {'originator': originator, 'dataPoints': dataPoints};
        this.selections = {}; // a map of selectionID to selection
        this.orderedLabels = [];
        this.labelCount = 0;
        this.visibleSelection = undefined;
        this.editingLabel = undefined;
        this.editingSelection = undefined;
        this.selPriorToEdit = undefined;
        this.putOperation = PermanentSelection.editModeEnum.enum.ADDPOINTS;

    }


    static editModeEnum = new LookupEnum({
        ADDPOINTS: "Add points",
        REMOVEPOINTS: "Remove points"
    });

    /**
     *
     * @param label - unique label for the selection
     * @param originator - the originating selection generator
     * @param dataPoints - the data point indices in the selection
     * @param color - the default color of the points (may be overridden by property mapping)
     * @param description - a user readable description of the selection
     * @param selectionId - the id of the selection group
     * @param sourceProps - properties from the originator
     * @param background - if true selection is created without being displayed
     * @returns {*}
     */
    "use strict";
    putSelection (label, originator, dataPoints, color, description, selectionId, sourceProps, background = false) {
        // label - a unique label for the selection
        // originator - the originating view for the selection
        // dataPoints - list of point (integer) indices
        // color - an RGB colour used to display this selection
        // TODO Currently points can only be in one selection
        // TODO (contd) the previous selection either remains unchanged or is overwritten


        // protect against duplicate label
        // (overwriting a label requires a delete followed by a put)
        if (this.selections[label] !== undefined) {
            label = this.getNewLabel(label);
        }
        if (this.editingSelection !== undefined) {
            if (selectionId !== this.editingSelection) {
                // if in edit existing status on perform edits on the active selection
                return;
            }
            this.__editExisting(label, dataPoints);
            return;
        }
        color = typeof color !== 'undefined' ?  color : 0x772222;
        this.selections[label] = {'label': label,
            'originator': originator,
            'dataPoints': dataPoints,
            'color': color,
            'description': description,
            'selectionId': selectionId,
            'sourceProps': sourceProps,
            'background': background
        };
        this.orderedLabels.push(label);
        // add the selection
        this.notify({'type':'perm', 'op':'create', 'sel': this.selections[label], 'id': selectionId});
        // and show it if desired
        if (!background) {
            this.showSelection(label);
        }
        return label;
    }

    unionSelections (selectionLabels, originator) {
        "use strict";
        this.combineSelections(selectionLabels, originator, "Union");
    }

    intersectSelections (selectionLabels, originator) {
        "use strict";
        this.combineSelections(selectionLabels, originator, "Intersect");
    }

    subtractSelections (selectionLabels, originator) {
        "use strict";
        this.combineSelections(selectionLabels, originator, "Subtract");
    }

    combineSelections(selectionLabels, originator, op) {
        "use strict";
        let newDescrip = originator + ":";
        let newLabel = "";
        let color;
        let selectionId;
        let props;
        let dataPointSet;
        selectionLabels.forEach(function(val, index) {
            let oldSelection = this.selections[val];
            if (color === undefined) {
                color = oldSelection.color;
            }
            if (selectionId === undefined) {
                selectionId = oldSelection.selectionId;
            }
            if (props === undefined) {
                props = oldSelection.sourceProps;
            }
            // It is not reasonable to combine selections that use
            // different selection channels
            // only append those that match the first
            if (selectionId !== oldSelection.selectionId) {
                return;
            }
            newDescrip += ' ' + val;
            if (index === 0) {
                dataPointSet = new Set(oldSelection.dataPoints);
            } else {
                switch (op) {
                    case "Intersect":
                        dataPointSet = new Set([...dataPointSet].filter(x => oldSelection.dataPoints.includes(x)));
                        break;
                    case "Union":
                        dataPointSet = new Set([...dataPointSet, ...oldSelection.dataPoints]);
                        break;
                    case "Subtract":
                        dataPointSet = new Set([...dataPointSet].filter(x => !oldSelection.dataPoints.includes(x)));
                        break;
                }
            }
            newLabel += val + '/';
        }, this);
        newLabel = newLabel.slice(0, -1);
        return this.putSelection(newLabel, originator, [...dataPointSet], color, newDescrip, selectionId, props);
    }

    __editExisting (label, dataPoints) {
        "use strict";
        let selection = this.selections[this.editingLabel];
        function removeMatch(value) {
            return (dataPoints.indexOf(value) === -1);
        }
        switch(this.putOperation) {
            case PermanentSelection.editModeEnum.enum.ADDPOINTS:
                selection.dataPoints = selection.dataPoints.concat(dataPoints);
                selection.dataPoints.sort();
                break;
            case PermanentSelection.editModeEnum.enum.REMOVEPOINTS:
                selection.dataPoints = selection.dataPoints.filter(removeMatch);
                break;
            default:
                return;
        }
        this.notify({'type':'perm', 'op':'update', 'sel': selection, 'id': selection.selectionId});
        this.showSelection(selection.label);
    }

    setPutOperation (op) {
        "use strict";
        this.putOperation = op;
    }

    setEditingSelection (label) {
        "use strict";
        this.showSelection(label);
        let originalSelection = this.selections[label];
        if (originalSelection === undefined) {
            return;
        }
        // deep clone the original selection
        this.selPriorToEdit = jQuery.extend({}, originalSelection, true);
        this.editingLabel = label;
        this.editingSelection = originalSelection.selectionId;
    }

    saveEditingSelection () {
        "use strict";
        this.editingSelection = undefined;
        this.editingLabel = undefined;
        this.selPriorToEdit = undefined;
    }

    cancelEditingSelection () {
        "use strict";
        if (this.editingLabel !== undefined) {
            // revert to prior to edit state
            let label = this.selPriorToEdit.label;
            this.selections[label] = this.selPriorToEdit;
            this.selPriorToEdit = undefined;
            this.editingLabel = undefined;
            this.editingSelection = undefined;
            this.notify({'type':'perm', 'op':'update', 'sel': this.selections[label], 'id': this.selections[label].selectionId});
            this.showSelection(label);
        }
    }

    addPoints (label, dataPoints) {
        "use strict";
        let oldSelection = this.selections[label];
        if (oldSelection !== undefined) {
            this.deleteSelection(label);
        }
        let mergeArray = [];
        oldSelection.dataPoints.forEach(function(value) {
            mergeArray[value] = 1;
        });
        dataPoints.forEach(function(value) {
            mergeArray[value] = 1;
        });
        let mergePoints = [];
        mergeArray.forEach(function(value){
            if (value !== undefined) {
                mergePoints.push(value);
            }
        });
        this.putSelection(label, oldSelection.originator, mergePoints,
            oldSelection.color, oldSelection.description, oldSelection.id);

    }

    removePoints (label, dataPoints) {
        "use strict";
        let oldSelection = this.selections[label];
        if (oldSelection === undefined) {
            return;
        }
        this.deleteSelection(label);
        let mergeArray = [];
        oldSelection.dataPoints.forEach(function(value) {
            mergeArray[value] = 1;
        });
        dataPoints.forEach(function(value) {
            if (mergeArray[value] === 1) {
                mergeArray[value] = undefined;
            }
        });
        let mergePoints = [];
        mergeArray.forEach(function(value){
            if (value !== undefined) {
                mergePoints.push(value);
            }
        });
        this.putSelection(label, oldSelection.originator, mergePoints,
            oldSelection.color, oldSelection.description, oldSelection.id);
    }

    getSelection (label) {
        "use strict";
        return (this.selections[label]);
    }

    deleteSelection (label) {
        "use strict";
        let index = this.orderedLabels.indexOf(label);
        if (index >= 0) {
            let removed = this.selections[label];
            delete this.selections[label];
            this.orderedLabels.splice(index, 1);
            if (this.visibleSelection === label) {
                this.visibleSelection = undefined;
                this.notify({'type':'perm', 'op':'hide', 'sel': removed, 'id': removed.selectionId});
            }
            this.notify({'type':'perm', 'op':'delete', 'sel': removed, 'id': removed.selectionId});
        }
    }

    showSelection (label){
        "use strict";
        let sel;
        if (this.visibleSelection) {
            if (label !== this.visibleSelection) {
                sel = this.selections[this.visibleSelection];
                this.notify({'type':'perm', 'op':'hide', 'sel': sel, 'id': sel.selectionId});
            }
        }
        this.visibleSelection = label;
        sel = this.selections[this.visibleSelection];
        this.notify({'type':'perm', 'op':'show', 'sel':sel, 'id': sel.selectionId});
    }

    "use strict";
    deleteLastSelection (showPrev = true) {
        let length = this.orderedLabels.length;
        if (length > 0) {
            this.deleteSelection(this.orderedLabels[length - 1]);
            if (showPrev && (this.orderedLabels.length > 0)) {
                this.showSelection(this.orderedLabels[this.orderedLabels.length - 1]);
            }
        }
    }

    hideVisibleSelection () {
        if (this.visibleSelection) {
            let sel = this.selections[this.visibleSelection];
            this.visibleSelection = undefined;
            if (sel === undefined) {
                return; // bug workaround - this.visibleSelection not always cleared
            }
            this.notify({'op':'hide', 'sel': sel, 'id': sel.selectionId});
        }
    }

    setColor (label, color) {
        "use strict";
        if (!this.selections.hasOwnProperty(label)) {
            return;
        }
        let sel = this.selections[label];
        sel.color = color;
        this.notify({'type':'perm', 'op':'color', 'sel': sel, 'id': sel.selectionId});
    }

    getNewLabel (id) {
        "use strict";
        let label = id + '_' + this.labelCount;
        this.labelCount += 1;
        return (label);
    }

    deleteAllSelections () {
        "use strict";
        while (Object.keys(this.selections).length > 0) {
            this.deleteLastSelection(false);
        }
    }

    /**
     * Remove all selections and observers
     */
    clear() {
        this.deleteAllSelections();
        this.removeAllObservers();
    }
}


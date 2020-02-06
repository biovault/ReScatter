// Implementation note: SelectionConfig is a singleton
// Calling new on SelectionConfig() returns a single instance

// The class parses and gives access to the the selection data for
// the current layout.
export default class SelectionConfig {
    static instance;

    /**
     * Constructor returns the singleton selection model
     * That model may be (re-)initialized by providing a new layoutDef
     * @param layoutDef
     */
    constructor (layoutDef) {
        if (this.instance) {
            if (layoutDef) {
                this.instance.init(layoutDef);
            }
            return this.instance;
        }
        this.__init(layoutDef);
        this.instance = this;
    }

    __init(layoutDef) {
        this.predefinedSelections = [];
        this.staticSelections = [];
        this.dynamicSelections = [];
        this.combinedSelections = [];
        if (layoutDef.predefinedSelections) {
            this.predefinedSelections = layoutDef.predefinedSelections;
        }
        for (let plot of layoutDef.plots) {
            let selections = plot.selections;
            if (selections.selectionOut) {
                if (!this.staticSelections.includes(selections.selectionOut)) {
                    this.staticSelections.push(selections.selectionOut);
                    this.combinedSelections.push({id: selections.selectionOut, dynamic: false});
                }
            }
            if (selections.dynamicSelectionOut) {
                if (!this.dynamicSelections.includes(selections.dynamicSelectionOut)) {
                    this.dynamicSelections.push(selections.dynamicSelectionOut);
                    this.combinedSelections.push({id: selections.selectionOut, dynamic: true});
                }
            }
        }
    }

    /**
     * The returned array contains the static selections as an array of objects
     * of the format {id: <sel>, value: <sel>}
     * @returns {Array}
     */
    getStaticSelectionsAsIdValueArray() {
        let idValueArray = [];
        for (let sel of this.staticSelections) {
            idValueArray.push({id:sel, value:sel});
        }
        return idValueArray;
    }


}


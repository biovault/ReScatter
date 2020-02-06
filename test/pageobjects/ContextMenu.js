module.exports = class ContextMenu {
    constructor() {
        this.contextMenu = undefined;
    }

    open() {
        this.contextMenu = $('div[view_id="plotContextMenuUI"] > div');
        this.contextMenu.waitForDisplayed(5000);
        console.log(`ContextMenu: Context menu opened on plot: ${this.plotName}`);
    }

    toggleKdePlot() {
        this.contextMenu.$('div[view_id="kdePlotActivateId"]').$('button').click();
    }

    saveCurrentPlot() {
        this.contextMenu.$('div[view_id="savePlot"]').$('button').click();
    }

    saveAllPlots() {
        this.contextMenu.$('div[view_id="saveAllPlots"').$('button').click();
    }

    setDrawSelection() {
        this.drawSelectionButton.click();
    }

    setMouseSelection() {
        this.mouseSelectionButton.click();
    }

    setPropertySelection() {
        this.propertySelectionButton.click();
    }

    setDrawToCircle() {
        this.drawSelect.selectByIndex(0);
    }

    setDrawToRectangle() {
        this.drawSelect.selectByIndex(1);
    }

    setDrawToFreehand() {
        this.drawSelect.selectByIndex(2);
    }

    setPropertySelectToIndex(index) {
        this.propertySelect.selectByIndex(index);
    }

    setPropertySelectValue(value) {
        this.propertyValue.setValue(value);
        browser.keys('Enter');
    }

    savePropertySelection() {
        // A div hides the button so click in the browser
        browser.execute((element) => {element.click();}, this.propertySaveButton);
        browser.pause(200);
    }

    get drawSelect() {
        return this.contextMenu.$('div[view_id="brushModeId"] select');
    }

    get propertySelect() {
        return this.contextMenu.$('div[view_id="seedPropId"] select');
    }

    get propertyValue() {
        return this.contextMenu.$('div[view_id="seedPropValueId"] input');
    }

    get propertySaveButton() {
        return $('div[view_id="savePropSelectionId"] button');
    }

    get plotName() {
        return this.contextMenu.$('div[view_id="ReScatter_context_plotId"] input').getValue();
    }

    get activeSelectionMethod() {
        return this.contextMenu.$('div[view_id="ReScatter_context_selectionRadio"] input[tabindex="0"]');
    }

    get drawSelectionButton() {
        return $$('div[view_id="ReScatter_context_selectionRadio"] input+a')[0];
    }

    get mouseSelectionButton() {
        return $$('div[view_id="ReScatter_context_selectionRadio"] input+a')[1];
    }

    get propertySelectionButton() {
        return $$('div[view_id="ReScatter_context_selectionRadio"] input+a')[2];
    }

    get selectionMethodValue() {
        // the selected radio button has a tabindex of 0
        const active = this.activeSelectionMethod;
        console.log(`ContextMenu: active selection method ${active}`);
        return parseInt(active.getValue());
    }

    get numberNearestNeighbours() {
        if (this.selectionMethodValue !== 1) {
            console.log('ContextMenu: Not in mouse/neighbor selection mode');
            return undefined;
        }
        return parseInt(this.contextMenu.$('div[view_id="NumNeighboursId"]').getText().split(' ')[1]);
    }

    get kdeSigma() {
        return parseInt(this.contextMenu.$('div[view_id="kdeSigmaSlider"] div div.webix_slider_title').getText().split(':')[1]);
    }

    get kdeContours() {
        return parseInt(this.contextMenu.$('div[view_id="kdeContourCounter"] input').getValue());
    }

    get kdeColor() {
        return this.contextMenu.$('div[view_id="lutColorId"] select option[selected="true"]').getValue();
    }

    close() {
        if (!this.contextMenu) {
            return;
        }
        this.contextMenu.$('div.webix_win_head button').click();
        // wait to disappear
        $('div[view_id="plotContextMenuUI"] > div').waitForDisplayed(5000, true);
        console.log('ContextMenu: Context menu closed.');
        this.contextMenu = undefined;
    }
};
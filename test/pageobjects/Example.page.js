const Page = require('./page');
const ContextMenu = require('./ContextMenu');
const PlotCanvas = require('./PlotCanvas');
const assert = require('assert');
const { retryTimer } = require('../utils/test_utils');

/** Class containing common plot page elements*/
class ExamplePage extends Page {
    constructor() {
        super();
        this.contextMenu = undefined;
    }

    open(path) {
        super.open(path);
    }

    showDataSets() {
        this.dataSetTab.click();
    }

    getContextMenuFor(plotNumber) {
        if (this.contextMenu) {
            this.contextMenu.close();
        }
        if (plotNumber >= this.chartDivs.length) {
            assert(false, `ExamplePage: Plot at offset ${plotNumber} not found.`);
            return undefined;
        }
        this.contextMenu = new ContextMenu();
        console.log(`ExamplePage: Open context on chart ${this.chartTitlesText[plotNumber]}`);
        this.chartDivs[plotNumber].click({button: 'right'});
        this.contextMenu.open();
        return this.contextMenu;
    }

    waitForLoadComplete(delay=5000) {
        const loading = this.loadingOverlay;
        if (loading) {
            try {
                console.log('ExamplePage: Start wait for load');
                loading.waitForDisplayed(delay, true);
                console.log('ExamplePage: Load done');
            } catch (err) {
                console.log(`ExamplePage: Error in wait ${err}`);
            }
        }
    }

    saveChoroplethImages() {
        this.choroplethDiv.click({button: 'right'});
    }

    openSelections() {
        const selections = this.selectionList;
        if (!selections[0]) {
            this.loadedSelectionsTab.click();
            $('//div[@role="columnheader" and contains(text(), "Selection")]').waitForDisplayed(3000);
        }
    }

    deleteLastSelection() {
        const selectionListBefore = this.selectionList;
        const lengthBefore = selectionListBefore.length;
        const self = this;
        const testDeleted = function() {
            const selectionList = self.selectionList;
            return (selectionList.length < lengthBefore);
        };
        if (lengthBefore > 0) {
            const lastSelection = selectionListBefore.slice(-1);
            console.log(`ExamplePage: Last selection - ${lastSelection}`);
            this.deleteLastButton.click();
            retryTimer(500, testDeleted);
        }
    }

    checkContextMenu(plotNum, name, numNeigh, kdeSigma, kdeContour, kdeColor) {
        const contextMenu = this.getContextMenuFor(plotNum);
        assert.equal(contextMenu.plotName,
            name,
            `Plot is entitled ${name} - found ${contextMenu.plotName}`);
        assert.equal(contextMenu.numberNearestNeighbours,
            `${numNeigh}`,
            `Number of nearest neighbours for mouse over is ${numNeigh} - found ${contextMenu.numberNearestNeighbours}`);
        assert.equal(contextMenu.kdeSigma,
            `${kdeSigma}`,
            `Default kde sigma is ${kdeSigma} - found ${contextMenu.kdeSigma}`);
        assert.equal(contextMenu.kdeContours,
            `${kdeContour}`,
            `Default kde sigma is ${kdeContour} - found ${contextMenu.kdeContours}`);
        assert.equal(contextMenu.kdeColor,
            `${kdeColor}`,
            `Default kde color is ${kdeColor} - found ${contextMenu.kdeColor}`);
        console.log(`Context menu for plot: ${contextMenu.plotName}`);
    }

    get title() { return browser.getTitle(); }

    /** The Data sets tab */
    get dataSetTab() { return $('//*[@button_id="selectPlotsId"]');}

    get layoutButtons() { return $$('.rescatter-layout-title');}

    get layoutTitles() {
        let titles = [];
        for (let button of this.layoutButtons) {
            titles.push(button.getText());
        }
        return titles;
    }

    get controlWidgets() { return $('#ReScatterControlId_Widgets'); }

    get dataSetsButton() { return this.controlWidgets.$();}

    get chartsDiv() { return $('#ReScatter_ControlId_Charts');}

    get chartTitles() { return $$('h6.plot_title:not(:empty)');}

    get chartTitlesText () {
        let titles = [];
        for (let title of this.chartTitles) {
            titles.push(title.getText());
        }
        return titles;
    }

    get loadingOverlay() { return $('#ReScatter_ControlId_LoadingOverlay');}

    get chartDivs() {return this.chartsDiv.$$('h6.plot_title:not(:empty) + div');}

    get chartCanvases() {
        let canvases = [];
        for (let div of this.chartDivs) {
            canvases.push(new PlotCanvas(div.$('canvas')));
        }
        return canvases;
    }

    get choroplethDiv() { return $('#ReScatter_ControlId_Choropleth');}

    get loadedSelectionsTab() {
        return  $$('//div[contains(@class, "webix_accordionitem_label") and contains(.,"Loaded selections")]')[0];
    }

    get selectionList() {
        const selections = $$('//div[@view_id="selectionsDataTableId"]//div[contains(@class,"webix_first")]/div');
        return selections ? selections : [];
    }

    get selectionNames() {
        const names = [];
        this.openSelections();
        for (let sel of this.selectionList) {
            names.push(sel.getText());
        }
        return names;
    }

    get deleteLastButton() {
        this.openSelections();
        return $('//button[contains(.,"Delete last")]');
    }

}

exports.checkContextMenu = function(plotNum, name, numNeigh, kdeSigma, kdeContour, kdeColor) {
    const contextMenu = ExamplePage.getContextMenuFor(plotNum);
    assert.equal(contextMenu.plotName,
        name,
        `Plot is entitled ${name}`);
    assert.equal(contextMenu.numberNearestNeighbours,
        `${numNeigh}`,
        `Number of nearest neighbours for mouse over is ${numNeigh} - found ${contextMenu.numberNearestNeighbours}`);
    assert.equal(contextMenu.kdeSigma,
        `${kdeSigma}`,
        `Default kde sigma is ${kdeSigma} - found ${contextMenu.kdeSigma}`);
    assert.equal(contextMenu.kdeContours,
        `${kdeContour}`,
        `Default kde sigma is ${kdeContour} - found ${contextMenu.kdeContours}`);
    assert.equal(contextMenu.kdeColor,
        `${kdeColor}`,
        `Default kde color is ${kdeColor} - found ${contextMenu.kdeColor}`);
    console.log(`Context menu for plot: ${contextMenu.plotName}`);
};

module.exports = new ExamplePage();
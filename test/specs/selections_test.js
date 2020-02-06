const assert = require('assert');
// eslint-disable-next-line no-unused-vars
const { getDownloadPath, getGoldPath, waitForFileExists, assertPng } = require('../utils/test_utils');
const fs = require('fs');

const ExamplePage = require('../pageobjects/Example.page.js');

describe('Test selection functionality using example 1', () => {
    // The text positions are chose from the high density areas of the plot
    // to ensure a point is within the proximity of the mouse pointer
    // Coordinates are for a 1920 x 1080 screen, provide offset to canvas
    const canvasOffset = [246, 92];
    const digitPositions = [
        [594,210], // 0 cluster
        [605,552], // 1 cluster
        [597,352], // 2 cluster
        [743,596], // 3 cluster
        [335,438], // 4 cluster
        [927,522], // 5 cluster
        [792,330], // 6 cluster
        [527,523], // 7 cluster
        [670,678], // 8 cluster
        [459,426]  // 9 cluster
    ];

    function hasCluster(digit, chartCanvas) {
        chartCanvas.circleMouse(digitPositions[digit][0], digitPositions[digit][1], canvasOffset);
        console.log(`Selection ${digit} at ${digitPositions[digit][0]}, ${digitPositions[digit][1]}`);
        browser.pause(3000);
        browser.saveScreenshot(`./tempDownload/screenshot_1_${digit}.png`);
        //const filePath = getDownloadPath( `screenshot_1_${digit}.png`);
        //const comparePath = getGoldPath(`screenshot_1_${digit}.png`);
        //assertPng(comparePath, filePath, 0, `${comparePath} and ${filePath} should have less than 0 pixels difference`);
    }

    const numberOfSelectionsToTest = 4;
    // Reopen example 1 with a 1920 x 1080 screen to match the coords
    it('should display linked plots and choropleths visible by mouse over', () => {

        browser.setWindowSize(1920, 1080);
        ExamplePage.open('/example_1/example_1.html');
        ExamplePage.layoutButtons[0].click();
        ExamplePage.waitForLoadComplete();
        assert.strictEqual(ExamplePage.chartCanvases.length, 2, 'Expect 2 plot canvases');
        for (let i of [...Array(numberOfSelectionsToTest).keys()]) {
            hasCluster(i, ExamplePage.chartCanvases[0]);
            const downloadChoropleth = getDownloadPath( 'thematicmap_0.png');
            const renamePath = getDownloadPath( `choropleth_${i}.png`);
            console.log(`rename path: ${renamePath}`);
            const comparePath = getGoldPath(`choropleth_${i}.png`);
            const connection = browser.cdpConnection();
            console.log(`Browser connection: ${JSON.stringify(connection)}`);
            browser.cdp('Page', 'setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: '/tmp/Downloads',
            });
            ExamplePage.saveChoroplethImages();

            browser.call(() => waitForFileExists(downloadChoropleth, 5000,
                () => {
                    setTimeout(()=>{}, 500); //pause
                    // save the download to avoid it being overwritten
                    fs.copyFileSync(downloadChoropleth, renamePath);
                    setTimeout(()=>{}, 500); //pause
                    assertPng(comparePath, renamePath, 0, `${comparePath} and ${renamePath} should have less than 0 pixels difference`);
                    console.log(`choropleth_${i}.png success`);
                },
                () => {
                    assert(false, 'Failed to download plot capture');
                    console.log(`choropleth_${i}.png fail`);
                }));
        }
    });



    it('should be possible to draw a circle selection (on cluster 6)', () => {
        let contextMenu = ExamplePage.getContextMenuFor(0);
        contextMenu.setDrawSelection();
        contextMenu.setDrawToCircle();
        contextMenu.close();
        let canvas = ExamplePage.chartCanvases[0];
        canvas.drawLine(762, 304, 830, 370);
        browser.saveScreenshot('./tempDownload/drawn_circle.png');
        const filePath = getDownloadPath( 'drawn_circle.png');
        const comparePath = getGoldPath('drawn_circle.png');
        assertPng(comparePath, filePath, 0, `${comparePath} and ${filePath} should have less than 0 pixels difference`);
    });

    it('should be possible to draw a freehand selection (on cluster 7)', () => {
        let contextMenu = ExamplePage.getContextMenuFor(0);
        contextMenu.setDrawSelection();
        contextMenu.setDrawToFreehand();
        browser.saveScreenshot('./tempDownload/context_freehand.png');
        contextMenu.close();
        let canvas = ExamplePage.chartCanvases[0];
        canvas.drawPath([535, 411, 358, 622, 407, 666, 482, 660, 577, 513, 535, 411]);
        browser.saveScreenshot('./tempDownload/drawn_freehand.png');
        const filePath = getDownloadPath( 'drawn_freehand.png');
        const comparePath = getGoldPath('drawn_freehand.png');
        assertPng(comparePath, filePath, 0, `${comparePath} and ${filePath} should have less than 0 pixels difference`);
    });

    it('should be possible to draw a rectangle selection (on cluster 8)', () => {
        let contextMenu = ExamplePage.getContextMenuFor(0);
        contextMenu.setDrawSelection();
        contextMenu.setDrawToRectangle();
        contextMenu.close();
        let canvas = ExamplePage.chartCanvases[0];
        canvas.drawLine(645, 653, 702, 706);
        browser.saveScreenshot('./tempDownload/drawn_rectangle.png');
        const filePath = getDownloadPath( 'drawn_rectangle.png');
        const comparePath = getGoldPath('drawn_rectangle.png');
        assertPng(comparePath, filePath, 0, `${comparePath} and ${filePath} should have less than 0 pixels difference`);
    });

    it('should be possible to select based on a property', () => {
        let contextMenu = ExamplePage.getContextMenuFor(0);
        contextMenu.setPropertySelection();
        contextMenu.setPropertySelectToIndex(1); // the index
        contextMenu.setPropertySelectValue(600);
        contextMenu.savePropertySelection();
        contextMenu.close();
        browser.saveScreenshot('./tempDownload/prop_index_600.png');
        const filePath = getDownloadPath( 'prop_index_600.png');
        const comparePath = getGoldPath('prop_index_600.png');
        assertPng(comparePath, filePath, 0, `${comparePath} and ${filePath} should have less than 0 pixels difference`);
    });

    it('should have 4 loaded selections now with names Digits_n', () => {
        console.log('Open selections accordeon');
        ExamplePage.openSelections();
        console.log('Selections accordeon opened');
        browser.saveScreenshot('./tempDownload/four_selections_listed.png');
        const selectionNames = ExamplePage.selectionNames;
        assert.strictEqual(selectionNames.length, numberOfSelectionsToTest, `Expected ${numberOfSelectionsToTest} selections`);
        for (let i = 0; i < numberOfSelectionsToTest; i++) {
            assert.strictEqual(selectionNames[i], `Digits_${i}`, `Expected selection name Digits_${i}`);
        }
        console.log(selectionNames);
    });

    it('should be possible to delete a selection', () => {
        ExamplePage.deleteLastSelection();
        const selectionNames = ExamplePage.selectionNames;
        assert.strictEqual(selectionNames.length, numberOfSelectionsToTest -1, `Expected ${numberOfSelectionsToTest -1} selections`);
        console.log(selectionNames);
        assert.strictEqual(selectionNames.slice(-1)[0], `Digits_${numberOfSelectionsToTest - 2}`, `Expected selection name Digits_${numberOfSelectionsToTest - 2}`);
    });
});
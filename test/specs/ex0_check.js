const assert = require('assert');
const ExamplePage = require('../pageobjects/Example.page.js');

describe('Example 0 (single MNIST plot)', () => {
    it('should have the title: MNIST tSNE embedding',() => {
        ExamplePage.open('/example_0/example_0.html');
        const title = ExamplePage.title;
        assert.strictEqual(title, 'MNIST tSNE embedding');
    });

    it('should have the expected data layout', () => {
        // The data in the navigation menu
        const layoutTitles = ExamplePage.layoutTitles;
        console.log(layoutTitles[0]);
        assert.equal(layoutTitles[0], 'MNIST tSNE embedding');
        assert.equal(layoutTitles.length, 1, 'Expected a single layout');
    });
    // the plot and heading
    it('should display the Digits plot when the layout name is clicked', () => {
        try {
            ExamplePage.layoutButtons[0].click();
            ExamplePage.waitForLoadComplete();
        } catch (err) {
            console.log(`Error on load click ${err}`);
        }
        browser.setWindowSize(800, 700);
        browser.saveScreenshot('./tempDownload/example0_loaded.png');
        assert.equal(ExamplePage.chartTitlesText[0], 'Digits');
        assert.equal(ExamplePage.chartTitlesText.length, 1, 'Expected a single plot');
    });

    it('should display the context menu with the expected defaults', () => {
        // Context menu for plot at offset 0
        ExamplePage.checkContextMenu(0, 'Digits', 49, 12, 32, 'Grey');
    });
});
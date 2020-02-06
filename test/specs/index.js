// Running in sync mode - @wdio/sync installed
// const assert = require('assert');
const assert = require('assert');

const IndexPage = require('../pageobjects/Index.page');

describe('ReScatter examples site', () => {
    it('should have the ReScatter title', () => {
        IndexPage.open();
        console.log(`Title: ${IndexPage.title}`);
        assert.strictEqual(IndexPage.title, 'ReScatter library examples');

    });

    it('should contain the 6 working examples', () => {
        const links = IndexPage.exampleLinks;
        assert.equal(links.length, 6);
        links.forEach((link) => {
            console.log('Found page: ' + link.getText());
        });
    });
});


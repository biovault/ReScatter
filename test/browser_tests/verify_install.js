/**
 * Created by bvanlew on 12/05/2017.
 */
// Test to check that webdriverio installer correctly

var assert = require('assert');
describe('WebIO Sanity check', function() {
    it('Accessing the webio page should give the title', function () {
        browser.url('http://webdriver.io');
        var title = browser.getTitle();
        assert.equal(title, 'WebdriverIO - WebDriver bindings for Node.js');
    });
});


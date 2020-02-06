const Page = require('./page');

class IndexPage extends Page {
    constructor() {
        super();
    }

    open() {
        super.open('/');
    }

    get title() { return browser.getTitle(); }
    get exampleLinks() {
        const examplesTable = $('#exampleTable');
        return examplesTable.$$('a');
    }
}

module.exports = new IndexPage();
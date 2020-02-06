export default class Page {
    constructor() {
    }

    get title() { return browser.getTitle();}

    open(path) {
        browser.url(path);
        console.log('Log title from open: ' + browser.getTitle());
    }
}



module.exports = class Page {
    constructor() {
    }

    open(path) {
        browser.url(path);
    }
};
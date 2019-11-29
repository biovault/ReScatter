import Page from './page';

class MonitorTsnePage extends Page {
    /**
     * element accessors
     */

    /**
     * Get an individual element from the table header
     * @param num - 0 indexed header element
     */
    get_header_element (num) {
        let elements = browser.elements('div#tsnemonitor div.webix_ss_header table > tbody > tr:nth-child(2) > td > div');
        //console.log('num elements matched: ' + elements.value.length);
        let value = elements.value[num];
        return value;
    }

    /**
     * Get all the elements in a row
     * @param row_num - 0 indexed row number
     */
    get_row_elements (row_num) {
        let offset = row_num + 1;
        let selector = `div#tsnemonitor div.webix_ss_body > div.webix_ss_center > div > div > div:nth-child(${offset})`;
        // the rows are created asynchronously
        browser.waitForExist(selector, 10000);
        browser.logger.info('selector rows: ' + selector);
        let elements =  browser.elements(selector);
        return elements.value;
    }

    /**
     * Return the number of rows currently displayed in the monitor
     */
    get_number_of_rows() {
        let selector = 'div#tsnemonitor div.webix_ss_body > div.webix_ss_center > div > div:nth-child(1) > div';
        let first_col_children = browser.elements(selector);
        return first_col_children.value.length;
    }

    /**
     * define or overwrite page methods
     */
    open() {
        super.open('/index.html');
    }
}

module.exports = new MonitorTsnePage();

/**
 * Created by bvanlew on 12/05/2017.
 */
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-match'));
//const chaiAsPromised = require('chai-as-promised');
const MonitorTsnePage = require('./pages/monitorpage');

console.log('Log title from test: ' + browser.getTitle());
describe('The tsne job monitor page file', () => {
    it('monitorpage should have a title and the monitor header has the expected values',  () => {
        MonitorTsnePage.open();
        console.log('ttle test code: ', MonitorTsnePage.title);
        expect(MonitorTsnePage.title).to.contain('TestMonitor test page');
    });

});

describe('The header is as expected', () => {

    it ('Should have Job id, Created, Status, Completed, Removed', () => {
        MonitorTsnePage.open();
        console.log('Monitor el 0 : ' + MonitorTsnePage.get_header_element(0).getText());
        expect(MonitorTsnePage.get_header_element(0).getText()).to.contain('Job id');
        expect(MonitorTsnePage.get_header_element(1).getText()).to.contain('Created');
        expect(MonitorTsnePage.get_header_element(2).getText()).to.contain('Status');
        expect(MonitorTsnePage.get_header_element(3).getText()).to.contain('Completed');
        expect(MonitorTsnePage.get_header_element(4).getText()).to.contain('Remove');
    });
});

var beforeDate = 0;
var checkRow = function(row, num_jobs, before) {
    let after = Date.now();
    expect(row.length).to.be.equal(5);
    expect(row[0].getText()).to.match(/JOBGROUP_[0-9a-b\-]*/);
    let dateNumber = Date.parse(row[1].getText());
    console.log('Date was: ' + dateNumber);
    expect(dateNumber).to.be.within(before, after);
    //depending on timing statue and num jobs
    expect(row[2].getText()).to.be.oneOf(['queued', 'created', 'running', 'success']);
    // max jobs is 9 so no regex numeric range needed
    let regex = new RegExp(`[0-${num_jobs}] of (\\d*)`);
    expect(row[3].getText()).to.match(regex).and.capture(0).equals(num_jobs.toString());
};

describe('Can add and delete jobs', () => {
    before(function() {
        beforeDate = Date.now();
    });
    it ('Triggering add  1 job gives a new row with the appropriate data', () => {

        MonitorTsnePage.open();
        let add1Button = $('#add_job_group_1');
        add1Button.click();
        checkRow(MonitorTsnePage.get_row_elements(0), 1, beforeDate);
    });
    it ('Triggering add  2 jobs gives a new row with the appropriate data', () => {

        let add2Button = $('#add_job_group_2');
        add2Button.click();
        checkRow(MonitorTsnePage.get_row_elements(1), 2, beforeDate);
    });

    it ('Triggering add  9 jobs gives a new row with the appropriate data', () => {

        let add9Button = $('#add_job_group_9');
        add9Button.click();
        checkRow(MonitorTsnePage.get_row_elements(2), 9, beforeDate);
    });

    it ('Supports deletion of individual rows', () => {
        // test Delete click
        let numrows = 3;
        expect(MonitorTsnePage.get_number_of_rows()).to.be.equal(3);
        while(numrows--) {
            let rowels = MonitorTsnePage.get_row_elements(0);
            rowels[4].click();
            expect(MonitorTsnePage.get_number_of_rows()).to.be.equal(numrows);
        }
    });
});

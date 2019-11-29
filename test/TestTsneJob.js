//var testData;
describe('TsneJob', function(){
    'use strict';
    var before = Date.now();
    var tj = new ReScatter.TsneJob([10,20,30,40,50],ReScatter.TsneJob.SelectIs.ROW);
    var after = Date.now();
    describe('constructor', function(){
        it('should have a created time and capture the selection ', function(){
            expect(tj.createdTime).to.be.lte(after);
            expect(tj.createdTime).to.be.gte(before);
            expect(tj.submittedTime).to.be.an('undefined');
            expect(tj.completedTime).to.be.an('undefined');
            expect(tj.selection).to.be.an('Array');
            // symbol checks need chai 4.x.x - so the following is commented out
            //expect(tj.selectType).to.equal(ReScatter.TsneJob.TypeSelectEnum.ROW);
            expect(tj.selection).to.eql([10,20,30,40,50]);
        });
    });
    var response = TestGlobals.syncFileLoad('http://localhost:9876/base/BrainScope/app/static/data/smhh_01/AH_expr_show_on_genes.nrrd');
    var data = TestGlobals.nrrd.parse(response);
    var nd_data = TestGlobals.ndarray(data.data, data.sizes.slice().reverse());
    describe('addSubJob', function(){
        it ('should accept a subjob containing data for the selection', function() {
            tj.addSubJob(nd_data, ReScatter.TsneJob.SubJobIs.ROW);
            expect(tj.subJobs.length).to.equal(1);
            expect(tj.subJobs[0].resultMap).to.be.an('undefined');
        });
    });
    describe('addSubJob #2', function(){
        it ('should accept a subjob containing data for the selection', function() {
            tj.addSubJob(nd_data, ReScatter.TsneJob.SubJobIs.ROW);
            expect(tj.subJobs.length).to.equal(2);
            expect(tj.subJobs[0].resultMap).to.be.an('undefined');
        });
    });

    describe('submit', function() {
        it ('should have submitted/completedTime, results for each subjob and status success', function() {
            var before = Date.now();
            tj.submit();
            // ait up to 10 seconds
            (function theLoop (i) {
                setTimeout(function () {
                    if (--i && (tj.completedTime === undefined) ) {
                        theLoop(i);
                    } else {
                        var after = Date.now();
                        expect(tj.isStatus(ReScatter.TsneJob.StatusEnum.SUCCESS)).to.be.true;
                        expect(tj.subJobs[0].resultValue).to.equal(0);
                        expect(tj.subJobs[0].resultValue).to.equal(1);
                        expect(tj.completedTime).to.be.lte(after);
                        expect(tj.completedTime).to.be.gte(before);
                        expect(tj.submittedTime).to.be.lte(after);
                        expect(tj.submittedTime).to.be.gte(before);
                        expect(tj.submittedTime).to.be.lte(tj.completedTime);
                    }
                }, 100);
            })(100);

        });
    });
});

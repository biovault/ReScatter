// Test targets and sinon chai are loaded by karma
//var chai = require('chai');
//var sinonChai = require('sinon-chai');
//var expect = chai.expect;
//chai.use(sinonChai);

// require('../dist/rescatter');
// require('../../DimRS/dist/dimrs');

/*eslint no-undef: 'error'*/
describe ('DimRS', function() {
    'use strict';
    it('should exist as a global object', function ()
    {
        expect(DimRS).to.be.an('object');
    });
});

describe ('ReScatter', function() {
    'use strict';
    it('should exist as a global object', function ()
    {
        console.log('Test: ' + ReScatter.TsneJob.StatusEnum.FAIL.toString());
        expect(ReScatter).to.be.an('object');
    });
});

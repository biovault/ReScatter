var TestJobGlobals =  {};
TestJobGlobals.nrrd = require('nrrd-js/nrrd');
TestJobGlobals.ndarray = require('ndarray/ndarray');
TestJobGlobals.concat_col = require('ndarray-concat-cols');
TestJobGlobals.show = require('ndarray-show');
TestJobGlobals.syncFileLoad = function(url) {
    // For normal browser operation synchronous requests are
    // deprecated but for unit tests still useful

    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    // normally get binary using responseType = 'arraybuffer' - but in ugly sync code it does not work
    request.overrideMimeType('application\/octet-stream; charset=x-user-defined');
    // When the request loads, check whether it was successful
    request.send();

    if (request.status === 200) {
    // If successful, resolve the promise by passing back the request response
        var buf = new ArrayBuffer(request.response.length);
        var bytes = new Uint8Array( buf );
        for (var i = 0; i < request.response.length; i++ ){
            bytes[i] = request.response.charCodeAt(i);
        }

        return(bytes);
    } else {
    // If it fails, reject the promise with a error message
        return undefined;
    }
};

// prepare some test data
// from the wdio fixtures server
var response = TestJobGlobals.syncFileLoad('http://127.0.0.1:3000/fixtures/AH_expr_show_on_genes.nrrd');
var data = TestJobGlobals.nrrd.parse(response);
var nd_data = TestJobGlobals.ndarray(data.data, data.sizes.slice().reverse());
// Select a random subset of columns [19992 x 5]
var cols = [10,20,30,40,50];
var ex_cols = [];
cols.forEach(function(v){ex_cols.push(nd_data.pick(v, null));});
var small_subset = TestJobGlobals.concat_col(ex_cols, {dtype: 'float32'} );
TestJobGlobals.smallBuffer = TestJobGlobals.nrrd.serialize({data: small_subset.data, sizes: small_subset.shape.slice().reverse()});
// long running job with 10 x 105 samples
var rows = [...Array(500).keys()];
var ex_rows = [];
rows.forEach(function(v){ex_rows.push(nd_data.pick(null, v));});
var large_subset = TestJobGlobals.concat_col(ex_rows, {dtype: 'float32'} );
TestJobGlobals.largeBuffer = TestJobGlobals.nrrd.serialize({data: large_subset.data, sizes: large_subset.shape.slice().reverse()});


rows = [...Array(5000).keys()];
ex_rows = [];
rows.forEach(function(v){ex_rows.push(nd_data.pick(null, v));});
var huge_subset = TestJobGlobals.concat_col(ex_rows, {dtype: 'float32'} );
TestJobGlobals.hugeBuffer = TestJobGlobals.nrrd.serialize({data: huge_subset.data, sizes: huge_subset.shape.slice().reverse()});

export default TestJobGlobals;

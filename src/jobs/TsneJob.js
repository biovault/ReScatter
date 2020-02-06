/**
 * Created by bvanlew on 27/03/2017.
 */

//import * as DimRS from "DimRS";
import co from 'co';

// A tSNE job acts on a data matrix comprising rows or columns
// The job is infact a collection of one or more sub jobs.
// Each subjob has a data matrix with the same row/col definition
// to which the selection is applied and then tSNE is calculated.
//<Class for DownloadSaver >
export default class TsneJob
{
    // ES6 has no syntax for static data properties - static getter is a workaround
    // that gives access to TsneJob.<EnumName>.<EnumValue>
    // see Rauschmayer: Exploring ES6 Static data properties

    //  The status of this job object - begins with uninitialized.
    static get StatusEnum() { return {
        UNITIALIZED: Symbol('Job not yet submitted - under construction'),
        SUBMITTED: Symbol('Job submitted to dimensionality reduction service (DimRS)'),
        SUCCESS: Symbol('Job successfully completed'),
        FAIL: Symbol('Job failed'),
    };}

    // A job comprised multiple components (sub-jobs) represented by a logical-or
    // of the following values
    static get SubJobIs() { return {
        ROW: Symbol('Row job'),
        COL: Symbol('Col job'),
    };}

    // A job comprised multiple components (sub-jobs) represented by a logical-or
    // of the following values
    static get SelectIs() {return {
        ROW: Symbol('Selection is row'),
        COL: Symbol('Selection is col')
    };}

    constructor(selection, typeOfSelection) {
        this.createdTime = Date.now();
        this.selection = selection;
        this.submittedTime = undefined;
        this.completedTime = undefined;
        this.selectType =  typeOfSelection;
        this.subJobs = [];
        this.status = TsneJob.StatusEnum.UNITIALIZED;
        this.completionStatus = ''; // Use to hold the state of the
    }

    /**
     *  Add a subjob - to the tsne job - subjobs are map calculations
     *  for individual plots.
     * @param dataMatrix - an array of (normalized) data
     * @param typeSubJob - type of
     */
    addSubJob (dataMatrix, typeSubJob) {
        this.subJobs.push({
            data: dataMatrix,
            jobType: typeSubJob,
            resultMap: undefined,
            resultValue: undefined,
            tsneParams: {
                'perplexity': 30,
                'n_iter': 1000,
                'n_components': 2
            }
        });
    }

    //__submitTsneDimRS(subJob) {
    //    file_data = {
    //        'data': f
    //    }
    //}
    /**
     * Submit this job - i.e. send all subjobs to the server.
     * TODO - maybe add and optional timeout (could se very long) for jobs?
     */
    submit() {
        this.submittedTime = Date.now();
        let jobPromises = [];
        // dummy the async subjjob calls with Promises that wrap setTimeout
        // the result is the index of the subjob
        this.subJobs.forEach((subjob, i) => {
            console.log('processing subjob: ' + String(subjob.jobType));
            let jobPromise = new Promise((resolve, subjob) => {
                setTimeout(function(){
                    subjob.resultValue = i;
                    resolve(i);
                });
            });
            jobPromises.push(jobPromise);
        });
        let self = this;
        co (function*() {
            try {
                let results = yield jobPromises;
                self.completedTime = Date.now();
                self.status = TsneJob.StatusEnum.SUCCESS;
                console.log('Passed: ' + results);
                return true;
            } catch (e) {
                console.log(e);
                self.status = TsneJob.StatusEnum.FAIL;
                self.completedTime = Date.now();
                console.log('Failed' + e);
                return false;
            }
        });
    }

    isStatus(status) {
        return this.status === status;
    }
}



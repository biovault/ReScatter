import JobMonitor from './JobMonitor';
import PlotDataModel from '../data/PlotDataModel';
const nrrdjs = require('nrrd-js');
const ndarray = require('ndarray');
const scratch = require('ndarray-scratch');

/**
 * A plugin for a Dimensionality Reduction (DimRS) backend server tsne calculation
 * Actual job submission is done using the DimRS.JobGroup class
 */
export default class TsnePlugin {
    constructor() {
        let server_url = ReScatter.dimres_url;
        // eslint-disable-next-line no-undef
        this.jobGroup = new DimRS.JobGroup(server_url);
        this.jobMonitor = new JobMonitor(TsnePlugin.getAlgorithmName());
    }

    /**
     * Return a string name for the algorithm that can be used
     * to uniquely the algorithm in the configuration and
     * in the title of the generated data.
     * @returns {string}
     */
    static getAlgorithmName() {
        return 'Approximated-tSNE (server)';
    }
    /**
     * Add data to calculate to the job group along with the
     * calculation parametersfor the tSNE algorithm
     * @param dataBuffer - the data to perform tSNE on - a scijs ndarray
     * @param calculation - tsne calculation parameters:
     *      calculation:{parameters: {tsne: {perplexity: }}}
     * @return a unique key for the calculation
     */
    addJob(dataBuffer, calculation, id) {
        let calculationAxis = calculation.calcAxis; //axis for dimensionality reduction
        // nrrd shorts are defined as the interface for data to the server backend
        let nrrdBuffer;
        // The scijs transpose only changes stride information. We need really transposed
        // data in memory for the calculation.
        if (calculationAxis === PlotDataModel.axis.COL) {
            dataBuffer = dataBuffer.transpose(1,0);
            let reallyTransposedData = scratch.clone(dataBuffer);
            nrrdBuffer = nrrdjs.serialize({data: reallyTransposedData.data, sizes: reallyTransposedData.shape.slice().reverse()});
            scratch.free(reallyTransposedData);
        } else {
            nrrdBuffer = nrrdjs.serialize({data: dataBuffer.data, sizes: dataBuffer.shape.slice().reverse()});
        }
        // eslint-disable-next-line no-undef
        let tsne_params = DimRS.JobGroup.default_tsne_params;
        // For Small numbers of points a large perplexity (default is 30)
        // makes no sense we use a value that is about 1/4 the number of points with
        // a lower limit of 2. In fact tsne for small numbers of points is not advisable
        if (dataBuffer.shape[1] < 100) {
            let perplexity = Math.ceil(dataBuffer.shape[1]/4) < 2 ? 2: Math.ceil(dataBuffer.shape[1]/4);
            console.log('Reducing perplexity to: ' + perplexity + ' for ' + dataBuffer.shape[1] + ' points in plot: ' + id);
            tsne_params.perplexity = perplexity;
        }
        if (calculation.parameters && calculation.parameters.algorithmParams) {
            if (calculation.parameters.algorithmParams.perplexity) {
                tsne_params.perplexity = calculation.parameters.tsne.perplexity;
            }
        }
        console.log(`Added job, shape ${dataBuffer.shape}, perplexity: ${tsne_params.perplexity}`);
        // var debugArray = new Uint8Array(nrrdBuffer);
        // save the data in the cache for the new layout that will be created
        let dataKey = this.getJobDataKey(calculation.data);
        // eslint-disable-next-line no-undef
        this.jobGroup.addJob(nrrdBuffer, DimRS.JobGroup.JobType.ATSNE, id, tsne_params);
        return dataKey;
    }

    getJobDataKey(dataSuffix) {
        return this.jobGroup.pubsubid + '_dataMap_' + dataSuffix;
    }

    start(resultCallback, failCallback) {
        // The server returns the paits of result id and
        // tsne coordinates in an nrrd format
        // e.g.
        // [[id0, nrrd0], [id1, nrrd1], ...]
        // Unpack the nrrds to the ReScatter JSON format for plots before
        // returning.
        let unpackCallback = (results) =>{
            let coordinates = [];
            for (let result of results) {
                //Unpack the result plot to the usual JSON format:
                let resultNrrd = nrrdjs.parse(result[1]);
                let resultArray = ndarray(resultNrrd.data, resultNrrd.sizes.slice().reverse());
                let resultObject = {'dims': 2, 'points': []};
                let numPoints = resultArray.shape[1];
                for (let j = 0; j < numPoints; j++) {
                    resultObject.points.push([resultArray.get(0,j), resultArray.get(1,j)]);
                }
                coordinates.push([result[0], resultObject]);
            }
            resultCallback(coordinates);
        };
        let jobCallback = (msg, data) => {
            console.log('job: ' + msg + ' status: ' + data.status);
            if (data.status === 'success') {
                let client = this.jobMonitor.getResultClient(msg);
                client.then(unpackCallback, failCallback);
            }
        };
        PubSub.subscribe(this.jobGroup.pubsubid, function(msg,data) {
            jobCallback(msg, data);
        });
        if (this.jobGroup.jobs.length > 0) {
            this.jobMonitor.addJobGroup(this.jobGroup); // autostarts the job
        }
    }
}

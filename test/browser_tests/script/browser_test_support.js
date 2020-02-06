/**
 * Created by bvanlew on 17/05/2017.
 */
import TestJobGlobals from './utils.js';

function createJobGroup(numTsneJobs, server_url) {
    var jobGroup = new DimRS.JobGroup(server_url);
    while (numTsneJobs-- ) {
        jobGroup.addJob(TestJobGlobals.smallBuffer, DimRS.JobGroup.JobType.SINGLE_TSNE);
    }
    return jobGroup;
}

export {createJobGroup};

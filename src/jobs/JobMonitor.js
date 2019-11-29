/**
 * Created by bvanlew on 9-6-17.
 */
/**
 * Created by bvanlew on 27/03/2017.
 * Monitor running tSNE (or other dimensionality reduction jobs)
 * Each monitor can track one or more job groups from and algorithm
 *
 */

//<Class for JobMonitor >
export default class JobMonitor
{
    constructor(algorithmName) {
        this.pubsubid = "JOBMONITOR_" + Date.now() ;
        this.algorithmName = algorithmName;
        // objects keyed by the jobGroup.pubsubTopic of each job group
        this.jobGroups = {};
        this.statuses = {};
        this.progressData = {};
        this.jsonStatuses = [];
    }

    get monitoredAlgorithm() {
        return this.algorithmName;
    }

    _updateModel(jobId){
        this.jsonStatuses = [];
        for (let key of Object.keys(this.statuses)) {
            let statusObj = {};
            statusObj.jobid = key;
            statusObj.createtime = this.jobGroups[key].createdtime.toLocaleString();
            statusObj.status = this.statuses[key].status;
            statusObj.progress = '' + this.jobGroups[key].jobsdone + ' of ' + this.jobGroups[key].numSubJobs;
            statusObj.delete = '';
            this.jsonStatuses.push(statusObj);
        }
        PubSub.publish(this.pubsubid, {jobId: jobId}); // send the jobGroup.pubsubTopic
    }

    getProgressData(jobGroupId) {
        return this.progressData[jobGroupId];
    }

    /**
     * Add a new job group to the monitor. By default it is started
     * @param jobGroup - the job group
     * @param startJob - defaults to true
     */
    addJobGroup(jobGroup, startJob) {
        let autoStart = startJob || true;
        // add the initialize jobGroup and start it
        this.jobGroups[jobGroup.pubsubTopic] = jobGroup;
        this.statuses[jobGroup.pubsubTopic] = {status: jobGroup.status, jobsDone: jobGroup.numComplete};
        const progressData = {};
        for (let subJobId of jobGroup.jobIds) {
            progressData[subJobId] = null;
        }
        this.progressData[jobGroup.pubsubTopic] = progressData;
        let jobId = jobGroup.pubsubTopic;
        this._updateModel(jobId);
        PubSub.subscribe(jobId, (msg,data) => {this.jobCallback(msg, data, jobId);});
        if (autoStart) {
            jobGroup.start();
        }
    }

    /**
     * Return the job group corresponding to the key
     * @param key
     * @returns {*}
     */
    getJobGroup(key) {
        return this.jobGroups[key];
    }

    /**
     * Callback for an update to the jobGroup progress.
     * @param msg - jobGroup identifier
     * @param data - status data
     * @param jobId - the subjob id
     */
    jobCallback(msg, data, jobId) {
        this.statuses[msg] = data;
        if (data.status = DimRS.JobGroup.JobStatus.PROGRESS) {
            this.progressData[msg][data.jobId] = data.progressData;
        }
        this._updateModel(jobId);
    }

    cancelJob(jobId) {
        PubSub.unsubscribe(jobId);
        this.jobGroups[jobId].cancel();
        delete this.statuses[jobId];
        this._updateModel(jobId);
    }

    /** Returns a thenable that will retrieve all the results of all subjobs**/
    getResultClient(jobid) {
        return this.jobGroups[jobid].get_result();
    }

}


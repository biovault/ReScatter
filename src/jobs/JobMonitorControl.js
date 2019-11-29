/**
 * Created by bvanlew on 27/03/2017.
 * A visualization of the data in connected JobMonitor s
 * This maintains a control as a child of the given div id.
 *  Do not place other controls in the same div
 */
let instance = null;
import SimplePlotController from '../control/plot/SimplePlotController';
/**
 * The JobMonitorControl menu is a singleton based on the pattern in
 * Stoyan Stefanov's JavaScript Patterns 2010 pg 145
 */

//<Class for JobMonitorControl >
export default class JobMonitorControl
{
    constructor(containerId) {
        if (instance) {
            return instance;
        }
        this.containerId = containerId;
        this.monitors = new Map();
        this.jsonStatuses = [];
        this._initTable();
        this.plotPopup = null;
        this.activePlots = null;
        this.visiblePlot = null;
        this.plotInterval = null;
        this.activeGroupId = null;
        this.activeMonitorId = null;
        this.plotUpdateInterval = 500; //ms
        instance = this;
        return instance;
    }

    _initTable() {
        let container = document.getElementById(this.containerId);
        // JobMonitorControl is optional
        if (!container) {
            return;
        }
        let self = this;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        let deleteTemplate = "<input class='delbtn' type='button' value='Delete'>";
        let showTemplate = "<input class='showbtn' type='button' value='Show'>";

        this.jobMonitorControl = webix.ui({
            view: "window",
            container: self.containerId,
            hidden: true,
            move: true,
            css: "tutorialWindow",
            sizeToContent: true,
            id: "jobMonitorControlWindow",
            head: {
                view: "toolbar", margin: -4, cols: [
                    {view: "label", label: "Replot Jobs"},
                    {
                        view: "icon", icon: "times-circle", css: "alter",
                        on: {
                            onItemClick: function (id, e) {
                                instance.hideControl();
                            }
                        }
                    }
                ]
            },
            body: {
                id: 'jobMonitorControlTable',
                view: 'datatable',
                columns: [
                    {id: 'jobid', header: 'Job id', css: 'rank', adjust: 'data'},
                    {id: 'createtime', header: 'Created', adjust: 'data'},
                    {id: 'status', header: 'Status', adjust: 'data', minWidth: 80},
                    {id: 'progress', header: 'Completed', adjust: 'data', minWidth: 80},
                    {id: 'delete', header: 'Remove', adjust: 'data', template: deleteTemplate, minWidth: 80},
                    {id: 'show', header: 'Detail',  adjust: 'data', template: showTemplate, minWidth: 80},
                    {id: 'monitor', header: 'Monitor', hidden: true}
                ],
                autoheight: true,
                autowidth: true,
                // click behaviour for the delete column class delete_job
                onClick: {
                    'delbtn': (e, id, trg) => { //eslint-disable-line no-unused-vars
                        // TODO remove the job group
                        let key = this.table.getItem(id.row).jobid;
                        let monitor = this.table.getItem(id.row).monitor;
                        webix.message('Deleting job: ' + key);
                        // stop the job from reappearing in the list the callback was registered with the old closure
                        this.monitors.get(monitor).cancelJob(key)
                        return false;
                    },
                    'showbtn': (e, id, trg) => {
                        if (this.plotPopup) {
                            this.destructPopup();
                        }
                        if (!this.plotPopup) {
                            let jobgroupid = this.table.getItem(id.row).jobid;
                            let jobmonitorid = this.table.getItem(id.row).monitor;
                            this.showJobPlotPopup(jobgroupid, jobmonitorid);
                        }
                    }
                }
            }
        });
        this.table = $$('jobMonitorControlTable');
    }

    /**
     * Create a unique legal canvas id from the plot ids that may contain whitespace
     * @param jobId
     * @returns {string}
     */
    jobIdToCanvasId(jobId) {
        return 'plotCanvas_' + jobId.replace(/\W/g,'_');
    }

    /**
     * Create and display the job monitor from scratch
     * @param jobgroupid
     * @param jobmonitorid
     */
    showJobPlotPopup(jobgroupid, jobmonitorid) {
        const  jobmonitor = this.monitors.get(jobmonitorid);
        this.visiblePlot = null;
        const jobPlotPopupTemplate = {
            view:"popup",
            move: true,
            head: "Job data monitor",
            height:460,
            width:400,
            left:50, top:50,
            body:{
                view: "carousel",
                id: "jobPlotCarousel",
                cols: [], // array of canvas objects with template:
                navigation: {
                    type: "side",
                    items: false
                },
                template:"Some text"
            }
        };
        // View plots in a carousel of canvases
        // The popup disappears when user clicks outside
        const carouselCanvas = function(obj) {
            return '<div id="' + obj.id + '" style="height 380px; width: 380px"></div>' +
                '<div><div class="title" style="display:inline, float:left">' + obj.title + '</div>' +
                '<div class="text" id="ProgressPlot_' + obj.id + '" style="display:inline, float:right"></div></div>';
        };
        const jobGroup = jobmonitor.getJobGroup(jobgroupid);
        // clone the popup carousel template and set the data
        const popupDefinition = JSON.parse(JSON.stringify(jobPlotPopupTemplate));
        const jobIds = jobGroup.jobIds;
        // add the required number of  plot canvases
        // Canvas ids are plotCanvas_ = jobId
        const plotCanvases = new Array(jobGroup.numSubJobs);
        for (let i = 0; i < plotCanvases.length; i++) {
            const canvasObj = {
                id: "plotCarouselItem_" + i,
                template: carouselCanvas,
                data: {
                    id: this.jobIdToCanvasId(jobIds[i]),
                    title: jobIds[i],
                    progress: 'Job not started'
                }
            };
            plotCanvases[i] = canvasObj;
        }
        popupDefinition.body.cols = plotCanvases;
        // create  the popup
        this.plotPopup = webix.ui(popupDefinition);
        this.plotPopup.show();
        // The popup exists and the plot defaults to the first job
        this.visiblePlot = jobIds[0];
        this.plotPopup.attachEvent("onHide", () => {this.destructPopup()})
        this.activeGroupId = jobgroupid;
        this.activeMonitorId = jobmonitorid;

        // enable plot switching
        $$("jobPlotCarousel").attachEvent("onShow", id => {
            this.visiblePlot =
                $$("jobPlotCarousel").config.cols.find(function(val) {return val.id === id;}).data.title;
            this.plot();
        });
        this.activePlots = new Map();
        for (let id of jobIds) {
            // use CanvasRender to save WebGL contexts
            this.activePlots.set(id, new SimplePlotController(this.jobIdToCanvasId(id), true));
        }
        // trigger a plot (just in case data is already available - ie a completed plot)
        // force drawing  of unseen plots
        this.plot(true);
        this.plotInterval = setInterval(this.plot.bind(this), this.plotUpdateInterval);
    }

    destructPopup() {
        if (this.plotInterval) {
            clearInterval(this.plotInterval);
        }
        this.activeGroupId = null;
        this.activeMonitorId = null;
        this.plotPopup.destructor();
        this.activePlots.clear();
        this.plotPopup = null;
    }

    updateProgressText(jobId, newText) {
        document.getElementById('ProgressPlot_'+ this.jobIdToCanvasId(jobId)).innerHTML = newText;
    }

    /**
     * Upfate the active monitor plot  (if any) or all plots if forceAll is true.
     * @param forceAll - force all plots to be updated
     */
    plot(forceAll = false) {
        if (!this.plotPopup) {
            return;
        }
        const monitor = this.monitors.get(this.activeMonitorId);
        const progressData = monitor.progressData[this.activeGroupId];
        const jobGroup = monitor.getJobGroup(this.activeGroupId);
        const jobIds = jobGroup.jobIds;
        if (forceAll) {
            // plot all jobs with data and a plot
            for (let id of jobIds) {
                if (progressData[id] && progressData[id].data && this.activePlots.has(id)) {
                    this.updateProgressText(id, progressData[id].string);
                    this.activePlots.get(id).plotPoints(progressData[id].data, 3, 0x808080, 0x000000);
                }
            }
        } else {
            if (progressData[this.visiblePlot]) {
                this.updateProgressText(this.visiblePlot, progressData[this.visiblePlot].string);
                // knn steps produce no data
                if (progressData[this.visiblePlot].data) {
                    this.activePlots.get(this.visiblePlot).plotPoints(progressData[this.visiblePlot].data, 3, 0x808080, 0x000000);
                }
            }
        }
    }

    /**
     * Subscribe the control to a JobMonitor to show
     * progress for the job group.
     * @param monitor
     */
    subscribeToJobMonitor(monitor) {
        if (!this.monitors.has(monitor.pubsubid)) {
            this.monitors.set(monitor.pubsubid, monitor);
            let autoShow = true;
            PubSub.subscribe(monitor.pubsubid, (msg, data) => {
                this._updateView(msg, data);
                if (autoShow && !this.plotPopup) {
                    let id = this.table.getLastId();
                    let jobgroupid = this.table.getItem(id).jobid;
                    let jobmonitorid = this.table.getItem(id).monitor;
                    this.showJobPlotPopup(jobgroupid, jobmonitorid);
                    autoShow = false;
                }
            });
        }
    }

    // TODO could be smarter and more efficient - deletes everything and repopulates - React?
    _updateView(msg, data) {
        let jsonStatuses = [];
        this.monitors.forEach((monitor, key, map) => {
            let statuses = monitor.jsonStatuses;
            // append the job monitor reference to the status (for callback ops)
            statuses.forEach((val, index, array)=>{
               val.monitor = key;
               statuses[index] = val;
            });
            jsonStatuses.push(...monitor.jsonStatuses);
        })
        this.table.clearAll();
        this.table.parse(jsonStatuses);
    }

    getColumnData(colId) {
        let data=[];
        this.table.eachRow(
            row => {
                data.push(this.table.getItem(row)[colId]);
            }
        );
        return data;
    }

    showControl () {
        this.jobMonitorControl.show();
        this.enabled = true;
    }

    hideControl () {
        this.jobMonitorControl.hide();
        this.enabled = false;
    }

    toggleControlVisibility () {
        if (!this.enabled) {
            this.showControl();
        } else {
            this.hideControl();
        }
    }

}

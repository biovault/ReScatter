// Implementation note: SelectionContextMenu is a singleton based on the pattern in
// Stoyan Stefanov's JavaScript Patterns 2010 pg 145
// Calling new on SelectionContextMenu() returns a single instance
// the prototype can be extended as shown.


import GenerateDataPluginRunner from "../jobs/GenerateDataPluginRunner";
import JobMonitorControl from "../jobs/JobMonitorControl";
import SelectionDataWidget from "./SelectionDataWidget";
const clipboard = require('clipboard');

let instance = null;
/**
 * The SelectionContext menu is a singleton based on the pattern in
 * Stoyan Stefanov's JavaScript Patterns 2010 pg 145
 * It provides right mouse button functionality for the selections displayed
 * in the SelectionDataWidget.
 *
 * The plugin architecture allows site specific functionality to be added
 */


export default class SelectionContextMenu {

    static get PluginTypeEnum() { return {
        EXTERNAL_WEBSITE_ANALYSIS: 0,
        PROCESS_GENERATE_DATA: 1,
    };}

    constructor() {

        if (instance) {
            return instance;
        }
        let self = this;
        this.analysisPluginMap = new Map();
        this.recalculatePluginMap = new Map();
        this.jobMonitorDiv = $('#' + ReScatter.CONTROL_ID.JOBMONITOR);
        this.jobMonitorControl = new JobMonitorControl(ReScatter.CONTROL_ID.JOBMONITOR);
        this.selectionEditMenu = webix.ui({
            id: 'editSubMenuId',
            view: 'submenu',
            data: [
                "Edit",
                "Union",
                "Intersect",
                "Subtract",
                "Cancel"
            ],
            on:{
                onItemClick: function(id) {
                    // pass through to the context menu
                    let context = this.getTopMenu().getContext();
                    let item = this.getItem(id);
                    let grid = context.obj;
                    let gridId = context.id;
                    let formData = grid.getItem(gridId);
                    let modeEnum = SelectionDataWidget.modeEnum;
                    switch(item.value) {
                        case "Edit":
                            ReScatter.selectionDataWidget.startEditOp(SelectionDataWidget.modeEnum.EDIT, formData.label, formData.id);
                            break;
                        case "Union":
                            ReScatter.selectionDataWidget.startEditOp(SelectionDataWidget.modeEnum.UNION, formData.label, formData.id);
                            break;
                        case "Intersect":
                            ReScatter.selectionDataWidget.startEditOp(SelectionDataWidget.modeEnum.INTERSECT, formData.label, formData.id);
                            break;
                        case "Subtract":
                            ReScatter.selectionDataWidget.startEditOp(SelectionDataWidget.modeEnum.SUBTRACT, formData.label, formData.id);
                            break;
                        case "Cancel":
                            ReScatter.selectionDataWidget.startEditOp(SelectionDataWidget.modeEnum.NONE, formData.label, formData.id);
                            break;
                    }
                    //console.log("Submenu: " + id);
                    //self.selectionContextMenu.onItemClick(id);
                }
            }
        });
        this.selectionAnalysisMenu = webix.ui({
            id: 'analysisSubMenuId',
            view: 'submenu',
            autowidth:true,
            data: [
            ],
            on:{
                onItemClick: function(id) {
                    // pass through to the context menu
                    let context = this.getTopMenu().getContext();
                    let item = this.getItem(id);
                    let grid = context.obj;
                    let gridId = context.id;
                    let formData = grid.getItem(gridId);
                    switch(id) {
                        default:
                            instance.callPlugins(item.value, formData.selectionId, formData.label);
                            break;
                    }
                }
            }
        });
        this.replotItemFixed = [
            {value: "Show jobs"}
        ];
        this.selectionReplotMenu = webix.ui({
            id: 'replotSubMenuId',
            view: 'submenu',
            data: self.replotItemFixed,
            autowidth:true,
            on:{
                onItemClick: function(id) {
                    // pass through to the context menu
                    let context = this.getTopMenu().getContext();
                    let item = this.getItem(id);
                    let grid = context.obj;
                    let gridId = context.id;
                    let formData = grid.getItem(gridId);
                    switch(item.value) {
                        case "Show jobs":
                            instance.jobMonitorControl.showControl();
                            break;
                        default:
                            // The menu can be extended with replot plugins
                            instance.callPlugins(item.value, formData.selectionId, formData.label);
                            break;
                    }
                }
            }
        });
        this.menuItemFixed = [
                {value: "Edit...", submenu:this.selectionEditMenu},
                {value: "Analysis...", submenu:this.selectionAnalysisMenu},
                {value: "Replot...", submenu:this.selectionReplotMenu},
                {value: "Delete"},
                {value: "Export CSV"},
        ];
        this.selectionContextMenu = webix.ui({
            id:"selectionContextId",
            view:"contextmenu",
            width: 200,
            data:this.menuItemFixed,
            on:{
                onItemClick:function(id, event){
                    let context = this.getContext();
                    let grid = context.obj;
                    let gridId = context.id;
                    let funcName = this.getItem(id).value;
                    let formData = grid.getItem(gridId);

                    switch (funcName) {
                        case "Delete":
                            ReScatter.selectionModel.deleteSelection(formData.label);
                            ReScatter.selectionEditWidget.editExistingSelection(undefined);
                            break;
                        case "Export CSV":
                            instance.selectionToClipboard(event, formData.selectionId, formData.label);
                            break;
                    }
                    //webix.message("List item: <i>"+grid.getItem(gridId).selection+"</i> <br/>Context menu item: <i>"+this.getItem(id).value+"</i>");
                }
            }
        });

        instance = this;
        return instance;
    }

    // Static functions for the clipboard popup
    static saveToFile (textId, fileName) {
        ReScatter.utils.SnapshotSaver.saveTextToFile(textId, fileName);
    }

    static closeSelectionCSV (htmlId) {
        let exportDiv = $(htmlId);
        exportDiv.css({"display": "none"});
        exportDiv.html("");
        SelectionContextMenu.clipboard.destroy();
    }

    refreshAnalysisMenu() {
        let analysisMenuItemExtendable = [];
        this.analysisPluginMap.forEach((val, key, map) => {
            analysisMenuItemExtendable.push({value: key})
        });
        this.selectionAnalysisMenu.data.clearAll();
        analysisMenuItemExtendable.forEach((v, i, a) => {
            this.selectionAnalysisMenu.data.add(v);
        });
        this.selectionAnalysisMenu.refresh();
        this.selectionAnalysisMenu.resize();
    }

    refreshReplotMenu() {
        let replotMenuItemExtendable = [];
        this.recalculatePluginMap.forEach((val, key, map) => {
            replotMenuItemExtendable.push({value: key})
        });
        this.selectionReplotMenu.data.clearAll();
        let allItems = this.replotItemFixed.concat(replotMenuItemExtendable);
        allItems.forEach((v, i , a)=>{
            this.selectionReplotMenu.data.add(v);
        });
        this.selectionReplotMenu.refresh();
        this.selectionReplotMenu.resize();
    }
        /**
         * Register a plugin that performs an external analysis on the selection in a separate window
         * pluginName: The string that appears in the menu
         * symbolName: the symbol in the meta data that will be used to identify the points
         * callback: a callback function that starts the analysis. The callback signature is:
         *  - ([type list] symbols, [type string] description)
         */
    registerExternalAnalysisPlugin (pluginName, symbolName, callback) {
        this.analysisPluginMap.set(pluginName, {
            type: SelectionContextMenu.PluginTypeEnum.EXTERNAL_WEBSITE_ANALYSIS,
            symbol: symbolName,
            callback: callback});
        this.refreshAnalysisMenu();
    }

    registerGenerateDataPlugin(pluginName) {
        this.recalculatePluginMap.set(pluginName, {
            type: SelectionContextMenu.PluginTypeEnum.PROCESS_GENERATE_DATA
        });
        this.refreshReplotMenu();
    }

    callPlugins (funcName, selectionId, label) {
        if (this.analysisPluginMap.has(funcName)) {
            // pass the selection to an analysis plugin
            let analysisFunc = this.analysisPluginMap.get(funcName).callback;
            let selection = ReScatter.selectionModel.getSelection(label);
            let selectionList = [];
            let symbol = this.analysisPluginMap.get(funcName).symbol;
            selection.dataPoints.forEach(function (val, index, array) {
                selectionList.push(ReScatter.dataModel.getSelectionPropAtIndex(selectionId, val, symbol));
            });
            analysisFunc(selectionList, label);
        } else if (this.recalculatePluginMap.has(funcName)) {
            // pass the selection to a recalculate plugin
            let selection = ReScatter.selectionModel.getSelection(label);
            this.launchRecalculateDataPlugin(funcName, selection);
        }
    }

    // TODO when the context menu is shown this should be called with
    // a list based on the selection group (that defines which plugin
    // menu items are relevant)
    enablePlugins (enableList) {

    }

    getMenuUi () {
        return this.selectionContextMenu;
    }

    getEditMenuUi() {
        return this.selectionEditMenu;
    }

    selectionToClipboard (event, selectionId ,selLabel) {
        //"label","originator","dataPoints":"color","description","selectionId",
        let seln = ReScatter.selectionModel.getSelection(selLabel);
        let dataPoints = seln.dataPoints;

        let fields = Object.keys(ReScatter.dataModel.getAllSelectionPropsAtIndex(selectionId, 0));
        let csv = '__label__, ' + fields.join(',') + '\r\n';
        let rows = dataPoints.map(function(index){
            let propsForPoint = ReScatter.dataModel.getAllSelectionPropsAtIndex(selectionId, index);
            return '"' + selLabel + '",' + fields.map(function(propName){
                return '"' + (propsForPoint[propName] || '') + '"';
            }).join(',');
        });
        csv += rows.join("\r\n");
        let htmlId = "#" + ReScatter.CONTROL_ID.SELECTIONINFO;
        let exportDiv = $(htmlId);
        let controls = '<textarea id="selectionDataAsCSV", cols="80" rows="20" readonly>' + csv + '</textarea>' ;
        let self = this;
        controls += '<br/><button id="clipToKeyboardButton" class="btn" data-clipboard-action="copy" data-clipboard-target="#selectionDataAsCSV">' +
            'Copy to clipboard' +
            '</button>';
        controls += '<br/><button id="saveToFileButton" class="btn" onclick="ReScatter.widget.SelectionContextMenu.saveToFile(\'#selectionDataAsCSV\',\'' + selLabel + '\')">' +
            'Save to file' +
            '</button>';
        controls += '<br/><button id="cancelClipButton" class="btn" onclick="ReScatter.widget.SelectionContextMenu.closeSelectionCSV(\'' + htmlId + '\')">' +
            'Close' +
            '</button>';
        exportDiv.html(controls);
        exportDiv.css({"display": "inline",
                                "top": "50%",
                                "left": "50%",
                                "transform": "translate(-50%, -50%)",
                                "position": "fixed",
                                "z-index": "999",
                                "text-align": "left"});
        SelectionContextMenu.clipboard = new clipboard("#clipToKeyboardButton");
        SelectionContextMenu.clipboard.on('success', function(){setTimeout(self.closeSelectionCSV(htmlId), 1);});

    }

    launchRecalculateDataPlugin(pluginName, selection) {
        let runner = new GenerateDataPluginRunner(pluginName);
        this.jobMonitorControl.subscribeToJobMonitor(runner.monitor);
        runner.run(selection);
    }

};


/**
 * Created by baldur on 1/28/16.
 */
import webix from 'webix';
let instance = null;
export default class PreloadSelectionWidget {
    constructor() {

        if (instance) {
            return instance;
        }

        this.id = 'loadPredefinedSelectionsId';
        this.lastLoaded = '';
        let self = this;
        this.predefSelectionsDef = {
            id: self.id,
            view:'datatable',
            columns:[
                { id:'title',   header:'Name',    width:250, template:'<p>#title#<p>'},
                { id:'description',   hidden: true, header:'Description',  minWidth:120, template:'<p>#description#<p>'},
                { id:'targetId', hidden: true, header:'Type', minWidth:60, template:'<p>#targetId#</p>'}
            ],
            header:false,
            resizeColumn: true,
            fixedRowHeight:false,
            rowLineHeight:25,
            rowHeight:25,
            select:'row',
            scrollX: false,
            multiselect:false,
            on:{
                // resize the row hight based on the biggest column of the list
                onResize:webix.once(function() {
                    this.myAdjustRowHeight(['title'], true);
                    this.render();
                }),
                onSelectChange:function(){
                    let obj = this.getSelectedItem();
                    self.loadPredefinedSelections(obj);
                }
            }
        };

        this.formId = ReScatter.controlWidgetLayout.addTabView(this.predefSelectionsDef, 'Predefined selections', false);
        instance = this;
        return instance;
    }

    renewSelections(selections) {
        $$(this.formId).clearAll();
        if (selections) {
            $$(this.formId).parse(selections);
        }
    }

    getLastLoaded () {
        return this.lastLoaded; // There should only be one master plot
    }

    getPreloadControlDef () {
        return this.predefSelectionsDef;
    }

    clearLastLoaded () {
        this.lastLoaded = '';
    }

    loadPredefinedSelections (selectionObject) {
        // TODO selectionObject undefined happens on loading new data after selection (should fix cause)
        if (selectionObject === undefined) {
            return;
        }
        ReScatter.selectionTable.clearAll();
        let selectionPath = selectionObject.preselect;
        let pathAndTypeList = [{path: selectionPath, type: 'json'}];
        let self = this;
        ReScatter.dataModel.dataCache.loadFiles(
            pathAndTypeList,
            function(){self.addSelections(selectionObject.id, selectionObject.targetId, selectionPath);}
        );
        ReScatter.selectionDataWidget.expand();
    }

    addSelections (selectionId, selectionTargetId, selectionPath) {
        'use strict';
        // selection data is an array of selection objects - they are stored in a json file
        // containing an array of selection objects with selection, description, color and dataPoints
        // members, thus:
        // [
        //      {selection: 'cluster_0002', description:' another dummy test cluster', color:'#008888', dataPoints:[1,2,3,10,11,...] },
        //      ...
        // ]
        // It would be better if we could define the child function
        // dynamically  based on the ontology schema
        let selections = ReScatter.dataModel.dataCache.getFromCache(selectionPath);
        ReScatter.selectionTable.render();
        this.lastLoaded = selectionId;
        for (let i= 0, len=selections.length; i < len; i++) {
            $('#' + ReScatter.CONTROL_ID.LOADINGPROMPT).text('Loading selection:  ' + selections[i].description);
            ReScatter.selectionModel.putSelection(
                selections[i].selection,
                'Predefined',
                selections[i].dataPoints,
                parseInt(selections[i].color.replace('#', '0x')),
                selections[i].description,
                selectionTargetId,
                undefined, //no source props
                true // add in background to speed loading
            );
        }
        $('#loading').css('display','none');
    }

    hidePrivateColumns () {
        ['description', 'targetId'].forEach(function(value/*, index, array*/){
            $$(this.id).hideColumn(value);
        });
    }

    getId () {
        return this.id;
    }
}



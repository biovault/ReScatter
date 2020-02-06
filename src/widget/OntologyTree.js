/**
 * Created by baldur on 10/12/15.
 */

// Ontology tree is largely a webix treetable with additional code
// for selection events.
import webix from 'webix';
import SelectionSubscriber from '../control/common/SelectionSubscriber';
import SelectionProtocol from '../protocols/SelectionProtocol';

export default class OntologyTree extends SelectionSubscriber {
    constructor () {
        'use strict';
        super(1); // only a single dynamic selection outstanding
        // Because of an interaction with bootstrap the selection text is too light
        // TODO move to a css file
        $('div.c select option').css('color', 'black');
        $('li.cr.string .c').css('color', 'black');
        function treeTemplate(obj, common, value, config) {
            let style = ReScatter.utils.style_from_hextriplet(obj.color_hex_triplet);
            // see http://docs.webix.com/datatree__node_templates.html and http://docs.webix.com/datatable__templates.html
            let treetable = common.treetable(obj, common);
            treetable = treetable.replace('class=\'webix_tree_close\'', 'class=\'webix_tree_close\' ' + style);
            treetable = treetable.replace('class=\'webix_tree_open\'', 'class=\'webix_tree_open\' ' + style);
            treetable = treetable + common.treecheckbox(obj, common, value, config);
            return treetable + '<span><b>' + obj.acronym + '</b> ' + obj.name + '</span>';
        }
        function oneForAll(value, filter, obj) {
            if (obj.acronym.toLowerCase().indexOf(filter.toLowerCase()) !== -1) return true;
            return obj.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
        }
        let columns = [
            // using hidden breaks the templating in the second column
            //{ id:"id",    header:"id", sort: "integer", width:60, hidden:true},
            { id:'acronym', sort:'string',    header:['Search:', {content:'textFilter', compare:oneForAll, placeholder:'Enter name/acronym'}],    /*width:350,*/
                template:treeTemplate, width: 350},
            { id:'name', hidden:true}
        ];

        this.id = 'atlasTableId';
        let atlasTableDef = {
            id: this.id,
            //container:"AtlasOntology",
            view:'treetable',
            select:'row',
            //multiselect:"true",
            css:'ontology_style',
            scrollX: false,
            threeState: true,
            columns: columns,
            fixedRowHeight:false,
            rowHeight: 30,
            autoConfig:true,
            resizeColumn:true
        };

        this.atlasId = ReScatter.controlWidgetLayout.addTabView(atlasTableDef, 'Ontology', true);
        this.atlasTable = $$(this.atlasId);
        this.atlasTable.attachEvent('onItemCheck', this.atlasItemsChecked.bind(this)); // a level in the hierarchy (or a leaf) is checked
        webix.event(window, 'resize', ()=>{
            this.adjust();
        });

    }

    destroy () {
        'use strict';
        this.atlasTable.clearAll();
        // and remove from the multiview and tabbar
        ReScatter.controlWidgetLayout.removeTabView(this.atlasId);
    }

    loadOntologyData (ontologySelection, ontologyData) {
        'use strict';
        this.ontologyData = ontologyData;
        this.selectionConfig = ontologySelection;
        this.dynamicSelectionId = ontologySelection.dynamicSelectionOut;

        // It would be better if we could define the child function
        // dynamically  based on the ontology schema

        this.atlasTable.clearAll();
        let myjson = webix.DataDriver.myjson = webix.copy(webix.DataDriver.json);
        myjson.child = function (obj) {
            return obj.children;
        };
        try {
            this.atlasTable.parse(ontologyData, 'myjson');
            if (Object.prototype.hasOwnProperty.call(ontologySelection,'openId')) {
                let that = this;
                ontologySelection.openId.forEach(function(val) {
                    let idsToOpen = that.getPathToId(val);
                    idsToOpen.forEach(function (id) {
                        that.atlasTable.open(id);
                    });
                });
            }
        }
        catch(e) {
            console.log('Failed to parse or open ontology - check ontology file and configuration');
        }
        finally {
            this.atlasTable.render();
        }
    }

    getPathToId (id) {
        let rootId = this.atlasTable.getFirstId();
        let idPath = [];
        let currentId = id;
        idPath.splice(0,0,currentId);
        while(currentId !== rootId) {
            currentId = this.atlasTable.getParentId(currentId);
            idPath.splice(0,0,currentId);
        }
        return idPath;
    }

    // adjust size to parent (call on resize)
    adjust () {
        this.atlasTable.adjust();
    }

    atlasItemsChecked (/*id*/) {
        'use strict';
        // A hierarchy level has been changed (checked/unchecked) in the ontology table
        //webix.message("Click checkbox: "+id);
        let checked = this.atlasTable.getChecked();
        this.outputSelection(checked);
    }

    atlasItemCheck (/*row, column, state*/){
        'use strict';
        // A single checkbox has been changed (checked/unchecked) in the ontology table
        // TODO get this working
        // let item = this.atlasTable.getItem(row);
        // let checked = this.atlasTable.getChecked();

    }

    outputSelection (selectedIds) {
        ReScatter.dynamicSelectionModel.putTransitiveSelection(
            'OntologyTable',
            selectedIds,
            0x772222,
            this.dynamicSelectionId); // unique
    }


    getId () {
        return this.id;
    }
}

SelectionProtocol.impl(OntologyTree, [], {
    processSelectionEvent  (/*context*/) {
        // open the ontology tree and scroll to the selection
        // TODO - not implemented
        this.processingDone();
    }
});

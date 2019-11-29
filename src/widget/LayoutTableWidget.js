/**
 * Created by bvanlew on 31-5-17.
 */
/**
 * Created by baldur on 10/12/15.
 */

/**
 * @classdesc LayoutTableWidget is largely a webix treetable with additional code
 * for selection events. It is the used to visualize the layouts
 * available to the end user
 */


import LayoutWidgetBase from './base/LayoutWidgetBase';
import LayoutWidgetProtocol from '../protocols/LayoutWidgetProtocol';

export default class LayoutTableWidget extends LayoutWidgetBase {

    constructor() {
        "use strict";
        super();
        function getTitlesString(dataDescrip) {
            let res = "";
            if (dataDescrip !== undefined) {
                for (let i = 0, len = dataDescrip.length; i < len; i++) {
                    res += dataDescrip[i].id;
                    if (i < len - 1) {
                        res += ",<br>";
                    }
                }
            } else {
                res = "None";
            }
            return res;
        }

        // Public members
        this.__id = 'selectPlotsId';

        let self = this;


        this.tableData = this.parseDataFromLayouts(this.layoutData);
        // parse out the table info from the data
        this.contentTableDef = {
            id: this.id,
            view: "datatable",
            // tooltip:{template:"<p>Testing tooltip</p>"},
            columns: [
                {id: "title", header: "Name", width: 250, template: "<p style='word-wrap: break-word'>#title#<p>"},
                {
                    id: "description",
                    hidden: true,
                    header: "Description",
                    template: "<p style='word_wrap: break-word'>#description#<p>"
                },
                {
                    id: "plots", hidden: true, header: "Plots",
                    template: function (obj) {
                        return "<p style='word-wrap: break-word'>" +
                            getTitlesString(obj.plots) + "</p>";
                    }
                },
                {
                    id: "ontology", hidden: true, header: "Ontology",
                    template: function (obj) {
                        return "<p style='word-wrap: break-word'>" +
                            getTitlesString(obj.ontologies) + "</p>";
                    }
                },

                {
                    id: "choropleth", hidden: true, header: "Choropleth",
                    template: function (obj) {
                        return "<p style='word-wrap: break-word'>" +
                            getTitlesString(obj.choropleths) + "</p>";
                    }
                }
            ],
            autoheight: true,
            header: false,
            resizeColumn: true,
            fixedRowHeight: false,
            rowLineHeight: 25,
            rowHeight: 25,
            select: "row",
            multiselect: false,
            scrollX: false,
            on: {
                // resize the row hight based on the largest of the named columns
                onResize: webix.once(function () {
                    this.myAdjustRowHeight(['title'], true);
                    this.render();
                })
            },
            // Hardcoded example plot layouts
            // Notes all ids must be unique for their type
            // Plot props are defined in the scatterplot renderer and define the point plots
            data: this.tableData
        };
        this.contentTableId = ReScatter.controlWidgetLayout.addTabView(this.contentTableDef, "Data sets", false);
        this.contentTable = $$(this.contentTableId);
        // want onSelectChange to be blockable during update - one solution is to detach/reattach
        this.selectChangeEvent = this.contentTable.attachEvent('onSelectChange', function() {
            var changeHandler = self.doLoadLayout.bind(self);
            changeHandler();
        });
        this.sortingCol = 'id';
        this.sortByCol(this.sortingCol);
        // Hide columns deemed unnecessary by users
        // this.hideColumns(['description', 'plots', 'ontology', 'choropleth']);
    }

    /**
     * The webix id for the control (if any)
     * @returns {a strind id}
     */
    get id() {
        return this.__id;
    }

    /**
     * @override
     * Call with bind to the LayoutTableWidget this
     *
     */
    doLoadLayout() {
        let id = this.contentTable.getSelectedId();
        let selectedLayout;
        for (let layout of this.layoutData) {
            if (layout.id === id.id) {
                selectedLayout = layout;
            }
        }
        super.loadLayout(selectedLayout);
    }

    parseDataFromLayouts(layouts) {
        "use strict";
        let tableData = [];
        for (let layout of layouts) {
            let layoutJson = {};
            layoutJson.id = layout.id;
            layoutJson.title = layout.title;
            layoutJson.description = layout.description;
            layoutJson.plots = JSON.parse(JSON.stringify(layout.plots));
            if (layout.choropleths) {
                layoutJson.choropleths = JSON.parse(JSON.stringify(layout.choropleths));
            }
            if (layoutJson.ontologies) {
                layoutJson.ontologies = JSON.parse(JSON.stringify(layout.ontologies));
            }
            tableData.push(layoutJson);
        }
        return tableData;
    }



    hideColumns(colList) {
        "use strict";
        colList.forEach(function (val) {
            this.contentTable.hideColumn(val);
        }, this);
    }

    sortByCol(colName) {
        "use strict";
        this.contentTable.sort(colName);
        this.sortingCol = colName;
    }
}

// Required overrides for a LayoutWidget
LayoutWidgetProtocol.impl(LayoutTableWidget, [], {
    /**
     * @override
     */
    beforeContentChange() {
        // clear and update the table with the new data and restore the sort order
        this.contentTable.detachEvent(this.selectChangeEvent);
        this.contentTable.clearAll();
    },

    /**
     * @override
     */
    afterContentChange() {
        this.tableData = this.parseDataFromLayouts(this.layoutData);
        this.contentTable.parse(this.layoutData);
        this.sortByCol(this.sortingCol);
        let self = this;
        this.selectChangeEvent = this.contentTable.attachEvent('onSelectChange', function() {
            var changeHandler = self.doLoadLayout.bind(self);
            changeHandler();
        });
    },

    /**
     * @override
     */
    resize() {
        // Nothing to do for a webix control
    }
});

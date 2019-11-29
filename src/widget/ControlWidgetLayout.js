/**
 * Created by bvanlew on 26-7-17.
 */

export default class ControlWidgetLayout {
    /**
     * @constructor
     * ControlWidgetLayout contains all control widgets for layout loading,
     * predefined selections, ontology, and selection manipulation including
     * editing manipulation and uploading.
     *
     * It will locate in a div defined as follows:
     * <div id="ControlWidgetBlock"></div>
     *
     * @return Singelton. Calling new on PlotContextMenu() returns the same instance
     */
    constructor() {
        this.controlLayout = webix.ui({
            container: ReScatter.CONTROL_ID.WIDGETS,
            id:"controlLayout",
            type: "clean",
            rows:[
                {
                    gravity: 1,
                    type: "clean",
                    animate:false,
                    rows:[
                        {view:"tabbar", id:"toolTabs",
                            multiview:true, animate:false, minHeight:35,
                            align:"center", options: []
                        },
                        {view:"multiview", id:"multiViewCellsId", animate:false, type:"clean",
                            cells:[
                                {view:"template", id:"tpl", template:"ToolTabsPlaceholder"} //multiview should have at least one cell
                            ]
                        }
                    ]
                },
                {view: "resizer"},
                {
                    gravity: 3,
                    multi:true,
                    id: "selectionAccordion",
                    view:"accordion",
                    type: "clean",
                    rows:[
                        {
                            collapsed: true,
                            id: "selectionEditingId",
                            body: {rows: [
                            ]}
                        }
                    ]
                }
            ]
        });
        webix.event(window, "resize", function(){
            $$("controlLayout").adjust();
        });
        this.layoutWidgetTabs = [];
        return this;
    }

    addTabOption(webixid, title, active) {
        $$("toolTabs").addOption(webixid, title, active);
        $$("toolTabs").refresh();
        $$("multiViewCellsId").adjust();
    }

    removeTabOption(viewId) {
        $$("toolTabs").removeOption(viewId);
        $$("toolTabs").refresh();
        $$("multiViewCellsId").adjust();
    }

    resize() {
        $$("controlLayout").adjust();
    }

    addTabView(widgetDef, title, active) {
        let viewId = $$("multiViewCellsId").addView(widgetDef);
        this.addTabOption(viewId, title, active);
        return viewId;
    }

    /**
     * Wrap some HTML content in a webix template and load it into the widget tab view
     * @param contentId - the id of the html content (usually a div) form is #name
     * @param title - the title of the tabe
     * @param active - if the tab is the active tab
     */
    addLayoutTabView(contentId, title, active) {
        let layoutDef = {
            rows :[
                {id: contentId + '_in_tab', template: 'html->' + contentId}
            ]
        };
        let tabId = this.addTabView(layoutDef, title, active);
        this.layoutWidgetTabs.push(tabId);
        return tabId;
    }

    removeTabView(viewId) {
        $$("multiViewCellsId").removeView(viewId);
        this.removeTabOption(viewId);
    }

    /**
     * Remove all the layout specific tabs with widgets
     */
    removeLayoutTabs() {
        for (let tabId of this.layoutWidgetTabs) {
            this.removeTabView(tabId)
        }
        this.layoutWidgetTabs = [];
    }

    collapseSelectionEdit() {
        $$("selectionEditingId").collapse();
    }

    expandSelectionEdit() {
        $$("selectionEditingId").expand();
    }

    switchTabViewTo(viewId) {
        $$("toolTabs").setValue(viewId);
        $$("multiViewCellsId").setValue(viewId);
    }

    addAccordionView(widgetDef) {
        return $$("selectionAccordion").addView(widgetDef);
    }

    getMultiViewParent() {
        return $$('multiViewCellsId').getParentView();
    }
}

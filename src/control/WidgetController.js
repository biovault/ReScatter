/**
 * Created by bvanlew on 4-8-17.
 */
let instance = null;

import ControlWidgetLayout from '../widget/ControlWidgetLayout';
import SelectionDataWidget from '../widget/SelectionDataWidget';
import SelectionEditWidget from '../widget/SelectionEditWidget';
import SelectionUploadWidget from '../widget/SelectionUploadWidget';
import PlotContextMenu from '../widget/PlotContextMenu';
import PreloadSelectionWidget from '../widget/PreloadSelectionWidget';
import LayoutTableWidget from '../widget/LayoutTableWidget';
import TutorialControl from '../widget/TutorialControl';
import SnapShotController from "./snapshot/SnapShotController";
/**
 * @classdesc
 * WidgetController coordinated the creation and crosslinking of the various widgets involved in
 * selection and layout loading.
 */

//TODO finish migration to ES6 and toolTab linking in the widgets themselves
export default class WidgetController {
    constructor(siteConfig, controlsEnabled) {
        if (instance) {
            return instance;
        }
        this.siteConfig = siteConfig;
        this.controlsEnabled = controlsEnabled;
        this.pluginWidgets = [];
        instance = this;
        return instance;
    }

    defineControls() {
        this.widgetsEnabled = this.controlsEnabled.includes("ReScatter.CONTROL_ID.WIDGETS");
        let selectionsParent = undefined;
        if (this.widgetsEnabled) {
            // The top level layout for all control widgets
            ReScatter.controlWidgetLayout = new ControlWidgetLayout();
            // The two permanent tab entries (ontology is optional - perhaps preselection should be as well)
            ReScatter.preselectionController = new PreloadSelectionWidget();
            ReScatter.layoutTableWidget = new LayoutTableWidget();

            // The selection specific widgets that are placed as collapsible (accordion items)
            ReScatter.selectionDataWidget = new SelectionDataWidget();
            ReScatter.selectionEditWidget = new SelectionEditWidget();
            ReScatter.selectionUploadWidget = new SelectionUploadWidget();

            // switch to the load layouts view as default
            ReScatter.controlWidgetLayout.switchTabViewTo(ReScatter.layoutTableWidget.id);
            ReScatter.selectionTable = ReScatter.selectionDataWidget.selectionTable;
        }
        // Setup widget tooltips
        if (this.controlsEnabled.includes("ReScatter.CONTROL_ID.TOOLTIPCHECKBOX")) {
            let selectionsParent = ReScatter.selectionTable.getParentView();
            ReScatter.control.toolTipController.addTooltipToWebixControl(selectionsParent, 'IMESelections', 'right', 'body');
            // Finally the ontology navigator

            ReScatter.control.toolTipController.addTooltipToWebixControl(selectionsParent, 'IMESelectionEditing', 'right', 'body');

            let multiViewParent = ReScatter.controlWidgetLayout.getMultiViewParent();
            ReScatter.control.toolTipController.addTooltipToWebixControl(multiViewParent, 'IMEDataSets', 'right', 'body');
            ReScatter.control.toolTipController.setupAllToolTips();
            ReScatter.control.toolTipController.disableToolTips();
        }
        if (this.controlsEnabled.includes("ReScatter.CONTROL_ID.PLOTMENU")) {
            ReScatter.plotContextMenu = new PlotContextMenu();
        }
        if (this.controlsEnabled.includes("ReScatter.CONTROL_ID.TUTORIAL")) {
            ReScatter.tutorialControl = new TutorialControl(this.siteConfig.Tutorials);
        }
    }

    /**
     * Load and the configuration of widgets specific to the layout
     * Currently this is limited to widgets added to a extra tab in the ControlWidgetLayout
     */
    setLayoutWidgets(siteConfig) {
        let widgetList = siteConfig.Widgets;
        for (let widgetDef of widgetList) {
            let pluginName = widgetDef.plugin;
            let widgetContentId = widgetDef.contentId;
            let widgetTitle = widgetDef.title;
            ReScatter.controlWidgetLayout.addLayoutTabView(widgetContentId, widgetTitle, true);
            let pluginWidget = ReScatter.config.PluginFactory.createWidgetType(
                pluginName, widgetDef, siteConfig);
            SnapShotController.addComponent(pluginWidget);
            this.pluginWidgets.push(pluginWidget);
        }
    }

    /**
     * Clear any layout specific widgets
     */
    clearLayoutWidgets() {
        this.pluginWidgets = [];
        ReScatter.controlWidgetLayout.removeLayoutTabs();

    }

    /**
     * Resize any non-automatically handled widgets - eg the plugin specials
     */
    resize() {
        for (let widget of this.pluginWidgets) {
            widget.resize();
        }
    }
}

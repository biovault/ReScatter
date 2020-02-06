/**
 * Created by bvanlew on 28-6-17.
 */

import LayoutController from './layout/LayoutController';
import WidgetController from './WidgetController';
import PixijsPlotController from './plot/PixijsPlotController';
import ProgressController from './layout/ProgressController';
import PlotDataModel from '../data/PlotDataModel';
import LayoutCollection from '../data/LayoutCollection';
import SnapShotController from './snapshot/SnapShotController';
import ControlProtocol from '../protocols/ControlProtocol';
const jQuery = require('jquery');
// eslint-disable-next-line no-unused-vars
const resizable = require('jquery-resizable-dom');
/**
 * @class ViewController is a singleton responsible for
 * loading and unloading the
 * renderers and data associated with a layout.
 */
let instance = null;
export default class ViewController {

    constructor(siteConfig, controlsEnabled) {
        if (instance) {
            return instance;
        }
        instance = this;
        this.controlsEnabled = controlsEnabled;
        this.__init(siteConfig);
        return instance;
    }

    __init(siteConfig) {
        this.plotRenderers = [];
        this.allRenderers = {};
        this.ontologyTree = undefined;
        // site configuration should be validated using the rs_check_config tool
        this.siteConfig = siteConfig;
        this.layoutCollection = new LayoutCollection(this.siteConfig.Layouts);
        this.layoutController = new LayoutController(this.controlsEnabled);
        ReScatter.layoutManager = this.layoutController;
        this.widgetController = new WidgetController(this.siteConfig, this.controlsEnabled);
        this.progressController = new ProgressController();
        this.dataModel = new PlotDataModel();
        this.controlEventModel = ReScatter.controlEventModel;
        this.siteTitle = this.siteConfig.SiteTitle;
        this.title = '';
        this.renderPlotIndexes = [];
        this.widgetController.defineControls();
        this.selectionConfig = undefined;
        this.startupCallback = undefined;
        this.setupSliders(this);
        ReScatter.dataModel = this.dataModel;
        if (this.siteConfig.Widgets) {
            this.widgetController.setLayoutWidgets(this.siteConfig);
        }
        jQuery(window).on('unload', () => {
            this.unload();
        });

    }

    setupSliders () {
        'use strict';
        if(this.controlsEnabled.includes('ReScatter.CONTROL_ID.LEFTSPLITTER')) {
            let leftSib = jQuery('#' + ReScatter.CONTROL_ID.LEFTSPLITTER).prev();
            leftSib.resizable({
                handleSelector: '#' + ReScatter.CONTROL_ID.LEFTSPLITTER,
                resizeHeight: false,
                resizeWidth: true,
                resizeWidthFrom: 'right',
                onDrag: (e /*, $el, opt*/) => {
                    ReScatter.controlWidgetLayout.resize();
                    this.contentResize(e);
                },
                onDragEnd: (e /*, $el, opt*/) => {
                    ReScatter.controlWidgetLayout.resize();
                    this.contentResize(e);
                }
            });
        }

        if (this.controlsEnabled.includes('ReScatter.CONTROL_ID.RIGHTSPLITTER')) {
            let rightSib = jQuery('#' + ReScatter.CONTROL_ID.RIGHTSPLITTER).next();
            rightSib.resizable({
                handleSelector: '#' + ReScatter.CONTROL_ID.RIGHTSPLITTER,
                resizeHeight: false,
                resizeWidth: true,
                resizeWidthFrom: 'left',
                onDrag: (e /*, $el, opt*/) => {
                    this.contentResize(e);
                },
                onDragEnd: (e /*, $el, opt*/) => {
                    this.contentResize(e);
                }
            });
        }

    }

    contentResize (e) {
        // In principle this explicit logic could be replaces with the new ResizableObserver
        // (or the polyfill see npm) to reduce coupling in the code.
        ReScatter.viewController.plotRenderers.forEach(function(val) {
            'use strict';
            val.onResize(e);
        });
        if (ReScatter.choroplethControl) {
            ReScatter.choroplethControl.onPlethResize(e);
        }
        this.widgetController.resize();
    }

    // TODO migrate layout related stuff (renderer creation) to LayoutController: responsible for populating the layout
    // TODO migrate data related stuff to DataController: responsible for populating dataModel
    /**
     * Load a new layout and unload the existing one - if any - first.
     * @param layoutDef - the layout definition from the configuration
     * @param startupCallback - a callback to be triggered when the loading and rendering is complete
     */
    loadLayout(layoutDef, startupCallback) {
        this.unload();
        this.startupCallback = startupCallback;
        this.controlEventModel.addObserver(this);
        this.controlEventModel.addObserver(this.progressController);
        this.plotRenderers = [];
        this.numPlotsToLoad = 0;
        this.numChoroplethsToLoad = 0;
        this.title = layoutDef.title;
        this.controlEventModel.putControlEventModel('startLoading', {info: this.title});
        this.layoutDef = layoutDef;
        // setting the layout in the layout manager will start creating the choropleths
        this.layoutController.setLayout(layoutDef, this.controlsEnabled);
        ReScatter.data.DataMapper.setDataMaps(layoutDef.dataMaps);
        this.selectionConfig =  new ReScatter.config.SelectionConfig(layoutDef);
        this.dataModel.loadLayoutDefData(layoutDef,
            (pointFiles, propFiles, renderPlotIndexes, ontFiles)=>{this.loadRenderers(pointFiles, propFiles, renderPlotIndexes, ontFiles);}
        );
    }

    loadLayoutByIndex(index, startupCallback) {
        let layoutData = this.layoutCollection.getLayoutConfig();
        if (index >= 0 && index < layoutData.length) {
            this.loadLayout(layoutData[index], startupCallback);
        }
    }

    /**
     * Load the renderers for this layout. Expects data to be loaded in the cache
     */
    loadRenderers(pointFiles, propFiles, renderPlotIndexes, ontFiles) {
        this.pointData = this.dataModel.dataCache.getCachedList(pointFiles);
        this.propData = this.dataModel.dataCache.getCachedList(propFiles);
        this.renderPlotIndexes = renderPlotIndexes;
        this.ontologyData = this.dataModel.dataCache.getCachedList(ontFiles);
        this.numChoroplethsToLoad = this.layoutController.getNumberOfChoroplethsToLoad();
        this.numPlotsToLoad = this.layoutController.getTotalPlots();
        // TODO handle via event: GUI notification
        setTimeout(function() {jQuery('#main-block').resize();}, 0);
        if (this.ontologyData.length > 0) {
            this.ontology = this.ontologyData[0]; //TODO support multiple ontologies
        }

        for (let i = 0, len = this.layoutDef.plots.length; i < len; i++) {
            setTimeout((i) => this.createRenderer(i), 10, i);
        }
    }

    /**
     * Creates the individual plot renderers from the layout definition
     * with associated property data.
     * @param index
     */
    createRenderer(index) {
        let plotDef = this.layoutDef.plots[index];
        if (this.layoutController.isSpaceLayout(plotDef)) {
            return;
        }
        let dataIndex = this.renderPlotIndexes[index];
        if (dataIndex === -1) {
            // no data to plot
            return;
        }

        let plot = this.pointData[dataIndex];
        let props = this.propData[dataIndex];

        let elementId = this.layoutController.getLayoutElementId(plotDef);
        let plotRenderer = undefined;
        if (plotDef.plugin) {
            plotRenderer = ReScatter.config.PluginFactory.createPlotType(
                plotDef.plugin, elementId, plotDef, this.layoutDef.selectionConfigs);
        } else {
            plotRenderer = new PixijsPlotController(elementId, plotDef, this.layoutDef.selectionConfigs);
        }
        // set the title
        document.getElementById(elementId + '-title').innerHTML = plotDef.id;
        SnapShotController.addComponent(plotRenderer);
        this.plotRenderers.push(plotRenderer);

        let points = plot.points;
        plotRenderer.loadPlotData(points, props.voxel_props, plotDef.format);
        this.dataModel.putDataProps(plotDef, props.voxel_props);

    }

    /**
     * Unload a layout i.e. and any plots & controls (e.g. ontology)
     * connected with it
     */
    unload() {
        for (let key of Object.keys(this.allRenderers)) {
            this.allRenderers[key].destroy();
        }
        this.allRenderers = {};
        if (this.ontologyTree) {
            this.ontologyTree.destroy();
            this.ontologyTree = undefined;
        }
        this.renderPlotIndexes = [];
        this.controlEventModel.removeAllObservers();
        if (this.ontologyTree) {
            this.ontologyTree.destroy();
            this.ontologyTree = undefined;
        }
        this.ontology = undefined;
        this.startupCallback = undefined;
    }

    loadOntologyData (){
        'use strict';
        this.ontologyTree = undefined;
        if (!this.ontology) {
            return;
        }
        this.ontologyTree = new ReScatter.widget.OntologyTree();
        let ontologyData = this.ontology.msg[0];
        // We are currently using the color table from the voxel data
        // not from the ontology - there are slight differences which need
        // to be checked.

        // It would be better if we could define the child function
        // dynamically  based on the ontology schema
        //only support a single ontology
        this.ontologyTree.loadOntologyData(
            ReScatter.layoutManager.getOntology(),
            ontologyData);
    }

    setupSelections() {

        //Now the plotRenderers are initialized we can expose them to the GUI events
        let predefinedSelections = ReScatter.layoutManager.getPredefinedSelections();
        ReScatter.preselectionController.renewSelections(predefinedSelections);

        this.loadOntologyData();
        // selection data can either be the explicit selection object or
        // a file path containing a the JSON object
        ReScatter.selectionTable.clearAll();
        // Setup a single selection models to handle all selections
        // TODO this can be split into 1 selection per selection but it requires coordination
        // between the models to make sure only one selection at at time is active.
        // Or perhaps the number of active selections is a configuration item.
        // Could have two selections from multiple sources active and the results
        // overlayed.

        // Create the static and dynamic selection models

        ReScatter.selectionModel.clear();
        ReScatter.selectionModel.addObserver(ReScatter.selectionDataWidget); //Subscribe to selection events
        ReScatter.dynamicSelectionModel = new ReScatter.events.DynamicSelection();

        // Subscribe the relevant renderers to these models
        let plotsAndChoropleths = ReScatter.layoutManager.getPlots().concat(ReScatter.layoutManager.getChoropleths());
        let i,len;
        for (i = 0, len = plotsAndChoropleths.length; i < len; i++) {
            let plot = plotsAndChoropleths[i];
            // TODO improve the fragile logic here - some plots are simply spacers and others
            // might not need to listen to events
            if(plot.id !== undefined) {
                ReScatter.selectionModel.addObserver(this.allRenderers[plot.id]);
                this.controlEventModel.addObserver(this.allRenderers[plot.id]);
                ReScatter.dynamicSelectionModel.addObserver(this.allRenderers[plot.id]);
            }

        }
        // Add the plot context menu singleton for the renderers (perhaps in the renders themselves)
        this.controlEventModel.addObserver(ReScatter.plotContextMenu);
        let staticSelections = this.selectionConfig.getStaticSelectionsAsIdValueArray();
        // // TODO remove dynamic selections from plotDef - they are unused. Regular selections are upload targets

        // Update the "load-to" and dynamic selection targets
        ReScatter.selectionUploadWidget.updateOptionsFromSelections(staticSelections);
        ReScatter.controlWidgetLayout.collapseSelectionEdit();
        this.progressController.hidePrompt();
        // If there is an ontology tree show that otherwise show the predefined selections
        if (this.ontologyTree) {
            ReScatter.controlWidgetLayout.switchTabViewTo(this.ontologyTree.getId());
        } else {
            if (predefinedSelections) {
                ReScatter.controlWidgetLayout.switchTabViewTo(ReScatter.preselectionController.getId());
            }
        }

        jQuery(window).trigger('resize');
        jQuery('#title').text(this.siteTitle);
        if (this.startupCallback) {
            this.startupCallback();
        }
    }


}

ControlProtocol.impl(ViewController, [], {
    /**
     * Handle the rendererLoadComplete event that is sent when a renderer has completed loading
     * points. When all the renderers are loaded then the selection logic can be enabled.
     * @param eventContext
     */
    onControlEvent(eventContext) {
        switch (eventContext.eventName) {
        case 'rendererLoadComplete':
            if ((eventContext.event.type === 'plot') || (eventContext.event.type === 'choropleth')) {
                this.allRenderers[eventContext.event.renderer.id] = eventContext.event.renderer;
            }
            if ((Object.keys(this.allRenderers).length ===
                (this.numPlotsToLoad + this.numChoroplethsToLoad))) {
                this.progressController.loadingComplete();
                this.setupSelections();
            }
            break;
        default:
            return;
        }
    }
});

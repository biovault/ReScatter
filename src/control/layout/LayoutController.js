/**
 * Created by baldur on 1/28/16.
 * ES6 migration 6/27/17
 */

import ChoroplethLoader from '../choropleth/ChoroplethLoader';
import ToolTipController from './ToolTipController';
let toolTipController = new ToolTipController();

//
// Implementation note: LayoutController is a singleton
let instance = null;

export default class LayoutController {

    static get LayoutFlags() {return {
        CHOROPLETH: 1,
        MASTERGRID: 2
    };}

    static get LayoutTarget() {return  {
        SPACER: 0,
        MASTER: 1,
        GRID: 2
    };}


    constructor() {
        if (instance) {
            return instance;
        }
        instance = this;
        this.__init();
        this.clear();
        return instance;
    }


    __init() {
        'use strict';
    }

    clear() {
        this.idSuffix = '';
        this.layoutDef = {};
        this.gridPlots = [];
        this.masterPlots = [];
        this.idPrefix = '';
        this.totalPlotItems = 0;
        this.numSpacers = 0;
        if (ReScatter.thematicMapController) {
            ReScatter.thematicMapController.destroy();
            ReScatter.thematicMapController = undefined;
        }
        if (this.ontologyTree) {
            this.ontologyTree.destroy();
            this.ontologyTree = undefined;
        }
        this.layoutDef = {};
        this.chartNode = document.getElementById(ReScatter.CONTROL_ID.CHARTS);
        this.chartNode.innerHTML = '';
    }

    setLayout(layoutDef, controlsEnabled) {
        this.clear();
        this.controlsEnabled = controlsEnabled;
        this.layoutDef = layoutDef;
        layoutDef.plots.forEach(function(val) {
            switch(val.layoutTarget) {
            case LayoutController.LayoutTarget.MASTER:
                this.masterPlots.push(val);
                break;
            case LayoutController.LayoutTarget.GRID:
                this.gridPlots.push(val);
                break;
            default:
                this.gridPlots.push(val);
                this.numSpacers += 1;
                break;
            }
        }, this);
        this.totalPlotItems = this.gridPlots.length + this.masterPlots.length;
        let layoutFlags = 0;
        if (layoutDef.choropleths !== undefined) {
            layoutFlags |= LayoutController.LayoutFlags.CHOROPLETH;
        }
        if (this.masterPlots.length > 0) {
            layoutFlags |= LayoutController.LayoutFlags.MASTERGRID;
        }
        let numberOfPlots = this.gridPlots.length;
        if (layoutFlags & LayoutController.LayoutFlags.MASTERGRID) {
            this.chartNode.innerHTML = ReScatter.masterGridLayout;
            this.idPrefix = 'mg-subPlot-';
            this.idSuffix = '-8';
        } else {
            if (numberOfPlots === 1) {
                this.idSuffix = '-1';
                this.chartNode.innerHTML = ReScatter.singlePlotLayout;
            } else if (numberOfPlots>= 2) {
                //we don't support more than 8 plots - maybe extend
                this.chartNode.innerHTML = ReScatter.gridPlotLayout;
                this.idSuffix = '-8';
            }
            this.idPrefix = 'subPlot-';
        }

        this.choroplethEnabled = this.controlsEnabled.includes('ReScatter.CONTROL_ID.CHOROPLETH');
        if (this.choroplethEnabled) {
            let footer = document.getElementById(ReScatter.CONTROL_ID.IMAGESTRIPFOOTER);
            if (!(layoutFlags & LayoutController.LayoutFlags.CHOROPLETH)) {
                document.getElementById(ReScatter.CONTROL_ID.CHOROPLETH).style.display = 'none';
                if (footer) {
                    footer.classList.add('hidden_strip_footer');
                    footer.classList.remove('visible_strip_footer');
                    footer.innerHTML = '';
                }
            } else {
                document.getElementById(ReScatter.CONTROL_ID.CHOROPLETH).style.display = 'inline-block';
                if (footer) {
                    footer.classList.add('visible_strip_footer');
                    footer.classList.remove('hidden_strip_footer');
                }
                // for now there is only room for a single choropleth but it can contain multiple svg maps
                let plethDescrip = layoutDef.choropleths[0];
                ReScatter.thematicMapController = new ChoroplethLoader(plethDescrip, ReScatter.CONTROL_ID.CHOROPLETH, ReScatter.CONTROL_ID.ANNOTATECHOROPLETH, ReScatter.CONTROL_ID.IMAGESTRIPFOOTER);
                ReScatter.thematicMapController.initialize();
            }
        }

        toolTipController.addTooltip(ReScatter.CONTROL_ID.CHARTS, 'IMEScatterPlot', 'left', 'body');
        return this.idSuffix;
    }

    getLayoutElementId(plot) {
        let index = this.gridPlots.indexOf(plot);
        if (index !== -1) {
            return this.idPrefix + (index + 1) + this.idSuffix;
        }
        return 'mg-master'; // There should only be one master plot
    }

    isSpaceLayout(plot) {
        return (plot.layoutTarget === LayoutController.LayoutTarget.SPACER);
    }

    getTotalPlots() {
        return this.totalPlotItems - this.numSpacers;
    }

    /** clearTitles
     *  clear all the layout plot titles
     */
    clearTitles() {
        let plotTitles = document.getElementsByClassName('plot_title');
        for (let i= 0, len = plotTitles.length; i<len; i++) {
            plotTitles.item(i).innerHTML = '';
        }
    }

    /**
     * getCanvasPlotIds
     * Return tuples of canvas and plot ids for canvases containing a plot
     * @returns array of tuples [[canvasId, plotId],...]
     */
    getCanvasPlotIds() {
        let canvasPlotIds = [];
        this.layoutDef.plots.forEach(function(val) {
            let id = this.getLayoutElementId(val);
            if (!this.isSpaceLayout(val)) {
                canvasPlotIds.push([id, val.id]);
            }
        }, this);
        return canvasPlotIds;
    }

    /**
     * getCanvasSvgId
     * Return a single tuple for the SVG choropleth
     */
    getCanvasSvgId() {
        if (ReScatter.thematicMapController !== undefined) {
            return ReScatter.thematicMapController.getMapContainerId();
        }
        return null;
    }

    /**
     * Will return 0 or 1 depending on the config - only a single choropleth is supported now
     * @returns {number}
     */
    getNumberOfChoroplethsToLoad() {
        return this.layoutDef.choropleths !== undefined? 1: 0;
    }

    /**
     * If aontologies exists return the first one (only a single ontology is supported)
     * otherwise returns undefined.
     * @returns {*}
     */
    getOntology() {
        if (!this.layoutDef.ontologies) {
            return undefined;
        }
        return this.layoutDef.ontologies[0];
    }

    /**
     * Get the predefined selections array
     * @returns {Array}
     */
    getPredefinedSelections() {
        return this.layoutDef.predefinedSelections;
    }

    /**
     * Return the plot array
     * @returns {Array}
     */
    getPlots() {
        return this.layoutDef.plots;
    }

    /**
     * Return the recalculation configuration
     * @returns {object}
     */
    getRecalculation() {
        return this.layoutDef.recalculation;
    }
    /**
     * Returns the array of choropleths or and empyt array if there are none
     * @returns {Array}
     */
    getChoropleths() {
        if (!this.layoutDef.choropleths) {
            return [];
        }
        return this.layoutDef.choropleths;
    }

    /**
     * Return the array of daya maps from the configuration
     * @returns {Array|*}
     */
    getDataMaps() {
        return this.layoutDef.dataMaps;
    }

    /**
     * Return the base data maps needed for recalculation
     * @returns {Array| undefined}
     */
    getBaseDataMaps() {
        if (this.layoutDef.recalculation) {
            return this.layoutDef.recalculation.baseDataMaps;
        }
        return undefined;
    }

    /**
     * Return the unique id for the loaded layout
     */
    getId() {
        return this.layoutDef.id;
    }
}

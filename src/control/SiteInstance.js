import TsnePlugin from "../jobs/TsnePlugin";

/**
 * Created by bvanlew on 4-8-17.
 */

let instance = null;
import PluginFactory from '../config/plugins/PluginFactory';
import StartupSelection from '../events/StartupSelection';
export default class SiteInstance {
    /**
     * @constructor
     * @param siteConfig - a JSON site configuration, see documentation for information
     * @param debugOn - true to enable console messages - default false
     * @returns {*}
     */
    constructor(siteConfig, debugOn) {
        if (instance) {
            return instance;
        }
        if (!siteConfig) {
            alert("Set up a siteConfig before starting the SiteInstance")
        }
        ReScatter.debugOn = Boolean(debugOn);
        // Plugin setups
        PluginFactory.registerChoroplethType("ChoroplethSVGView", ReScatter.view.ChoroplethSVGView);
        if (siteConfig.ChoroplethPlugins) {
            Object.entries(siteConfig.ChoroplethPlugins).forEach((val) => {
                PluginFactory.registerChoroplethType(val[0], val[1]);
            });
        }
        PluginFactory.registerPlotType("PixijsPlotController", ReScatter.control.PixijsPlotController);
        if (siteConfig.PlotPlugins) {
            Object.entries(siteConfig.PlotPlugins).forEach((val) => {
                PluginFactory.registerPlotType(val[0], val[1]);
            });
        }
        PluginFactory.registerWidgetType("LayoutTableWidget", ReScatter.widget.LayoutTableWidget);
        if (siteConfig.WidgetPlugins) {
            Object.entries(siteConfig.WidgetPlugins).forEach((val) => {
                PluginFactory.registerWidgetType(val[0], val[1]);
            });
        }
        this.controlsEnabled = ReScatter.utils.control_ids_to_strings();
        this.siteConfig = siteConfig;
        this.__addRowHeightFuncToWebix();
        ReScatter.viewController = new ReScatter.control.ViewController(this.siteConfig, this.controlsEnabled);
        this.startupSelection = new StartupSelection();
        this.startupSelection.performStartupAction();
        // If dimres is available register the tSNE plugin
        if (ReScatter.dimres_url) {
            PluginFactory.registerDataJobType(TsnePlugin.getAlgorithmName(), ReScatter.jobs.TsnePlugin);
        }
        instance = this;
        return this;
    }

    __addRowHeightFuncToWebix() {
        webix.extend(webix.ui.datatable,
            {
                myAdjustRowHeight: function (id, silent, rId) {
                    "use strict";
                    function processRow(that, obj) {
                        var h = [that.config.rowHeight], config;
                        for (var i = 0; i < id.length; i++) {
                            config = that.getColumnConfig(id[i]);
                            d.style.width = config.width + "px";
                            d.innerHTML = that.getText(obj.id, config.id);
                            h.push(d.scrollHeight);
                        }
                        obj.$height = Math.max.apply(null, h);
                    }

                    if (typeof id === 'string') {
                        id = [id];
                    }

                    var d = webix.html.create("DIV", {
                        "class": "webix_table_cell webix_measure_size webix_cell"
                    }, "");
                    d.style.cssText = "height:1px; visibility:hidden; position:absolute; top:0px; left:0px; overflow:hidden;";
                    this.$view.appendChild(d);

                    if (rId) {
                        var obj = this.getItem(rId);
                        processRow(this, obj);
                    }
                    else {
                        this.data.each(function (obj) {
                            processRow(this, obj);
                        }, this);
                    }

                    d = webix.html.remove(d);
                    if (!silent) {
                        this.refresh();
                    }
                }
            }
        );
    }
}

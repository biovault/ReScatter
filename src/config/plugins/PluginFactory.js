/**
 * Created by baldur on 6/2/2018.
 */
import ChoroplethProtocol from '../../protocols/ChoroplethProtocol';
import PlotProtocol from '../../protocols/PlotProtocol';
/**
 * PluginFactory is a set of register/create static commands for
 * adding user defined overrides
 */

const PluginFactory = {

    _choroplethTypeMap: new Map(),  // user defined choropleth widget plugins
    _plotTypeMap: new Map(),        // user defined plot widget plugins
    _widgetTypeMap: new Map(),      // user defined layout widget plugins
    _jobTypeMap: new Map(),         // user defined layout widget plugins
    _preprocessTypeMap: new Map(),  // user defined data preprocessing for jobs

    /**
     *
     * @param name
     */
    registerChoroplethType(name, classdef) {
        if (!ChoroplethProtocol.hasImpl(classdef)) {
            alert('Choropleth plugin must implement the ChoroplethProtocol! ' + name);
            return;
        }
        if (!PluginFactory._choroplethTypeMap.has(name)){
            PluginFactory._choroplethTypeMap.set(name, classdef);
        }
    },

    createChoroplethType(name, ...params) {
        if (PluginFactory._choroplethTypeMap.has(name)) {
            let classdef = PluginFactory._choroplethTypeMap.get(name);
            let object = new classdef(...params);
            return object;
        }
        console.error('The choropleth plugin class: ' + name + ' is not reqistered');
        return null;
    },

    registerPlotType(name, classdef) {
        if (!PlotProtocol.hasImpl(classdef)) {
            alert('Plot plugin must implement the PlotProtocol! ' + name);
            return;
        }
        if (!PluginFactory._plotTypeMap.has(name)){
            PluginFactory._plotTypeMap.set(name, classdef);
        }
    },

    createPlotType(name, ...params) {
        if (PluginFactory._plotTypeMap.has(name)) {
            let classdef = PluginFactory._plotTypeMap.get(name);
            let object = new classdef(...params);
            return object;
        }
        console.error('The plot plugin class: ' + name + ' is not reqistered');
        return null;
    },

    registerWidgetType(name, classdef) {
        if (!PluginFactory._widgetTypeMap.has(name)){
            PluginFactory._widgetTypeMap.set(name, classdef);
        }
    },

    createWidgetType(name, ...params) {
        if (PluginFactory._widgetTypeMap.has(name)) {
            let classdef = PluginFactory._widgetTypeMap.get(name);
            let object = new classdef(...params);
            return object;
        }
        console.error('The widget plugin class: ' + name + ' is not reqistered');
        return null;
    },

    // Data jobs are included in the selection menu
    registerDataJobType(name, classdef) {
        if (!PluginFactory._jobTypeMap.has(name)){
            PluginFactory._jobTypeMap.set(name, classdef);
            let selectionContextMenu = new ReScatter.widget.SelectionContextMenu();
            selectionContextMenu.registerGenerateDataPlugin(name);
        }
    },

    createDataJobType(name, ...params) {
        if (PluginFactory._jobTypeMap.has(name)) {
            let classdef = PluginFactory._jobTypeMap.get(name);
            let object = new classdef(...params);
            return object;
        }
        console.error('The selection job plugin class: ' + name + ' is not reqistered');
        return null;
    },

    // Data jobs are included in the selection menu
    registerPreprocessType(name, classdef) {
        if (!PluginFactory._preprocessTypeMap.has(name)){
            PluginFactory._preprocessTypeMap.set(name, classdef);
        }
    },

    createPreprocessType(name, ...params) {
        if (PluginFactory._preprocessTypeMap.has(name)) {
            let classdef = PluginFactory._preprocessTypeMap.get(name);
            let object = new classdef(...params);
            return object;
        }
        console.error('The preprocess plugin class: ' + name + ' is not reqistered');
        return null;
    },
};

export default PluginFactory;

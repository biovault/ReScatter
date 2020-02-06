/**
 * Created by bvanlew on 13-3-18.
 * Integrate a d3 based radviz plot into a ReScatter page
 * Using the radviz implementation by Chris Viau at https://github.com/biovisualize/radviz
 */

export default class RadvizPlotPlugin extends ReScatter.control.SelectionSubscriber {
    /**
     *
     * @param elementId - the html id of the parent container
     * @param plotInfo - plot configuration
     * @param selectionConfigs - either undefined (if only a single config is
     *  defined for the plot) or a list of config names.
     */
    constructor(elementId, plotInfo) {
        super(2);
        this.elementId = elementId;
        this.parentElement = document.querySelector('#' + this.elementId);
        this.id = plotInfo.id;
        // SwitchableSelections supports configuration of multiple (dynamically) switchable
        // property sets per point. We assume here that the is only 1 set of
        // properties.
        this.incomingSelections = ReScatter.config.SwitchableSelections.newFromPlotInfo(plotInfo);
        this.currentConfig = 'Default';
        this.selectionIn = this.incomingSelections.getSelectionMapping(this.currentConfig);
        this.dynamicSelectionIn = this.incomingSelections.getDynamicSelectionMapping(this.currentConfig);
        this.staticSelections = {};
        this.activeSelection = '';
        window.addEventListener('resize', this.onResize.bind(this));
    }

    __processDynamicSelection(context) {
        let selectionMap = this.dynamicSelectionIn[context.id];
        if (!selectionMap) {
            return;
        }
        switch(context.op) {
        case 'create':
            this.__showSelectionInPlot(context, selectionMap);
            break;
        case 'delete':
            if (this.activeSelection) {
                this.data = this.staticSelections[this.activeSelection];
            } else {
                this.data = [];
            }
            this.__refresh();
            break;
        }
    }

    __processStaticSelection(context) {
        let selectionMap = this.selectionIn[context.id];

        switch(context.op) {
        case 'create':
            this.__showSelectionInPlot(context, selectionMap, this.staticSelections);
            this.activeSelection = context.sel.label;
            break;
        case 'show':
            this.data = this.staticSelections[context.sel.label];
            this.__refresh();
            this.activeSelection = context.sel.label;
            break;
        case 'hide':
            if (this.activeSelection === context.sel.label) {
                this.data = [];
                this.__refresh();
                this.activeSelection = '';
            }
            break;
        case 'delete':
            if (this.staticSelections[context.sel.label]) {
                delete(this.staticSelections[context.sel.label]);
                if (this.activeSelection === context.sel.label) {
                    this.activeSelection = '';
                    this.data = [];
                    this.__refresh();
                }
            }
            break;
        }

    }

    __showSelectionInPlot(context, selectionMap, staticSelections) {
        // Use the Rescatter DataMapper to get the PCA values via the cache
        let dataMapper = ReScatter.data.DataMapper.getDataMap(selectionMap.dataMap);
        let self = this;
        // The DataMapper has an inbuilt function for quick access to all the columns
        // (in this case the PCA) corresponding to the data points in the incoming selection.
        // Our data is configured with n-points rows X m-PCA values columns.
        dataMapper.mapData(context.sel.dataPoints, ReScatter.data.DataMapper.mapOp.PASSALLCOL)
            .then(values => {
                // Values contains all the values per point
                //Build the new point data to plot
                this.data = [];
                for (var i = 0, len = values.length; i < len; i++) {
                    let point = {};
                    values[i].forEach(function(val, index) {
                        point[self.plotPropReader.plotFormat.dimensions[index]] = val;
                    });
                    point['symbol'] = self.plotPropReader.getSymbol(context.sel.dataPoints[i]);
                    this.data.push(point);
                }
                // if the selections map is passed save this permanent selection
                if (staticSelections) {
                    staticSelections[context.sel.label] = this.data;
                }
                // Refresh the plot with the new data
                self.__refresh();
            });
    }

    __refresh() {
        document.querySelector('#' + this.elementId).innerHTML = '';
        this.radviz.render(this.data);
    }
}

ReScatter.protocols.PlotProtocol.impl(RadvizPlotPlugin, [], {
    /**
     * ---Required override---
     * Load the initial plot points.
     * For this demo override we only display the empty radial
     * axes as there are too many points to plot in d3.
     * It is also essential to signal the load completion to
     * allow the rest of the ReScatter initialization to complete
     * (An alternative might be to randomly sample a few hundred
     * points and display those as a background).
     * @param points
     * @param props - the json props file in the plot configuration
     * @param plotProps - the plotProps object that maps the generic names
     *                  to specific properties.
     */
    loadPlotData(points, props, plotProps) {
        // Use the ReScatter PlotPropReader as a holder and accessor to the configures point properties
        this.plotPropReader = new ReScatter.data.PlotPropReader(props, plotProps);
        this.size = document.querySelector('#' + this.elementId).clientWidth;
        // Positioning of the tooltip is calculated relative to the parent
        this.parentElement.style.setProperty('position', 'relative');
        let self = this;
        this.radviz = radvizComponent()
            .config({
                el: this.parentElement,
                // Return the point the configured colorScale function knows what the lookup is
                colorAccessor: function(d){ return d; },
                // Use categorical colors defined as a prop function
                colorScale: self.plotPropReader.plotFormat.color,
                dimensions: plotProps.dimensions,
                size: this.size,
                margin: 30,
                drawLinks: true,
                dotRadius: 3,
                useRepulsion: true,
                tooltipFormatter: function(d) {
                    return '<br/><h3>' + d['symbol'] + '</h3>';
                }
            });
        this.data = [];
        this.radviz.render(this.data);
        /**
         * --- Required event ----
         * This must be called to let the ReScatter controllers know that
         * the plot setup phase is complete and the plot is ready to process events
         */
        ReScatter.controlEventModel.putControlEventModel('rendererLoadComplete', {
            renderer:this,
            rendererId:this.elementId,
            type:'plot'
        });
    },

    /**
     * Do any needed operations needed on resize
     * The radvizComponent works with absolute sizes in
     * its config. These need to be changed to allow correct
     * correct resizing. (Not that other svg based controls might
     * use a relative size in that case the function can be left empty).
     * @param resizeEvent
     */
    onResize (/*resizeEvent*/) {
        let size = this.parentElement.clientWidth;
        this.radviz.config({size:size});
        this.__refresh();
    }
});

ReScatter.protocols.SelectionProtocol.impl(RadvizPlotPlugin, [], {
    /**
     * --- Required overload if the plot should respond to selection events --
     * Process only the dynamic selection event for the demo
     * a) Take the point indexes.
     * b) lookup the previously calculated PCA values
     * c) Convert to json
     * d) Display in the radviz plot
     * @param context
     */
    processSelectionEvent (context) {
        if (context.type === 'dyna') {
            this.__processDynamicSelection(context);
        } else {
            this.__processStaticSelection(context);
        }
        this.processingDone();

    }
});

ReScatter.protocols.ControlProtocol.impl(RadvizPlotPlugin, [], {
    onControlEvent(/*eventContext*/) {
        return; // not coupled to any control events
    }
});

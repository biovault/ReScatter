
var HierarchyUI = function(hierarchy) {
    this._markerUserBounds = [0.0, 5.0];
    this.hierarchy = hierarchy;
}

HierarchyUI.prototype = {
    initContextMenu: function () {

        var cmenu = function (d) {

            var m = [];
            m.push({
                title: "Zoom into Cluster",
                action: function () {
                    d3.select('.d3-context-menu').style('display', 'none');
                    //log(d.data.maxIdx);
                    if (isQtAvailable) Qt.js_drillIntoCluster(d.data.name, d.data.cName, d.data.cId, d.parent.data.name, d.data.maxIdx);
                }
            });

            if (m.length > 0) m.push({divider: true});

            m.push({
                title: "Save Hierarchy as Image ...",
                action: printSVG
            });


            m.push({
                title: "Save Hierarchy as html ...",
                action: printJSON
            });

            return m;
        }

        return cmenu;
    },

    initMarkerRangeSlider: function () {

        var slider = document.getElementById('markerRange');

        noUiSlider.create(slider, {
            start: [20, 80],
            behaviour: 'tap-drag',
            connect: true,
            range: {
                'min': 0,
                'max': 100
            },
            pips: {
                mode: 'positions',
                values: [0, 25, 50, 75, 100],
                density: 4
            }
        });
        return slider;
    },

    rebuildRangeSlider: function (demoMode, variationRange, expressionRange, isVariationActive) {

        _markerRangeSlider.noUiSlider.destroy();
        var self = this;

        if (demoMode) {
            this._markerUserBounds[0] = (isVariationActive ? variationRange[0] : expressionRange[0]);
            this._markerUserBounds[1] = (isVariationActive ? variationRange[1] : expressionRange[1]);
        }
        else {
            this._markerUserBounds[0] = Math.max(this._markerUserBounds[0], (isVariationActive ? variationRange[0] : _expressionRange[0]));
            this._markerUserBounds[1] = Math.min(this._markerUserBounds[1], (isVariationActive ? variationRange[1] : _expressionRange[1]));
        }

        //log("rebuildRangeSlider: " + this._markerUserBounds[0] + " " + this._markerUserBounds[1]);
        refreshColormap();

        //var format = wNumb({ decimals: 2 })
        //d3.select("#legendLabelBottom").text(format.to(this._markerUserBounds[0]));
        //d3.select("#legendLabelTop").text(format.to(this._markerUserBounds[1]));

        noUiSlider.create(_markerRangeSlider, {
            start: this._markerUserBounds,
            behaviour: 'tap-drag',
            connect: true,
            range: {
                'min': 0,
                'max': Math.max(isVariationActive ? variationRange[1] : expressionRange[1], 5.0)
            },
            pips: {
                mode: 'positions',
                values: [0, 25, 50, 75, 100],
                density: 7,
                format: wNumb({
                    decimals: 2
                })
            }
        });

        _markerRangeSlider.noUiSlider.on('slide', function (values, handle) {
            self._markerUserBounds[handle] = parseFloat(values[handle]);
            refreshColormap();
            //d3.select("#legendLabelBottom").text(format.to(this._markerUserBounds[0]));
            //d3.select("#legendLabelTop").text(format.to(this._markerUserBounds[1]));

            // TODO: make this more efficient
            self.hierarchy.initLayout();
        });

        // TODO: make this more efficient
        this.hierarchy.initLayout();
    }
}

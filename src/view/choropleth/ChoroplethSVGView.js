import ChoroplethProtocol from '../../protocols/ChoroplethProtocol';
import {SnapshotProtocolForSVG} from "../../protocols/SnapShotProtocols";

/**
 * A Choropleth view based simply on SVG base maps
 */
class ChoroplethSVGView {
    constructor(containerId) {
        this.svgId = containerId;
    }
}

ChoroplethProtocol.impl(ChoroplethSVGView, [], {
    onPlethResize() {
        // for svg there is nothing to do - it scales automatically
    },

    loadPleth() {
        this.locatorRoot = document.body.querySelector('#' + this.svgId);
    },

    // Here the assumption is that a choropleth region is locatable by
    // path[structure_id="<region_id>"].css({fill: <color>});
    /*
     * Set the color of each region in the svg files to white.
     * Note the use of $(this) - i.e. using jQuery as a handy way of
     * manipulating the SVG style - functions: .find() .each() .css() and .attr()
     */
    clearPlethColors () {
        "use strict";
        $(this.locatorRoot)
            .find("path[structure_id]").each(function () {
                //alert($(this).css("fill"));
                $(this).css("fill", "#ffffff");
            });
    },

    /*
    * Save the pleth colors to a private namespace attribute iedata:savefill
     */
    savePlethColors () {
        "use strict";
        $(this.locatorRoot)
            .find("path[structure_id]").each(function () {
                let fillColor = $(this).css("fill");
                $(this).attr("iedata:savefill", fillColor);
            });
    },

    /*
     * Restore pleth colors from the iedata:savefill attribute
     */

    restorePlethColors () {
        "use strict";
        $(this.locatorRoot)
            .find("path[structure_id]").each(function () {
                let fillColor = $(this).attr("iedata:savefill");
                $(this).css("fill", fillColor);
            });
    },

    // And array of values is given and a color is applied
    // based on a scaled version of this (between 0 and 1.
    // This functio could be user supplied as part of the mapping
    setPlethColorsFromMap (colorMap) {
        "use strict";
        let convert = x => x;
        // allow numeric RGB values
        if (typeof(colorMap[0]) === 'number') {
            convert = x => {return '#' + x.toString(16);}
        }
        let regions = Object.keys(colorMap);
        let self = this;
        regions.map(function(regionId){
            $(self.locatorRoot)
                .find('path[structure_id="' + regionId + '"]')
                    .css("fill", convert(colorMap[regionId]));
            //console.log('Region: ' + regionId + ' color: ' + colorMap[regionId]);
        });
    }
});


// Implement a snapshot protocol to allow screen capture
SnapshotProtocolForSVG.impl(ChoroplethSVGView, [], {
    getNumberofSVGFragments() {
        let thematicMapId = ReScatter.layoutManager.getCanvasSvgId();
        if (thematicMapId !== null) {
            let rootDiv = document.getElementById(thematicMapId);
            return rootDiv.childNodes.length;
        }
        return 0; // We have a single canvas
    },

    getSVGNameAtIndex(index) {
        return 'thematicmap_' + index;
    },

    getSVGTextAtIndex(index) {
        let thematicMapId = ReScatter.layoutManager.getCanvasSvgId();
        if (thematicMapId !== null) {
            let rootDiv = document.getElementById(thematicMapId);
            return rootDiv.childNodes[index].innerHTML;
        }
        return ''; // No svgs
    },

    getCSSTextAtIndex(index) {
        // Could do this for the children if using css : return window.getComputedStyle(document.querySelector('#' + this.elementId).children[0]).cssText;
        return '';
    }
});

export default ChoroplethSVGView;

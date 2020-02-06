/**
 * This is a plugin wrapper which adapts the Hierarchy (wheel) layout for use as a
 * ReScatter layout widget. It implements the LayoutWidgetProtocol (for loading different layouts) and the
 * SnapshotSvgProtocol (for taking a snapshot of the widget current state).
 */
export default  class WheelWidgetPlugin extends ReScatter.widget.LayoutWidgetBase {
    constructor(widgetDef, siteConfig) {
        'use strict';
        super();
        this.widgetDef = widgetDef;
        this.siteConfig = siteConfig;
        this.layoutData = siteConfig.Layouts;
        this.widgetDataPath = widgetDef.dataPath;
        this.wheelToLayoutMap = widgetDef.wheelToLayoutMap;
        this.wheelDiv = widgetDef.wheelDiv;
        this.hierarchy = new Hierarchy(this.wheelDiv);
        this.hierarchy.resize();
        $.getJSON(this.widgetDataPath, (data) => {
            this.hierarchy.setMarkerSelection(this.widgetDef.active);
            this.hierarchy.setWrapper(this);
            this.hierarchy.setData(data);
        });
    }

    loadLayoutByName(layoutName) {
        // identify the corresponding table layout and load it
        let id = this.wheelToLayoutMap[layoutName];
        let selectedLayout;
        for (let layout of this.layoutData) {
            if (layout.id === id) {
                selectedLayout = layout;
            }
        }
        super.loadLayout(selectedLayout);
    }

    __wheelIsVisible() {
        return ($(this.wheelDiv).width() !== 0) || ($(this.wheelDiv).height() !== 0);
    }

}

// Required overrides for a LayoutWidget
ReScatter.protocols.LayoutWidgetProtocol.impl(WheelWidgetPlugin, [], {
    /**
     * @override
     */
    beforeContentChange() {
        // nothing to do
    },

    /**
     * @override
     */
    afterContentChange() {
        // nothing to do
    },

    /**
     * @override
     */
    resize() {
        // the current wheel implementation must be visible to resize
        if (this.__wheelIsVisible()) {
            this.hierarchy.resize();
        }
    }


});


// Optionally add snapshot to the wheel.
// This is a rough demo of how to use the snapshot protocol with
// a d3 (which is SVG) renderer.
// Implement a snapshot protocol to allow screen capture
ReScatter.protocols.SnapshotProtocolForSVG.impl(WheelWidgetPlugin, [], {
    getNumberofSVGFragments() {
        if (this.__wheelIsVisible()) {
            return 1; // We have a single canvas
        }
        return 0;
    },

    getSVGNameAtIndex(/*index*/) {
        return 'WheelNavigator';
    },

    getSVGTextAtIndex(index) {
        // Current implementation can only return svg if wheel is visible
        if (this.__wheelIsVisible() && (index === 0)) {
            return document.querySelector(this.wheelDiv).innerHTML;
        }
        return ''; // No svgs
    },

    getCSSTextAtIndex(index) {
        if (this.__wheelIsVisible() && index === 0) {
            // get the wheel specific style sheets (note the href can be null)
            let cssRuleText = '';
            let sheets = Array.from(document.styleSheets).filter(
                x => x.href && (x.href.endsWith('wheel.css') || (x.href.endsWith('nouislider.css'))));
            for (let sheet of sheets) {
                // add the concatenated rules from the sheet
                cssRuleText += Array.from(sheet.cssRules).map(x => x.cssText).join(' ');
            }
            return cssRuleText;
        }
        return '';
    }
});

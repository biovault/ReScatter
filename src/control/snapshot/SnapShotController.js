import {SnapshotProtocolForCanvas, SnapshotProtocolForSVG} from '../../protocols/SnapShotProtocols';


/**
 * SnapShotPerformer can hold references to GUI components
 * tht support either the SnapshotProtocolForCanvas
 * or the SnapshotProtocolForSVG. It offers a functions to
 * snapshot individual or all registered components.
 *
 * Components are typically plots or choropleths but can also
 * include any control widgets that support snapshotting.
 */
const SnapShotController = {
    _svgs: [],
    _canvases: [],

    /**
     * Add a component - if the component supports one of the supported snapshot protocols
     * it is
     * @param component
     */
    addComponent(component) {
        if (SnapshotProtocolForCanvas.hasImpl(component)) {
            SnapShotController._canvases.push(component);
        } else if (SnapshotProtocolForSVG.hasImpl(component)) {
            SnapShotController._svgs.push(component);
        }
    },

    /**
     * Save PNG snapshots of all components that support the snapshot protocol
     */
    snapshotAll() {
        for (let svgComponent of SnapShotController._svgs) {
            SnapShotController.__snapShotSvgComponent(svgComponent);
        }
        for (let canvasComponent of SnapShotController._canvases) {
            SnapShotController.__snapShotCanvasComponent(canvasComponent);
        }
    },

    snapShotSelected(component) {
        if (SnapShotController._canvases.includes(component)) {
            SnapShotController.__snapShotCanvasComponent(component);
        } else if (SnapShotController._svgs.includes(component)) {
            SnapShotController.__snapShotSvgComponent(component);
        }

    },

    clearAll() {
        SnapShotController._svgs = [];
        SnapShotController._canvasses = [];
    },

    __snapShotCanvasComponent(component) {
        let numSvgs = component.getNumberofCanvases();
        for (let i = 0; i < numSvgs; i++ ) {
            let name = component.getCanvasNameAtIndex(i);
            let canvas = component.getCanvasAtIndex(i);
            ReScatter.utils.SnapshotSaver.saveRawCanvasToPng(canvas, name);
        }
    },

    __snapShotSvgComponent(component) {
        let numSvgs = component.getNumberofSVGFragments();
        for (let i = 0; i < numSvgs; i++ ) {
            let name = component.getSVGNameAtIndex(i);
            let svgFrag = component.getSVGTextAtIndex(i);
            let cssFrag = component.getCSSTextAtIndex(i);
            ReScatter.utils.SnapshotSaver.saveSvgFragmentToPng(svgFrag, cssFrag, name);
        }
    }
};

export default SnapShotController;

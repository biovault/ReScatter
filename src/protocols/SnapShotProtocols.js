import * as protocol from 'protoduck';

const SnapshotProtocolForCanvas = protocol.define(['index'], {
    getNumberofCanvases: [], // get the number of canvases to be saved
    getCanvasNameAtIndex: ['index'], // get the blob at index
    getCanvasAtIndex: ['index'] // get the blob at index
});

const SnapshotProtocolForSVG = protocol.define(['index'], {
    getNumberofSVGFragments: [], // get the number of svg fragments to be saved
    getSVGNameAtIndex: ['index'], // get the blob at index
    getSVGTextAtIndex: ['index'], // get the svg text at the given index
    getCSSTextAtIndex: ['index'] // get the svg text at the given index
});

export {SnapshotProtocolForCanvas, SnapshotProtocolForSVG};

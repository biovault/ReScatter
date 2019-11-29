/**
 * Created by baldur on 2/15/16.
 * Ported to ES6 11/07/2017 - renames from DownloadSaver to SnapshotSaver
 * and turned into a collection of static functions
 */
const FileSaver = require('file-saver');

// polyfill for canvas blob functions from MDN
if (!HTMLCanvasElement.prototype.toBlob) {
 Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: function (callback, type, quality) {

    let binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
        len = binStr.length,
        arr = new Uint8Array(len);

    for (let i=0; i<len; i++ ) {
     arr[i] = binStr.charCodeAt(i);
    }

    callback( new Blob( [arr], {type: type || 'image/png'} ) );
  }
 });
}

/**
 * SnapshotSaver is a utility class for saving snapshots of canvasses, SVGs and text
 * to local files.
 */
export default class SnapshotSaver {

    static __getCleanupLinkFn (tempLink) {
        return function() {
            document.body.removeChild(tempLink);
        };
    };

    /**
     * Given a canvasId render this to a Png and save it in the given file
     * @param canvasId
     * @param fileName
     */
    static saveCanvasToPng(canvasId, fileName) {
        let containDiv = document.getElementById(canvasId);
        let canvas = containDiv.childNodes[0];
        this.saveRawCanvasToPng(canvas, fileName);
    };

    static saveRawCanvasToPng(canvas, fileName) {
        canvas.toBlob((blob) => {
            //console.log(" Calling windows.saveas for: " + fileName);
            // note there was a bug in Google Chrome 65 that
            // prevented multi downloads from working reliably
            // see https://github.com/sindresorhus/multi-download/issues/19
            FileSaver.saveAs(blob, fileName);
        });
    }

    /**
     * Given a DOM element id containing text that text is saved to a file of given name
     * @param textId
     * @param fileName
     */
    static saveTextToFile(textId, fileName) {
        let text = $(textId).text();
        FileSaver.saveAs(
            new Blob([text], {type: "text/plain;charset=" + document.characterSet}),
            fileName
	    );
    };

    static __createImgOnLoad(fileName, img) {

        return function() {
            // make a canvas of the desired width and height
            // and draw the image onto it
            let rawCanvas = document.createElement('canvas'); // my offscreen canvas
            rawCanvas.width = img.width;
            rawCanvas.height = img.height;
            let ctx = rawCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, rawCanvas.width, rawCanvas.height);
            rawCanvas.toBlob((blob)=>{
                FileSaver.saveAs(blob, fileName);
            });
        };
    };

    // Includes:
    // 1) A workaround for firefox bug where drawImage does not work
    // without a rect with width and height see https://bugzilla.mozilla.org/show_bug.cgi?id=700533
    // and http://stackoverflow.com/questions/28690643/firefox-svg-canvas-drawimage-error/28692538#28692538
    //
    // 2) Injection of the css into a <style> element
    //
    // 3) Addition of the namespace
    //
    // The code here could be more efficient but the easiest way to deal with all situations
    // is to parse the SVG to a DOM tree and manipulate the attributes.
    static __formatSVGForRendering(svgText, cssText) {
        // get the width and height from the viewBox in the SVG header
        let viewData = svgText.match(/viewBox=\"\d+ \d+ (\d+) (\d+)\"/i); // i - don't be picky about case
        let parser = new DOMParser();
        let doc = parser.parseFromString(svgText, "image/svg+xml");
        let width = 0;
        let height = 0;
        if (doc.children[0].hasAttribute('width') && doc.children[0].hasAttribute('height')) {
            width = parseInt(doc.children[0].getAttribute("width"));
            height = parseInt(doc.children[0].getAttribute("height"));
        } else {
            if (viewData.length >= 3) {
                width = viewData[1];
                height = viewData[2];
                doc.children[0].setAttribute("width", width + "px");
                doc.children[0].setAttribute("height", height + "px");
            }
        }
        // namespace
        if (!doc.children[0].hasAttribute('xmlns')) {
            doc.children[0].setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        }
        //css
        if (cssText) {
            let styleEl = doc.createElement('style');
            styleEl.innerHTML = '/* <![CDATA[ */' + cssText + '/* ]]> */';
            doc.children[0].appendChild(styleEl);
        }
        let serial = new XMLSerializer();
        let svgString = serial.serializeToString(doc);
        return {svgString, width, height};
    };

    /**
     * Given the id of a DIV containing an svg. The svg is saved to a png file with the given name.
     * The svg must have a viewBox in the header where the function can find the width and height.
     * TODO make this more flexible.
     * @param rootDivId
     * @param save_name
     */
   static saveSvgChildrenToPng(rootDivId, save_name) {
        let rootDiv = document.getElementById(rootDivId);
        for (let i=0; i < rootDiv.childNodes.length; i++) {
            let svgNode = rootDiv.childNodes[i];
            this.saveSvgFragmentToPng(svgNode.innerHTML, save_name);
        }
   };

    /**
     * Given a complete svg fragment render it to a hidden canvas
     * and save the result as a png
     * @param svgFrag
     * @param save_name
     */
    static saveSvgFragmentToPng(svgFrag, cssFrag, save_name) {
        let {svgString, width, height} = this.__formatSVGForRendering(svgFrag, cssFrag);

        let svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        let DOMURL = window.URL || window.webkitURL || window;
        let fileName = save_name + '.png';
        // Create a new image to render the svg
        let img = new Image(width * 2, height * 2);
        // As the image loads an off-screen canvas is created with the svg rendered
        // then the canvas blob is saved as png.
        img.onload = this.__createImgOnLoad(fileName, img);
        img.src = DOMURL.createObjectURL(svgBlob);
    };
}


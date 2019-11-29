/**
 * Created by baldur on 2/15/16.
 * Ported to ES6 12/07/2017
 */
//<Class for LUTFilter adapted from http://climserv.ipsl.polytechnique.fr/documentation/idl_help/Applying_Lookup_Tables_Using_Shaders.html>
// The class supports
// a) a list of predefined LUTs (derived from python matplotlib 1.6): setLut
// b) a 3 point color ramp: setColorMapPoints
import LUTTexture from './LUTTexture';

export default class LUTFilter extends PIXI.AbstractFilter{

    constructor(background) {
        let fragmentSrc = require('./lutFilter.frag');
        let rawCanvas = document.createElement('canvas'); // my offscreen canvas
        rawCanvas.width = 16;
        rawCanvas.height = 16;

        // Use a 2D LUT because WebGL does not support 1D
        let begin = 0x2B81C7;
        let middle = 0xF5F5C4;
        let end = 0xBA2A60;
        let texture = LUTFilter.__getDynamicLutTexture(rawCanvas, begin, middle, end);
        let uniforms = {
            colorSampler:     { type: 'sampler2D', value: texture }
        };
        super(null, fragmentSrc, uniforms);
        this.fragmentSrc = fragmentSrc;
        this.passes = [ this ];
        this.rawCanvas = rawCanvas


        this.begin = begin;
        this.middle = middle;
        this.end = end;
        this.texture = texture;
        this.lutTexture = new LUTTexture();
        this.currentName = '';
        this.background = background;
        this.background_red = ((background & 0xFF0000) >> 16)/255.0;
        this.background_green = ((background & 0x00FF00) >> 8)/255.0;
        this.background_blue = (background & 0xFF)/255.0;
    };



    /**
     * Create a LUT based on three linearly interpolated RGB color values
     * @param begin - RGB
     * @param middle - RGB
     * @param end - RGB
     */
    setColorMapPoints(begin, middle, end) {
        this.begin = begin;
        this.end = end;
        this.middle = middle;
        this.texture = LUTFilter.__getDynamicLutTexture(this.rawCanvas, this.begin, this.middle, this.end);
        this.uniforms = {
            colorSampler:     { type: 'sampler2D', value: this.texture },
            background:       {type: '3f', value: [this.background_red, this.background_green, this.background_blue]}
        };
        PIXI.AbstractFilter.call(this, null, this.fragmentSrc, this.uniforms);
    };

    /**
     * Core logic for interpolated 3 color-point lut
     * @param rawCanvas - offscreen canvas element for rendering
     * @param begin - RGB value
     * @param middle - RGB value
     * @param end - RGB value
     * @returns {Texture.fromCanvas|BaseTexture.fromCanvas}
     */
    static __getDynamicLutTexture(rawCanvas, begin, middle, end) {
        let ctx = rawCanvas.getContext('2d');
        ctx.fillRect(0, 0, 16, 16);
        let imgData = ctx.getImageData(0, 0, 16, 16);
        let data = imgData.data;

        let colorRamp = new ReScatter.utils.ColorRamp();
        colorRamp.colorIntervals = [begin, middle, end];
        colorRamp.range = [0, 255];

        for (let i=0; i < 16; i++) {
            let y = i * 16 * 4;
            for (let j = 0; j < 16; j++) {
                let offset = y + (j * 4);
                let color = colorRamp.getColorInRange(i * 16 + j);
                color = parseInt(color, 16);
                data[offset] = (color >>> 16)  & 0xFF;
                data[offset + 1] = (color >>> 8) & 0xFF;
                data[offset + 2] = color & 0xFF;
                data[offset + 3] = 256;
            }
        }
        data[0] = data[1] = data[2] = 0; //force lowest color to 0
        ctx.putImageData(imgData, 0, 0);
        return new PIXI.Texture.fromCanvas(rawCanvas, PIXI.SCALE_MODES.NEAREST);
    };

    /**
     * Load one of the predefined luts based on the name
     * @param name
     * @param callback
     */
    setLut(name, callback) {
        this.currentName = name;
        this.lutTexture.getLutTexture(name, (texture) => {
            this.texture = texture;
            this.uniforms = {
                colorSampler: {type: 'sampler2D', value: this.texture},
                background:       {type: '3f', value: [this.background_red, this.background_green, this.background_blue]}
            };
            PIXI.AbstractFilter.call(this, null, this.fragmentSrc, this.uniforms);
            callback();
        });
    };

    /**
     * Returns a JSON object defining with the predefined LUT names in grouped
     * in to lists each with a descriptive name - e.g. Divergings maps, Perceptually uniform
     * @returns {*}
     */
    getLutNames() {
        return this.lutTexture.getLutNames();
    }
};
//</Class for LUTFilter>


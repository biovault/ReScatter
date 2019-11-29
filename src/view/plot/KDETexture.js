/**
 * Created by baldur on 2/15/16.
 *  Using PIXI.glCore classes to simplify the WebGL overhead
 *  PIXI.glCore - is the newly released (May 2016) core for PIXI V4
 *  Note: PIXI.gl === PIXI.glCore
 *
 *  Migrate to ES6 - 10/07/17
 */

import GaussianDistCanvas from './GaussianDistCanvas';
import glCore from 'pixi-gl-core';
//<Class for Gaussian KDETexture >
/**
 * Produce a Gaussian kernel density estimation texture in WebGL
 * using the PIXI.gl library for ease of manipulation
 */
export default class KDETexture  {
    constructor(renderer, plotSize, windowSize) {

        this.renderer = renderer;
        this.passes = [ this ];
        this.plotSize = plotSize;
        this.windowSize = windowSize;

        // Render the scatter plot using the supplied kernel texture
        this.vertexKdeSrc = require('./kde.vert');
        this.fragmentKdeSrc = require('./kde.frag');
        this.vertexFloatPackSrc = require('./scanTextureCoords.vert');
        this.fragmentFloatPackSrc = require('./packFloat.frag');
        this.vertexDeclipSrc = require('./scanTextureCoords.vert');
        this.fragmentDeclipSrc = require('./declip.frag');

        // Map the entire canvas (-1,-1 to 1,1) to the entire texture (0,0 to 1,1)
        // Vertex coords for the quad triangle strip. The vertex order is important
        // to ensure the orientation of the texture that we render on this quad.
        this.vertCoords = new Float32Array([
            -1.0, -1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ]);
        this.numVertices = 4;
        // Corresponding texture coords for the quad
        this.texCoords = new Float32Array([
            0.0, 1.0,
            0.0, 0.0,
            1.0, 1.0,
            1.0, 0.0
        ]);
        this.quadIndices = new Uint16Array([0,1,2,0,2,3]); // not used in TRIANGLE_STRIP but needed for the VertexArrayObject
        this.textureSize = 128;
    };

    /**
     * Set the plot points for the KDE
     * @param pointCoords
     */
    setPoints (pointCoords) {
        let gl = this.renderer.gl;
        // Step1 - render points to texture
        // Bind the shaders
        this.scatterPlotShader = new glCore.GLShader(gl, this.vertexKdeSrc, this.fragmentKdeSrc);
        this.scatterPlotShader.bind();
        // set any uniforms in the shader(s) here
        //this.scatterPlotShader.uniforms.positions = 0;
        this.scatterPlotShader.uniforms.uSampler = 0;

        // Create a buffer for the drawing the point coordinates
        this.pointCoords = pointCoords;
        this.numPoints = pointCoords.length/2;
        let pointBuffer = new glCore.GLBuffer.createVertexBuffer(gl, pointCoords);
        // And index these (simply 0->n-1)
        let indices = new Uint16Array(pointCoords.length/2);
        for (let i = 0; i < indices.length; i++) {
            indices[i] = i;
        }
        let indexBuffer = new glCore.GLBuffer.createIndexBuffer(gl, indices);
        //Control everything via a Vertex Array Object
        this.vao = new glCore.VertexArrayObject(gl);
        // set the attributes
        this.vao.addAttribute(pointBuffer, this.scatterPlotShader.attributes.aVertexPosition);
        this.vao.addIndex(indexBuffer);

        // Step 1.5 - extract a single color from the float
        this.floatPackShader = new glCore.GLShader(gl, this.vertexFloatPackSrc, this.fragmentFloatPackSrc);
        this.floatPackShader.bind();


        let verts = new glCore.GLBuffer.createVertexBuffer(gl, this.vertCoords);
        let tex = new glCore.GLBuffer.createVertexBuffer(gl, this.texCoords);
        let inds = new glCore.GLBuffer.createVertexBuffer(gl, this.quadIndices);

        // Buffer for drawing the Quad to render th texture created in Step1
        this.vaoPackQuad = new glCore.VertexArrayObject(gl);
        this.vaoPackQuad.addAttribute(verts, this.floatPackShader.attributes.aVertexPosition);
        this.vaoPackQuad.addAttribute(tex, this.floatPackShader.attributes.aTextureCoord);
        this.vaoPackQuad.addIndex(inds);

        // Step2 - render texture to Quad
        this.declippingShader = new glCore.GLShader(gl, this.vertexDeclipSrc, this.fragmentDeclipSrc);
        this.declippingShader.bind();
        this.declippingShader.uniforms.uSampler = 0; // the texture number to sample

        let qverts = new glCore.GLBuffer.createVertexBuffer(gl, this.vertCoords);
        let qtex = new glCore.GLBuffer.createVertexBuffer(gl, this.texCoords);
        let qinds = new glCore.GLBuffer.createVertexBuffer(gl, this.quadIndices);

        // Buffer for drawing the Quad to render th texture created in Step1
        this.vaoQuad = new glCore.VertexArrayObject(gl);
        this.vaoQuad.addAttribute(qverts, this.declippingShader.attributes.aVertexPosition);
        this.vaoQuad.addAttribute(qtex, this.declippingShader.attributes.aTextureCoord);
        this.vaoQuad.addIndex(qinds);
    };

    // Save and restore all the elements of GL state that we tamper with in this renderer
    // Initially there were problems because the blendEquation/Function were missing
    __saveGLState() {
        let gl = this.renderer.gl;
        this.glState = {};
        this.glState.blend = gl.getParameter(gl.BLEND);
        this.glState.depthTest = gl.getParameter(gl.DEPTH_TEST);
        this.glState.colorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        this.glState.blendEquationSeparate = {};
        this.glState.blendEquationSeparate.alpha = gl.getParameter(gl.BLEND_EQUATION_ALPHA);
        this.glState.blendEquationSeparate.rgb = gl.getParameter(gl.BLEND_EQUATION_RGB);
        this.glState.blendFuncSeparate = {};
        this.glState.blendFuncSeparate.src_rgb = gl.getParameter(gl.BLEND_SRC_RGB);
        this.glState.blendFuncSeparate.dst_rgb = gl.getParameter(gl.BLEND_DST_RGB);
        this.glState.blendFuncSeparate.src_alpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
        this.glState.blendFuncSeparate.dst_alpha = gl.getParameter(gl.BLEND_DST_ALPHA);
    };

    __restoreGLState() {
        let gl = this.renderer.gl;
        if (this.glState === undefined) {
            return;
        }
        if (this.glState.blend) {gl.enable(gl.BLEND);} else {gl.disable(gl.BLEND);}
        if (this.glState.depthTest) {gl.enable(gl.DEPTH_TEST);} else {gl.disable(gl.DEPTH_TEST);}
        gl.clearColor(this.glState.colorClearValue[0], this.glState.colorClearValue[1],
                    this.glState.colorClearValue[2], this.glState.colorClearValue[3]);
        gl.blendEquationSeparate(this.glState.blendEquationSeparate.rgb, this.glState.blendEquationSeparate.alpha);
        gl.blendFuncSeparate(this.glState.blendFuncSeparate.src_rgb,
                             this.glState.blendFuncSeparate.dst_rgb,
                             this.glState.blendFuncSeparate.src_alpha,
                             this.glState.blendFuncSeparate.dst_alpha);
    };

    /**
     * render the KDE texture with the given stdev and number of discrete levels
     * @param stddev - the width of the gaussian to use
     * @param contours - number of discrete rendering levels
     * @returns {*}
     */
    draw(stddev, contours) {
        this.stddev = stddev;
        this.contours = contours;
        // force the texture draw size to a power of 2

        let gl = this.renderer.gl;
        this.__saveGLState();

        // stdev * width must give a power of 2 - width is the number of stdevs wide/high
        // Create a gaussian texture stdev 16, 4 standard deviations wide
        let gaussianCanvas = new GaussianDistCanvas(0, 10, 16, 1, 4); //level 0-256, stddev relative to canvas width
        this.kernelTexture = new glCore.GLTexture.fromSource(gl, gaussianCanvas.canvas, false);

        // Step 1: render to Float texture
        // framebuffer to render to
        this.renderArray = new Float32Array(4 * this.textureSize * this.textureSize); //Rendering to gl.RGBA
        // make a framebuffer with texture object in one step createFloat32 includes the following
        // 1a) gl.createFramebuffer
        // 1b) createTexture, bindTexture, texImage2D
        let floatExt = gl.getExtension('OES_texture_float'); // workaround for a bug where float is only set on the first gl
        let floatlinExt = gl.getExtension('OES_texture_float_linear'); // to allow linear filtering - avoid mipmaps
        let colorBufferFloat = gl.getExtension('WEBGL_color_buffer_float');
        let colorFloatBuf = gl.getExtension('EXT_color_buffer_float');
        let floatBlend = gl.getExtension('EXT_float_blend');
        this.fbo = glCore.GLFramebuffer.createFloat32(gl, this.textureSize, this.textureSize, this.renderArray);
        let linear = true; // if true must enable float linear filtering extension OES_texture_float_linear
        // To fix this:
        // texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.
        this.fbo.texture.minFilter(linear); // textParameteri - linear filtering or nearest
        this.fbo.texture.magFilter(linear); // textParameteri - linear filtering or nearest
        this.fbo.texture.enableWrapClamp();
        this.fbo.enableTexture(this.fbo.texture); // bind the frame buffer and target texture

        // The depth buffer is unnecessary in this case because there ae no hidden surfaces (disable(gl.DEPTH_TEST) ? - check.
        gl.disable(gl.DEPTH_TEST); // we wont add a depth buffer to the framebuffer

        let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (gl.FRAMEBUFFER_COMPLETE !== e) {
           console.log('Frame buffer object is incomplete: ' + e.toString());
            return error();
        }

        this.scatterPlotShader.bind(); // use the shader programs defined
        this.scatterPlotShader.uniforms.bounds = [this.plotSize, this.plotSize];
        this.scatterPlotShader.uniforms.uFourSigma = this.stddev;

        // load the kernel texture as a sprite
        linear = true;
        this.kernelTexture.minFilter(linear); // textParameteri - linear filtering or nearest (linear = false)
        this.kernelTexture.magFilter(linear); // textParameteri - linear filtering or nearest
        this.kernelTexture.enableWrapClamp();
        this.kernelTexture.bind(0);
        this.scatterPlotShader.uniforms.u_KernelSampler = 0;
        // clear to black
        // gl.viewport means transformation from normalized to canvas coords
        // in this case the canvas is the texture being written to so it is to the texture size

        gl.enable(gl.BLEND);  // Use transparency while drawing 2D image.
        gl.blendFunc(gl.ONE, gl.ONE); // simply add the color values (not alpha blending)
        gl.viewport(0, 0, this.textureSize, this.textureSize);

        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // attach the vertices and indices to draw
        this.vao.bind();
        //gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 0); // for texting draw a single point
        gl.drawElements(gl.POINTS, this.numPoints, gl.UNSIGNED_SHORT, 0);

        let err = gl.getError();
        this.vao.unbind();
        this.kernelTexture.unbind();
        this.fbo.unbind();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Step 1.5) Luminance from float texture - because Safari 9.1 cannot download floats
        // Need to provide a RGBA UNSIGNED_BYTE texture to render to....

        // Target texture
        this.fboPack = glCore.GLFramebuffer.createRGBA(gl, this.textureSize, this.textureSize);
        this.fboPack.texture.minFilter(false); // textParameteri - linear filtering or nearest
        this.fboPack.texture.magFilter(false); // textParameteri - linear filtering or nearest
        this.fboPack.texture.enableWrapClamp();
        this.fboPack.enableTexture(this.fboPack.texture); // bind the frame buffer and target texture

        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        //gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);
        gl.viewport(0, 0, this.textureSize, this.textureSize);
        this.vaoPackQuad.bind();
        this.floatPackShader.bind();
        // Bind the (float) texture to be processed
        this.fbo.texture.bind(0); //source texture is gl.TEXTURE0 + 1 and bind the bindTexture to the float
        this.floatPackShader.uniforms.uSampler = 0; // sample texture number 0
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertices); // draw the quad scaling the float texture
        let output = this.__readPackedFloat();
        this.fbo.texture.unbind();
        this.vaoPackQuad.unbind();
        this.fboPack.unbind();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        let maxPix = 0.0;
        // No TypedArray.forEach support on Safai 9.1 so old fashioned for loop
        for (let index = 0; index < output.length; index=index+4) {
            if (output[index] > maxPix) {maxPix = output[index];}
        }

        // Step 2) Render scaled texture to quad
        // restore the viewport to the real size
        gl.viewport(0, 0, this.windowSize, this.windowSize); // rendering to the canvas size

        this.declippingShader.bind();
        this.declippingShader.uniforms.uRange = maxPix;
        this.declippingShader.uniforms.uLevels = this.contours;
        // Bind the quad vertex information on which to draw our texture
        this.vaoQuad.bind();
        // Bind the (float) texture to be scaled and rendered
        this.fbo.texture.bind();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertices); // draw the quad scaling the float texture

        this.fbo.texture.unbind();
        this.vaoQuad.unbind();
        this.rawCanvas = document.createElement('canvas');
        this.rawCanvas.width = this.windowSize;
        this.rawCanvas.height = this.windowSize;
        let ctx = this.rawCanvas.getContext('2d');
        //ctx.fillRect(0, 0, gl.canvas.width, gl.canvas.height);
        let imgData = ctx.createImageData(this.windowSize, this.windowSize);
        this.__imageDataFromGL(imgData, this.windowSize, this.windowSize);
        ctx.putImageData(imgData, 0, 0);
        let resultTexture = PIXI.Texture.fromCanvas(this.rawCanvas, PIXI.SCALE_MODES.LINEAR);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // cleanup the render context\
        this.__restoreGLState();

        // return the texture result
        return resultTexture;
    };

    // If reading FLOAT were widely supported we could do this.
    /*__readTexturePixels() {
        let gl = this.renderer.gl;
        gl.finish(); // wait for the rendering pipeline to finish
        // According to some references readPixels can only read RGBA and Byte.
        // However chrome 51 & firefoxsupports 47 read RGBA - FLOAT
        // However Safari 9.1 cannot. :-(
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
        let outputStorage = new Float32Array(this.textureSize * this.textureSize * 4);
        // read as unsigned byte - need a way to convert to float

        gl.readPixels(0, 0, this.textureSize, this.textureSize, gl.RGBA, gl.FLOAT, outputStorage);
        // cast the byte encoded floats to Float32
        gl.finish();
        return outputStorage;
    };*/

    __readPackedFloat() {
        let gl = this.renderer.gl;
        gl.finish(); // wait for the rendering pipeline to finish
        let outputStorage = new Uint8Array(this.textureSize * this.textureSize * 4);
        gl.readPixels(0, 0, this.textureSize, this.textureSize, gl.RGBA, gl.UNSIGNED_BYTE, outputStorage);
        gl.finish();
        return new Float32Array(outputStorage.buffer);
    };

    __imageDataFromGL(image, width, height) {
        let gl = this.renderer.gl;
        gl.finish();
        let array = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, array);
        image.data.set(new Uint8ClampedArray(array));
        gl.finish();
    }

};
//</Class for KDETexture>


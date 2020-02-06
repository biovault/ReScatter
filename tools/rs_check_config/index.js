#!/usr/bin/env node
var require = require('esm')(module /*, options*/); // support import in nodejs
const program = require('commander');
const path = require('path');

program
    .arguments('<file>')
    .description(`\tValidate a ReScatter siteConfig exported from the given file

	The input file must export a siteConfig object containing
	the ReScatter website definition. i.e. include the following:
	
	"exports.siteConfig = siteConfig;"	
	
	The tool performs an offline check of the syntax of the ReScatter 
	website definition in siteConfig.

	If you are developing ReScatter site include this tool in 
	the toolchain to help revent runtime errors.
`);

// In order to validate the site configuration the 
// ReScatter framework is loaded this necessitates 
// mocking a browser environment.

program.action(function(file) {
    const absolutePath = path.resolve(file);
    console.log(`Validating siteConfig loaded from ${absolutePath}`);
    const program = require('commander');
    // fake the browser environment in order
    // to load browser only dependencies such as PIXI.js
    const jsdom = require('jsdom');
    const { createCanvas, loadImage, Image } = require('canvas')

    const { window } = new jsdom.JSDOM('<html><head></head><body></div></body></html>');
    const { document } = window;

    global.window = window;
    global.document = document;
    global.Image = Image;
    global.navigator = {userAgent: 'node.js'};
    const canvasInst = createCanvas(200,200);
    global.HTMLCanvasElement = function(){};
    global.HTMLCanvasElement.prototype.getContext = function(/*type, attr*/) {return canvasInst.getContext('2d');};
    global.canvas = createCanvas(200,200);
    global.PIXI = require('pixi.js');
    console.log('loading rescatter');
    global.ReScatter = require('../framework/rescatter.js');
    console.log(`rescatter loaded ${global.ReScatter}`);
    console.log(`validating ${absolutePath}`);
    const config = require(absolutePath);
    console.log(config);
    if (config.siteConfig === undefined) {
        console.log('No siteConfig exported.');
        program.help();
        process.exit(1);
    }

    const Validator = require('./src/validator.js');
    const checker = new Validator(config.siteConfig);
    const { error/*, value*/} = checker.validate();
    if (error) {
        console.log('Validation error');
        for (const detail of error.details) {
            console.log(detail);
        }
        process.exit(1);
    }
    console.log(`File: ${absolutePath} - validated successfully`);

    process.exit(0);
});
	
program.parse(process.argv);

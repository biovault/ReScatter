#!/usr/bin/env node
require = require("esm")(module /*, options*/);

const path = require('path');
const program = require('commander');

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
`)

// In order to validate the site configuration the 
// ReScatter framework is loaded this necessitates 
// mocking a browser environment.

program.action(function(file) {
		console.log('Validating siteConfig loaded from %s', file);
		const validatescript = `const program = require('commander');
			const jsdom = require('jsdom');
			const canvas = require('canvas');

			const { window } = new jsdom.JSDOM('<html><head></head><body></div></body></html>')
			const { document } = window;

			global.window = window;
			global.document = document;
			global.Canvas = canvas;
			global.Image = canvas.Image;
			global.navigator = {userAgent: 'node.js'};


			const pixi = require('pixi.js');
			window.HTMLCanvasElement.prototype.getContext = function(type, attr) {};
			global.HTMLCanvasElement = window.HTMLCanvasElement;
			global.ReScatter = require('../../dist/rescatter.js');

			const config = require('${file}');
			console.log(config);
			if (config.siteConfig === undefined) {
				console.log('No siteConfig exported.');
				program.help();
				process.exit(1);
			}
						
			const Validator = require('./src/validator.js');
			const checker = new Validator(config.siteConfig);
			const { error, value } = checker.validate();
			if (error) {
				console.log('Validation error');
				for (const detail of error.details) {
					console.log(detail);
				}
				process.exit(1);
			}
			console.log('File: ${file} - validated successfully');

			process.exit(0)`;  
		const config = eval(validatescript);
	})
	
program.parse(process.argv);

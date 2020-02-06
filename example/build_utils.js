const { readdirSync, statSync, existsSync } = require('fs');
const process = require('process');
const { join } = require('path');
const {execSync} = require('child_process');


const shellResult = (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
    }
    console.log(`Result: ${stdout}`);
    if (stderr) {
        console.error(`stderr: ${stderr}`);
    }

    if(error) {
        process.exit(1);
    }
};

module.exports.build_all = function() {
    const baseDir = process.cwd();
    console.log(`starting at dir: ${baseDir}`);
    readdirSync(baseDir).filter(f => {
        if (statSync(join(baseDir, f)).isDirectory()) {
            if (existsSync(join(baseDir, f, 'example_config.js'))) {
                console.log(`Checking example ${join(baseDir, f, 'example_config.js')}`);
                execSync('rs_check_config ' + join(baseDir, f, 'example_config.js'), shellResult);
            }
            if (existsSync(join(baseDir, f, 'package.json'))) {
                process.chdir(join(baseDir, f));
                console.log(`Build in ${process.cwd()}`);
                execSync('npm run build_example', shellResult);
                console.log(`config.js: ${statSync('config.js').size}`);
            }
        }
    });
};

module.exports.install_all = function() {
    const baseDir = process.cwd();
    console.log(`starting at dir: ${baseDir}`);
    readdirSync(baseDir).filter(f => {
        if (statSync(join(baseDir, f)).isDirectory()) {
            if (existsSync(join(baseDir, f, 'package.json'))) {
                process.chdir(join(baseDir, f));
                console.log(`Install ${process.cwd()}`);
                execSync('npm install', shellResult);
            }
        }
    });
};


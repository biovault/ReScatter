const { readdirSync, statSync, existsSync } = require('fs');
const process = require('process');
const { join } = require('path');
const {exec} = require('child_process');


const baseDir = process.cwd();
readdirSync(baseDir).filter(f => {
    if (statSync(join(baseDir, f)).isDirectory()) {
        if (existsSync(join(baseDir, f, 'package.json'))) {
            process.chdir(join(baseDir, f));
            console.log(`Build in ${process.cwd()}`);
            exec('npm run build_example', (error, stdout, stderr) => {
                if (error) {
                    console.error(`${join(baseDir, f)}: exec error: ${error}`);
                    return;
                }
                console.log(`${join(baseDir, f)}:  ${stdout}`);
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
            });
        }
    }
});


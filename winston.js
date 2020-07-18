const { exec } = require("child_process");
const fs = require("fs"),
    path = require('path');

let config = undefined;

var __dir__ = path.dirname(fs.realpathSync(__filename));

let pjson = require('./package.json');
const { resolve } = require("path");

const args = process.argv;
// Check for the action to execute at 2nd inde of args
const action = args[2];

bootstrap(() => {
    switch (action) {
        case "-v":
                console.log(`v${pjson.version}`)
            break;
        case "--name":
                setName(args[3]);
        break;
        default:
            doMagic();
            break;
    } 
});

function doMagic() {
    console.log(`Welcome back`,'\x1b[32m',config.owner,'\x1b[0m');
    console.log(`Wich project do you want to open?`);
    const result = runCommand(`ls -d ${config.workspacesPath}${(config.workDirectory) ? `/${config.workDirectory}` : '' }/*`);
    result.then(folders => {
        const options = [];
        let prompt = '';
        folders.split('\n').forEach((option, i) => {
            let name = option.split('/');
            name = name[name.length - 1];
            if (name !== '') {
                options.push({
                    name,
                    path: option
                });
                prompt += `\n ${i + 1} - ${name}`;
            }
        });
        // console.log(options);
        console.log(prompt);
    })
}

function bootstrap(callback) {
    let confirmation = checkForConfig();
    confirmation.then(() => {
        callback();
    })
}

function checkForConfig() {
    try {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(`${__dir__}/wconfig.json`)) {
                let confirmation = createConfig();
                confirmation.then(() => {
                    resolve();
                })
            } else {
                config = require('./wconfig.json');
                resolve();
            }
        });
      } catch(err) {
        console.error(err)
      }
}

function createConfig() {
    const config = {
        owner: "",
        verbose: false
    };
    return writeConfig(config);
}

function writeConfig(base = undefined) {
    return new Promise((resolve, reject) => {
        const content = base && base || config; // console.log("CONTENT:", content);
        fs.writeFile(`${__dir__}/wconfig.json`, JSON.stringify(content, null, "\t"), function(err) {
            if(err) {
                reject(console.log(`Error creando el archivo de configuración: ${err}`));
            }
            if (base) {
                config = require('./wconfig.json');
            }
            resolve();
        });
    });
}

function setName(owner) {
    config.owner = owner;
    writeConfig();
}

function checkForFolder(path) {
    return fs.existsSync(path);
}

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (config.verbose) { console.log(`error: ${error.message}`); }
                reject(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                if (config.verbose) { console.log(`stderr: ${stderr}`); }
                reject(`stderr: ${stderr}`);
                return;
            }
            if (config.verbose) {
            
                console.log(`
        Success
        Command executed: ${command}
    
        ${(stdout) ? 'Stdout:\n' + '----------------------------------\n' + stdout : ''}`);
            
            }
            resolve((stdout) ? stdout : undefined);
        });
    });
}

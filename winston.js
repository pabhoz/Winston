const { exec } = require("child_process");
const fs = require("fs"),
    path = require('path');

const readline = require('readline');

let config = undefined;

var __dir__ = path.dirname(fs.realpathSync(__filename));

let pjson = require('./package.json');

const args = process.argv;
// Check for the action to execute at 2nd inde of args
const action = args[2];

bootstrap();

async function doMagic() {
    console.log(`Welcome back`, '\x1b[32m', config.owner, '\x1b[0m');
    console.log(`Wich project do you want to open?`);
    const folders = await runCommand(`ls -d ${config.workspacesPath}${(config.workDirectory) ? `/${config.workDirectory}` : ''}/*`);
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
    let selection = await askForInput(`\nSelect a project [1]: `);
    selection = (selection === '') ? 1 : selection;
    selection = options[selection - 1];
    const code = await askForInput(`Want to open ${selection.name} with code? [y]`);
    if(code !== 'n'){ await runCommand(`code -g ${selection.path}`)} else { await runCommand(`open ${selection.path}`)}

}

async function bootstrap() {

    await checkForConfig();

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
}

async function checkForConfig() {
    try {
        if (!fs.existsSync(`${__dir__}/wconfig.json`)) {
            await createConfig();
        } else {
            config = require('./wconfig.json');
        }
    } catch (err) {
        console.error(err)
    }
}

async function createConfig() {
    const config = {
        "owner": "user",
        "workspacesPath": "~/workspaces",
        "workDirectory": "/",
        "verbose": false
    };
    console.log(`Looks like I'm not set up yet. How about we get to know each other better?`);

    const nameInput = await askForInput(`What do you want me to call you? [user]: `);
    config.owner = (nameInput !== '') ? nameInput : config.name;

    const wspcInput = await askForInput(`will you tell me the route to your workspace? [~/workspaces]: `);
    config.workspacesPath = (wspcInput !== '') ? wspcInput : config.workspacesPath;

    const wrkD = await askForInput(`If you have a particular folder that I should focus on it is your time to tell me, otherwise just press ENTER [/]: `);
    config.workDirectory = (wrkD !== '') ? wrkD : config.workDirectory;

    const verbose = await askForInput(`We are almost ready, finally, do you want to enable the verbose mode? [false]: `);
    config.verbose = (verbose !== '') ? Boolean(verbose) : config.verbose;

    return writeConfig(config);

}

async function askForInput(msg) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(msg);
    const it = rl[Symbol.asyncIterator]();
    const input = await it.next();
    rl.close();
    return input.value;
}

function writeConfig(base = undefined) {
    return new Promise((resolve, reject) => {
        const content = base && base || config; // console.log("CONTENT:", content);
        fs.writeFile(`${__dir__}/wconfig.json`, JSON.stringify(content, null, "\t"), function (err) {
            if (err) {
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

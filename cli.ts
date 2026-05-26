#!/usr/bin/env node
import {Command} from 'commander';
import {server} from './server.js';
import fs from "fs";
import { fileURLToPath } from 'url'; 
import path from "path";

// Getting version from the package.json 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
const version = packageJson.version;

const program = new Command();

program
    .name('webhookforge')
    .description('A local developer CLI tool for testing and replaying webhooks')
    .version(version);

program
    .command('listen')
    .description('Start the WebHookForge local relay server')
    .option('-p, --port <number>','port to bind on','3000')
    .action((options)=>{
        const port = parseInt(options.port,10);

        const reset = '\x1b[0m';
        const bold  = '\x1b[1m';
        const dim   = '\x1b[2m';
        const cyan  = '\x1b[36m';
        const green = '\x1b[32m';

        server.listen(port, () => {
        console.log('');
        console.log(`  ${bold}${cyan}WebHookForge${reset}  ${dim}v${version}${reset}`);
        console.log(`  ${dim}${'─'.repeat(45)}${reset}`);
        console.log(`  ${green}➜${reset}  ${bold}Dashboard:${reset}  http://localhost:${port}`);
        console.log(`  ${green}➜${reset}  ${bold}Relay URL:${reset}  http://localhost:${port}/w/{relay_id}`);
        console.log('');
        console.log(`  ${dim}Tip: Send a test via terminal:${reset}`);
        console.log(`  ${dim}curl -X POST http://localhost:${port}/w/test -d '{"ping":"pong"}'${reset}`);
        console.log('');
        });
    })

    program.parse(process.argv);
#!/usr/bin/env node
import { saveToken } from './utils/config.js';
import { Command } from 'commander';
import { server } from './server.js';
import { createTunnel } from './utils/tunnel.js';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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
    .option('-p, --port <number>', 'port to bind on', '3000')
    .action((options) => {
        const port = parseInt(options.port, 10);
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const dim = '\x1b[2m';
        const cyan = '\x1b[36m';
        const green = '\x1b[32m';

        server.listen(port, async () => {
            console.log('');
            console.log(`  ${bold}${cyan}WebHookForge${reset}  ${dim}v${version}${reset}`);
            console.log(`  ${dim}${'─'.repeat(45)}${reset}`);
            console.log(`  ${green}➜${reset}  ${bold}Dashboard:${reset}  http://localhost:${port}`);
            console.log('\n Negotitating pulic tunnel...{reset}');

            // Tunnel exactly on the same port as of Express
            const publicUrl = await createTunnel(port);

            if (publicUrl) {
                console.log(`  ${green}➜${reset}  ${bold}Pulbic Relay URL:${reset}  ${publicUrl}/w/<your-id>`);
                console.log(`\n(Paste the Public Relay URL into Razorpay, Stripe, or GitHub to start testing)`);

            }
            else {
                console.log(`Could not establish a public tunnel. Local routing only.`);
            }
            console.log('');
            console.log(`  ${dim}Tip: Send a test via terminal:${reset}`);
            // Added content-type to parse body correctly
            console.log(`  ${dim}curl -X POST http://localhost:${port}/w/test -H "Content-Type: application/json" -d '{"ping":"pong"}'${reset}`)
            console.log('');
        });
    })

program
    .command('auth <token>')
    .description('Save your Ngrok auth token to enable public tunneling')
    .action((token) => {
        saveToken(token);
        const green = '\x1b[32m';
        const reset = '\x1b[0m';
        console.log(`${green} Ngrok Auth Token saved successfully!${reset}`);
        console.log('You can now run `webhookforge listen`and the public tunnel will work automatically');
    })

program
    .command('clear')
    .description('Removes all saved webhooks from the local database')
    .action(async () => {
        console.log('\n Sweeping the database:');
        try {
            const result = await prisma.webhook.deleteMany({});
            console.log(`Successfully deleted ${result.count} webhooks!\n`);
        } catch (error) {
            console.error('\n Failed to clear database:', error);
        }
        finally {
            await prisma.$disconnect();
            process.exit(0);
        }
    })
program.parse(process.argv);
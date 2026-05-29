import ngrok from '@ngrok/ngrok';
import { getToken } from './config.js';

export async function createTunnel(port: number): Promise<string | null>{
    try {
        
        // Checking for the token in the config file created
        const authToken = getToken() || process.env.NGROK_AUTHTOKEN;

        if (!authToken) {
            console.log('\n [Tunnel] Ngrok requires an Auth Token to work.');
            console.log('Get one for free at: https://dashboard.ngrok.com');
            console.log('\n Then link it to WebHookForge by running this command:');
            console.log(' ---> webhookforge auth <your_ngrok_token_here>');
            return null;
        }
        // Creating the Ngrok tunnel
        const listener = await ngrok.forward({ 
            addr: port,
            authtoken: authToken,
        }); // listener object contains the information about the tunnel

        const publicUrl = listener.url(); // Returns the url for the data transfer

        // Ctrl + c command closes the tunnel
        process.on('SIGINT',async()=>{
            console.log('\n Closing Ngrok tunnel safely...');
            await ngrok.disconnect();
            process.exit(0);
        });

        return publicUrl || null;
    } catch (error : any) {
        console.error('\n [Tunnel Error] Failed to establish Ngrok tunnel.');
        console.error(` Reason: ${error.message}`);
        return null;
    }
}
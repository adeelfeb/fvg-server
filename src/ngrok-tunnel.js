// scripts/ngrok-tunnel.js
import ngrok from 'ngrok';

const startNgrok = async (port) => {
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH,
      addr: port
    });
    console.log(`🌐 Ngrok tunnel: ${url}`);
    return url;
  } catch (error) {
    console.error('Ngrok error:', error);
    process.exit(1);
  }
};

startNgrok(process.env.PORT || 8000);
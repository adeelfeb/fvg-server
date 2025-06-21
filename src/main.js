// src/main.js
import { app } from './app.js';
import { connectDB } from './db/connect.js';
import config from './config/index.js';
// import ngrok from 'ngrok'; // Uncomment if you still need ngrok for local development

const startServer = async () => {
    try {
        await connectDB(); // Connect to PostgreSQL

        const port = config.port || 8000;
        app.listen(port, () => {
            console.log(`🚀 Server is running on port: ${port}`);
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`Allowed CORS Origins: ${config.corsOrigin.join(', ')}`);
            // console.log(`Session Secret set: ${!!config.sessionSecret}`); // For debugging
        });

        // Uncomment and configure if you still need ngrok for local development
        
        if (config.nodeEnv === "development" && process.env.NGROK_AUTH) {
            try {
                const ngrokUrl = await ngrok.connect({
                    authtoken: process.env.NGROK_AUTH,
                    addr: port,
                });
                console.log(`🌐 Ngrok URL: ${ngrokUrl}`);
                // You can update your Google Auth callback URL here if needed
                // conf.googleAuth.callbackUrl = `${ngrokUrl}/auth/google/callback`;
            } catch (ngrokError) {
                console.error("❌ Error starting ngrok:", ngrokError.message);
            }
        } else if (config.nodeEnv === "development") {
            console.warn("Skipping ngrok in development: NGROK_AUTH is not set in .env");
        }

    } catch (error) {
        console.error("❌ Server startup error:", error.message);
        process.exit(1); // Exit process with failure
    }
};

startServer();
// // src/app.js
// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import session from 'express-session';
// import passport from './passport.js'; // Import Passport
// import config from './config/index.js'; // Import config

// // Import routes
// import authRouter from './routes/auth.routes.js';
// import userRouter from './routes/user.routes.js';
// // import adminRouter from './routes/admin.routes.js'; // Uncomment if needed

// // Utility for error handling middleware
// import { ApiError } from './utils/ApiError.js';

// const app = express();

// // Middleware to enable Cross-Origin Resource Sharing (CORS)
// // It's important to specifically list allowed origins for security
// const allowedOrigins = config.corsOrigin;

// app.use(cors({
//     origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps or curl requests)
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.indexOf(origin) === -1) {
//             const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
//             return callback(new Error(msg), false);
//         }
//         return callback(null, true);
//     },
//     credentials: true, // This is CRUCIAL for sending/receiving cookies cross-origin
// }));

// // Handle preflight requests for all routes (optional, cors module usually handles this)
// app.options("*", (req, res, next) => {
//     res.header("Access-Control-Allow-Origin", req.header("Origin"));
//     res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.sendStatus(204); // No Content
// });


// // Middleware to parse incoming JSON payloads
// app.use(express.json({
//     limit: "10mb",
// }));

// // Middleware to parse URL-encoded data
// app.use(express.urlencoded({
//     extended: true,
//     limit: "10mb",
// }));

// // Middleware to serve static files (if you have a 'public' directory)
// app.use(express.static("public"));

// // Middleware to parse cookies
// app.use(cookieParser());

// // Session middleware
// app.use(session({
//     secret: config.sessionSecret,
//     resave: false, // Don't save session if unmodified
//     saveUninitialized: false, // Don't create session until something is stored
//     cookie: {
//         // IMPORTANT: secure must be true in production (HTTPS)
//         secure: config.nodeEnv === 'production',
//         httpOnly: false, // Set to false to allow client-side JS access
//         sameSite: 'None', // Required for cross-origin cookies
//         maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
//         // You can also set a 'domain' if needed, e.g., 'your-webflow-site.com'
//         // If not set, it defaults to the domain of the server setting the cookie.
//         // It's often better to omit 'domain' for cross-site cookies with SameSite=None
//         // unless you specifically need it for subdomains.
//     }
// }));

// // Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session()); // Enable Passport session support

// // Mount routes
// app.use('/api/v1/auth', authRouter);
// app.use("/api/v1/users", userRouter);
// // app.use('/api/v1/admin', adminRouter); // Uncomment if needed

// // Default route
// app.get("/", (req, res) => {
//     res.status(200).send(`Webflow Backend API is running!`);
// });

// // Health check route
// app.get("/health", (req, res) => {
//     res.status(200).json(new ApiResponse(200, null, "Server is healthy!"));
// });

// // Global error handling middleware (must be the last middleware)
// app.use((err, req, res, next) => {
//     console.error("Global Error Handler:", err);
//     // Ensure all errors are ApiError instances or convert them
//     const error = err instanceof ApiError ? err : new ApiError(500, err.message || "Internal Server Error");

//     res.status(error.statusCode).json(
//         new ApiResponse(error.statusCode, null, error.message, error.errors)
//     );
// });

// export { app };






// src/app.js - FOR DEBUGGING ONLY
import express from 'express';
import cors from 'cors'; // COMMENT THIS OUT FOR NOW
import cookieParser from 'cookie-parser'; // COMMENT THIS OUT FOR NOW
import session from 'express-session'; // COMMENT THIS OUT
import passport from './passport.js'; // COMMENT THIS OUT
import config from './config/index.js'; // COMMENT THIS OUT FOR NOW

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';

import { ApiError } from './utils/ApiError.js'; // COMMENT THIS OUT FOR NOW
import { ApiResponse } from './utils/ApiResponse.js'; // COMMENT THIS OUT FOR NOW

const app = express();

// COMMENT OUT ALL MIDDLEWARE FOR NOW
// app.use(cors({ /* ... */ }));
// app.options("*", (req, res, next) => { /* ... */ });
app.use(express.json({ limit: "10mb" })); // Keep basic JSON parser
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Keep basic URL parser
app.use(express.static("public")); // COMMENT THIS OUT FOR NOW
app.use(cookieParser()); // COMMENT THIS OUT FOR NOW
app.use(session({
    secret: config.sessionSecret,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
        // IMPORTANT: secure must be true in production (HTTPS)
        secure: config.nodeEnv === 'production',
        httpOnly: false, // Set to false to allow client-side JS access
        sameSite: 'None', // Required for cross-origin cookies
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        // You can also set a 'domain' if needed, e.g., 'your-webflow-site.com'
        // If not set, it defaults to the domain of the server setting the cookie.
        // It's often better to omit 'domain' for cross-site cookies with SameSite=None
        // unless you specifically need it for subdomains.
    }
}));

const allowedOrigins = config.corsOrigin;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // This is CRUCIAL for sending/receiving cookies cross-origin
}));



// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); // Enable Passport session support

// COMMENT OUT ALL ROUTE MOUNTING
app.use('/api/v1/auth', authRouter);
app.use("/api/v1/users", userRouter);

// Keep a simple root route
app.get("/", (req, res) => {
    res.status(200).send(`Webflow Backend API is running! (Debugging Mode)`);
});

// Default route
app.get("/", (req, res) => {
    res.status(200).send(`Webflow Backend API is running!`);
});

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json(new ApiResponse(200, null, "Server is healthy!"));
});

// Global error handling middleware (must be the last middleware)
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    // Ensure all errors are ApiError instances or convert them
    const error = err instanceof ApiError ? err : new ApiError(500, err.message || "Internal Server Error");

    res.status(error.statusCode).json(
        new ApiResponse(error.statusCode, null, error.message, error.errors)
    );
});

export { app };
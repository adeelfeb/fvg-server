import express from 'express';
import cors from 'cors'; // COMMENT THIS OUT FOR NOW
import cookieParser from 'cookie-parser'; // COMMENT THIS OUT FOR NOW
import session from 'express-session'; // COMMENT THIS OUT
import passport from './passport.js'; // COMMENT THIS OUT
import config from './config/index.js'; // COMMENT THIS OUT FOR NOW
import { ApiError } from './utils/ApiError.js'; // COMMENT THIS OUT FOR NOW
import { ApiResponse } from './utils/ApiResponse.js'; // COMMENT THIS OUT FOR NOW

const app = express();


app.use(express.json({ limit: "10mb" })); // Keep basic JSON parser
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Keep basic URL parser
app.use(express.static("public"));  
app.use(cookieParser()); 
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


const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://fvg-global-assist.webflow.io',
      "https://fvg-global-assist.webflow.io",
      "https://fvg-global-assist.webflow.io/login"
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 200, // For legacy browser support
  exposedHeaders: ['set-cookie'], 
  allowedHeaders: ['Content-Type', 'Authorization']  
};

app.use(cors(corsOptions));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); // Enable Passport session support



import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import employeeRouter from './routes/employee.routes.js';
import stripeRouter from './routes/stripe.routes.js';
import adminRouter from './routes/admin.routes.js';
// import testRouter from './routes/test.routes.js'

app.use('/api/v1/auth', authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/employee", employeeRouter);
app.use("/api/v1/stripe", stripeRouter);
app.use("/api/v1/admin", adminRouter);

// app.use("/api/v1/test", testRouter);

// Keep a simple root route
app.get("/", (req, res) => {
    res.status(200).send(`Webflow Backend API is running! (Debugging Mode)`);
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
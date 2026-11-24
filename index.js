const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

const { connectDB, closeDB, client, dbName } = require('./models/mongodbConnection');
const userModel = require('./models/userModel');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    throw new Error('SESSION_SECRET must be set in the environment.');
}

app.set('trust proxy', 1);

/* ------------- حماية ترويسات HTTP عبر Helmet مع دعم Google Fonts والـ CDNs ------------- */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net", 
                "https://fonts.googleapis.com"
            ],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            fontSrc: [
                "'self'", 
                "https://cdn.jsdelivr.net", 
                "https://fonts.gstatic.com"
            ]
        }
    }
}));

/* ------------- حماية من الهجمات عبر Rate Limiting ------------- */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again in a few minutes.'
});
app.use(globalLimiter);

let resolveSessionClient;
const sessionClientPromise = isVercel
    ? new Promise((resolve) => {
        resolveSessionClient = resolve;
    })
    : null;

let initializationPromise;
function initializeApplication() {
    if (!initializationPromise) {
        initializationPromise = connectDB()
            .then(() => {
                if (resolveSessionClient) {
                    resolveSessionClient(client);
                    resolveSessionClient = null;
                }

                return userModel.seedAdminIfNone();
            })
            .catch((err) => {
                initializationPromise = null;
                throw err;
            });
    }

    return initializationPromise;
}

app.use(async (req, res, next) => {
    try {
        await initializeApplication();
        next();
    } catch (err) {
        next(err);
    }
});

/* ------------- إعداد الجلسات (Sessions) والتسجيل ------------- */
const sessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax',
        secure: isProduction || isVercel
    }
};

if (isVercel) {
    const { MongoStore } = require('connect-mongo');
    sessionOptions.store = MongoStore.create({
        clientPromise: sessionClientPromise,
        dbName,
        collectionName: 'sessions'
    });
}

app.use(session(sessionOptions));

// تمرير بيانات المستخدم الحالي تلقائياً لكافة قوالب EJS
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

/* ------------- public folder ---------------- */
app.use(express.static(path.join(__dirname, 'public')));

/* ------------- view engine ------------------ */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* -------------- using form data & json -------------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -------------- method override (RESTful PUT & DELETE) -------------- */
app.use(methodOverride('_method'));

/* ------------- router ----------------------- */
const webRouter = require('./route/web');
app.use(webRouter);

/* ------------- 404 Route Handler ------------ */
app.use((req, res, next) => {
    next(new AppError(`The requested URL was not found: ${req.originalUrl}`, 404));
});

/* ------------- Global Error Handler --------- */
app.use(errorHandler);

/* ---------------- start server --------------- */
const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await initializeApplication();

        const server = app.listen(port, () => {
            console.log(`🚀 Server started at http://localhost:${port}`);
        });

        // إغلاق الاتصال بأمان عند إيقاف السيرفر (Graceful Shutdown)
        const gracefulShutdown = async (signal) => {
            console.log(`\nReceived ${signal}. Gracefully shutting down...`);
            server.close(async () => {
                await closeDB();
                console.log('HTTP server and DB connections closed.');
                process.exit(0);
            });
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (err) {
        console.error('❌ Could not start server:', err.message);
        process.exit(1);
    }
}

module.exports = app;

if (require.main === module) {
    startServer();
}

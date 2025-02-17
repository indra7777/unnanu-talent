const { App, LogLevel, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();
const axios = require('axios');
const manifest = require('./manifest.json');
const { customRoutes } = require('./customRoutes');
const { registerListeners } = require("./listeners");
const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');
const expressSession = require('express-session');

const BACKEND_API_URL = process.env.DOMAIN_URI + '/api/v1/user/slack/talent';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Session configuration
const session = expressSession({
    secret: process.env.STATE_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 5 // 5 minutes
    }
});

// State store implementation
const stateStore = {
    generateStateParam: async (installOptions, req) => {
        const state = crypto.randomBytes(32).toString('hex');
        if (req.session) {
            req.session.slackState = state;
        }
        return state;
    },
    verifyStateParam: async (state, req) => {
        if (!req.session || !req.session.slackState) {
            return false;
        }
        const storedState = req.session.slackState;
        req.session.slackState = undefined;
        return state === storedState;
    }
};

// Initialize receiver first
const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: process.env.STATE_SECRET,
    scopes: manifest.oauth_config.scopes.bot,
    processBeforeResponse: true,
    installerOptions: {
        stateStore: stateStore,
        directInstall: true
    }
});

// Add session middleware to receiver
receiver.router.use(session);

// Add OAuth routes
receiver.router.get('/slack/install', (req, res) => {
    receiver.installer.handleInstallPath(req, res);
});

receiver.router.get('/slack/oauth_redirect', (req, res) => {
    receiver.installer.handleCallback(req, res);
});

// Initialize app with receiver
const app = new App({
    receiver,
    logLevel: LogLevel.DEBUG,
    processBeforeResponse: true
});

app.error(async (error) => {
    if (error.code === 'slack_oauth_invalid_state') {
        console.error('Invalid OAuth state:', error);
        // You might want to redirect to an error page here
        return;
    }
    console.error('Other error:', error);
});

// Add this before starting the app
app.use(async (args) => {
    console.log('Middleware - Request details:', {
        type: args.type,
        body: args.body,
        context: args.context,
    });
});

app.message(/^(hi|hello|hey).*/, async ({ context, say }) => {
    // RegExp matches are inside of context.matches
    const greeting = context.matches[0];
  
    await say(`${greeting}, how are you?`);
  });

app.message('knock knock', async ({ message, say }) => {
    await say(`_Who's there?_`);
  });
// registerListeners(app);

(async () => {
    try {
        await app.start(process.env.PORT || 3000);
        console.log('⚡️ Bolt app is running with OAuth support!');
    } catch (error) {
        console.error('Error starting app:', error);
        process.exit(1);
    }
})();

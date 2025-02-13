const { App, LogLevel} = require('@slack/bolt');
require('dotenv').config();
const axios = require('axios');
const manifest = require('./manifest.json');
const {customRoutes} = require('./customRoutes');
const { registerListeners } = require("./listeners");
const { WebClient } = require('@slack/web-api');
const {serverlessHttp} = require('serverless-http');

const BACKEND_API_URL = process.env.DOMAIN_URI+'/api/v1/user/slack/talent';
const AUTH_TOKEN = process.env.AUTH_TOKEN;


const app = new App({
    logLevel: LogLevel.DEBUG,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    stateSecret: "we are there for you",
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    // token : process.env.SLACK_BOT_TOKEN,
    scopes: manifest.oauth_config.scopes.bot,
    // customRoutes: customRoutes, :- it was replaced with installer options
    
    installationStore: {
        storeInstallation: async (installation) => {
            // Prepare the payload for the Slack_Auth object
            const web = new WebClient(installation.bot?.token);
            const getUser = async (userId)=> {
                try {
                  // Call the users.info method
                  const result = await web.users.info({
                    user: userId
                  });
                  
                  // The email will be available in the response if your app has the users:read.email scope
                  const userProfile = result.user.profile;
                  return userProfile;
                } catch (error) {
                  console.error('Error fetching user info:', error);
                  throw error;
                }
              }
              
            const userProfile = getUser(installation.user?.id);
            const newAuthPayload = {
                slackData : installation,
                profile : userProfile
            };
            console.log('Preparing new Slack_Auth payload:', JSON.stringify(newAuthPayload, null, 2));
            try {
                const authResponse = await axios.post(`${BACKEND_API_URL}`, newAuthPayload, {
                    headers: {
                        Authorization: `Bearer ${AUTH_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                });

                // console.log("Auth Response:", authResponse.data);
                return installation; // Return the full installation object instead of response data
            } catch (error) {
                // If app is already registered, return the installation object
                if (error.response && error.response.status === 409) {
                    console.log("App already registered, proceeding with installation");
                    return installation;
                }
                console.error("Error in authentication:", error.response ? error.response.data : error.message);
                throw error; // Throw error for other cases
            }
        },

        fetchInstallation: async (installQuery) => {
            console.log('Fetching installation for:', installQuery);
            try {
                const response = await axios.get(`${BACKEND_API_URL}`, {
                    headers: {
                        Authorization: `Bearer ${AUTH_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        teamId: installQuery.teamId,
                    }
                });

                if (!response.data) {
                    throw new Error('No installation found');
                }

                // console.log('Installation fetched successfully:', response.data);
                // Return the full installation object
                return {
                    teamId: installQuery.teamId,
                    botToken: response.data.botToken,
                    botId: response.data.botId,
                    botUserId: response.data.botUserId,
                    appId: response.data.appId
                };
            } catch (error) {
                console.error('Error fetching installation:', error.response ? error.response.data : error.message);
                throw error;
            }
        },

        //uncomment below if required
        // deleteInstallation: async (installQuery) => {
        //     // Log the deletion attempt
        //     console.log('Attempting to delete installation:', installQuery);
        //     try {
        //         // Send delete request to backend
        //         const deleteResponse = await axios.delete(`${BACKEND_API_URL}`, {
        //             headers: {
        //                 Authorization: `Bearer ${AUTH_TOKEN}`,
        //                 'Content-Type': 'application/json'
        //             },
        //             data: {
        //                 teamId: installQuery.teamId,
        //                 // enterpriseId: installQuery.enterpriseId :- if we required we can add
        //             }
        //         });
        //         console.log('Installation deleted successfully:', deleteResponse.data);
        //         return true;
        //     } catch (error) {
        //         console.error('Error deleting installation:', error.response ? error.response.data : error.message);
        //         return false;
        //     }
        // }
    },
    installerOptions : {
        authVersion: "v2",
        directInstall: false,
        // installPath: "/slack/install",
        metadata: "",
        redirectUriPath: "/slack/oauth_redirect",
        redirectUri: `https://slack-unnanu.netlify.app/slack/oauth_redirect`,
        stateVerification: true,
        stateCookieName: 'slack-state',
        stateCookieOptions: {
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 600000 // 5 minutes
        },
        callbackOptions: {
            success: async (installation, metadata, req, res) => {
                try {
                    console.log('Installation successful:', installation.team.id);
                    // Redirect to Slack workspace after successful installation
                    res.writeHead(302, {
                        'Location': `https://slack.com/app_redirect?app=${installation.appId}&team=${installation.team.id}`
                    });
                    res.end();
                } catch (error) {
                    console.error('Error in success callback:', error);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal server error during installation');
                }
            },
            failure: async (error, installOptions, req, res) => {
                console.error('Installation failed:', {
                    error: error.message,
                    code: error.code,
                    installOptions
                });
                
                // Redirect to an error page or show error message
                res.writeHead(302, {
                    'Location': '/installation-failed'
                });
                res.end();
            },
        },
    }
});

app.error(async (error) => {
    console.error('Global error handler:', error);
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
        console.log('⚡️ Bolt app is running!');
    } catch (error) {
        console.error('Error starting app:', error);
        process.exit(1);
    }
})();

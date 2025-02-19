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



const app = new App({
    logLevel: LogLevel.DEBUG,
    processBeforeResponse: true,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: process.env.STATE_SECRET,
    scopes: manifest.oauth_config.scopes.bot,
    processBeforeResponse: true,
    processBeforeResponse: true,
    installationStore: {
        storeInstallation: async (installation) => {
            try {
                console.log('Storing Slack installation for team:', installation.teamId);

                const web = new WebClient(installation.bot?.token);

                // Fetch user profile using the token
                const getUserProfile = async (userId) => {
                    try {
                        const result = await web.users.info({ user: userId });
                        return result.user.profile;
                    } catch (error) {
                        console.error('Error fetching user profile:', error);
                        throw error;
                    }
                };

                const userProfile = await getUserProfile(installation.user?.id);

                // Construct payload matching .NET controller structure
                const newAuthPayload = {
                    slackData: {
                        active: true,
                        app_id: installation.appId,
                        team: {
                            id: installation.teamId,
                            name: installation.teamName
                        },
                        enterprise: installation.enterpriseId ? {
                            id: installation.enterpriseId,
                            name: installation.enterpriseName
                        } : null,
                        bot_user_id: installation.botUserId,
                        botScope: installation.botScopes,
                        accessToken: installation.botToken,
                        authed_user: {
                            id: installation.userId,
                            accessToken: installation.userToken,
                            scope: installation.userScopes
                        },
                        isEnterpriseInstall: false,
                        created: new Date().toISOString(),
                        updated: new Date().toISOString()
                    },
                    profileData: {
                        active: true,
                        workspace_id: installation.teamId,
                        firstName: userProfile.first_name || '',
                        lastName: userProfile.last_name || '',
                        title: userProfile.title || '',
                        phone: userProfile.phone || '',
                        startDate: new Date().toISOString(),
                        email: userProfile.email || '',
                        profileImage: userProfile.image_512 || '',
                        created: new Date().toISOString(),
                        updated: new Date().toISOString()
                    }
                };

                console.log('Sending Slack Auth payload to backend:', JSON.stringify(newAuthPayload, null, 2));

                const authResponse = await axios.post(
                    "https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/talent",
                    newAuthPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
                            'Content-Type': 'application/json',
                        }
                    }
                );

                console.log("Backend response for storeInstallation:", authResponse.data);
                return installation;
            } catch (error) {
                if (error.response?.status === 409) {
                    console.log("App already registered, proceeding with installation");
                    return installation;
                }
                console.error("Error storing installation:", error.response?.data || error.message);
                throw error;
            }
        },

        fetchInstallation: async (installQuery) => {
            try {
                console.log('Fetching Slack installation for team:', installQuery.teamId);

                const response = await axios.get(
                    "https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/talent",
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            teamId: installQuery.teamId,
                        }
                    }
                );

                if (!response.data) {
                    throw new Error('No installation found');
                }

                console.log('Fetched installation data from backend:', response.data);

                return {
                    teamId: installQuery.teamId,
                    botToken: response.data.accessToken,
                    botId: response.data.botUserId,
                    botUserId: response.data.botUserId,
                    appId: response.data.app_id
                };
            } catch (error) {
                console.error('Error fetching installation:', error.response ? error.response.data : error.message);
                throw error;
            }
        }
    }
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

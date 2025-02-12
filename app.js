const { App, LogLevel} = require('@slack/bolt');
require('dotenv').config();
const axios = require('axios');
const manifest = require('./manifest.json');
// const {customRoutes} = require('./customRoutes');

const BACKEND_API_URL = process.env.DOMAIN_URI+'/api/v1/user/slack/talent';
const AUTH_TOKEN = process.env.AUTH_TOKEN;


const app = new App(
    {
        logLevel: LogLevel.DEBUG,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        stateSecret : "we are there for you",
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        scopes : manifest.oauth_config.scopes.bot,
        // customRoutes: customRoutes, :- it was replaced with installer options
        
        installationStore: {
            storeInstallation: async (installation) => {
                // Prepare the payload for the Slack_Auth object
                const newAuthPayload = {
                    appId: installation.appId,
                    teamId: installation.team?.id,
                    teamName: installation.team?.name,
                    userId: installation.user?.id,
                    userToken: installation.user?.token,
                    tokenType: installation.tokenType,
                    authVersion: installation.authVersion,
                    isEnterpriseInstall: installation.isEnterpriseInstall,
                    botId: installation.bot?.id,
                    botToken: installation.bot?.token,
                    botUserId: installation.bot?.userId
                };
                console.log('Preparing new Slack_Auth payload:', JSON.stringify(newAuthPayload, null, 2));
                try {
                    const authResponse = await axios.post(`${BACKEND_API_URL}`, newAuthPayload, {
                        headers: {
                            Authorization: `Bearer ${AUTH_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    console.log("Auth Response:", authResponse.data);
                    return authResponse.data;
                } catch (error) {
                    console.error("Error in authentication:", error.response ? error.response.data : error.message);
                    return {
                        success: false,
                        message: error.response ? error.response.data : "An unexpected error occurred",
                        status: error.response ? error.response.status : 500
                    };
                }
            },

            // fetchInstallation will be used when slack wants to get token verification

            // fetchInstallation:  (installQuery) => {
               
            //     console.log('Fetching installation for:', installQuery);
            //     try {
            //         const response = axios.get(`${BACKEND_API_URL}`, {
            //             headers: {
            //                 Authorization: `Bearer ${AUTH_TOKEN}`,
            //                 'Content-Type': 'application/json'
            //             },
            //             params: {
            //                 teamId: installQuery.teamId,
            //                 // enterpriseId: installQuery.enterpriseId // Uncomment if needed
            //             }
            //         });

            //         if (!response.data) {
            //             throw new Error('No installation found');
            //         }

            //         console.log('Installation fetched successfully:', response.data);
            //         return {
            //             teamId: response.data.teamId,
            //             botToken: response.data.botToken,
            //             botId: response.data.botId,
            //             botUserId: response.data.botUserId
            //         };
            //     } catch (error) {
            //         console.error('Error fetching installation:', error.response ? error.response.data : error.message);
            //         throw error;
            //     }
            // },


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
            installPath: "/slack/install",
            metadata: "",
            redirectUriPath: "/slack/oauth_redirect",
            redirectUri: `${process.env.DOMAIN_URI}/slack/oauth_redirect`,
            stateVerification: true,
            callbackOptions: {
                success: (installation, installUrlOptions, req, res) => {
                    res.send("The installation succeeded!");
                },
                failure: (error, installUrlOptions, req, res) => {
                    res.send("Something strange happened...");
                },
            },
        }
    }
);

(async () => {
    try {
        await app.start(process.env.PORT || 3000);
        console.log('⚡️ Bolt app is running!');
    } catch (error) {
        console.error('Error starting app:', error);
        process.exit(1);
    }
})();
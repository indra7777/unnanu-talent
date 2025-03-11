const { App, LogLevel, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();
const axios = require('axios');
const manifest = require('./manifest.json');
const { customRoutes } = require('./customRoutes');
const { registerListeners } = require("./listeners");
const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');
const expressSession = require('express-session');
const { log } = require('console');

const BACKEND_API_URL = process.env.DOMAIN_URI + '/api/v1/user/slack/talent';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const database = {
    store: {},
    async delete(key) {
      delete this.store[key];
    },
    async get(key) {
      return this.store[key];
    },
    async set(key, value) {
      this.store[key] = value;
    },
  };

const app = new App({
  logLevel: LogLevel.DEBUG,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  stateSecret: process.env.STATE_SECRET,
  scopes: manifest.oauth_config.scopes.bot,
  socketMode:true,

  customRoutes: customRoutes,
  installationStore: {
    storeInstallation: async (installation) => {
      try {
        // console.log('Storing Slack installation for team:', JSON.stringify(installation, null, 2));

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

        

        const newAuthPayload = {
          slackData: {
            app_id: installation.appId,
            team: {
              id: installation.team?.id, 
              name: installation.team?.name,
            },
            enterprise: {
              id: null,
              name: null,
            },
            bot_user_id: installation.bot?.userId, 
            scope: installation.bot?.scopes ? installation.bot.scopes.join(',') : '', 
            access_token: installation.bot?.token, 
            bot_id: installation.bot?.id, 
            authed_user: {
              id: installation.user?.id, 
              access_token: installation.user?.token, 
              scope: installation.user?.scopes ? installation.user.scopes.join(',') : '', 
            },
          },
          profileData: {
            first_name: userProfile.first_name, 
            last_name: userProfile.last_name, 
            title: userProfile.title, 
            phone: userProfile.phone, 
            start_date: userProfile.startDate || new Date().toISOString(),
            email: userProfile.email, 
            image_512: userProfile.image_512, 
          }
        };
        console.log('botUserid :', installation.bot?.userId);
        console.log('userId :', installation.user?.id);
        
        
        // console.log('Sending truncated Slack Auth payload:', JSON.stringify(newAuthPayload, null, 2));

        const authResponse = await axios.post(
          BACKEND_API_URL,
          newAuthPayload,
          {
            headers: {
              Authorization: `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            }
          }
        );

        const WEB = new WebClient(installation.bot.token);
        const userId = installation.user.id;

        const messageText = authResponse.data.Data.unnanuCreated
          ? `Welcome to Unnanu Talent! We have successfully created your account and user email is: ${newAuthPayload.profileData.email}`
          : "Welcome to Unnanu Talent! We have successfully connected to your existing Unnanu account.\n Edit you profile by typing `/edit-profile`";

        if (authResponse.data.Data.unnanuCreated) {
          await WEB.chat.postMessage({
            channel: userId,
            teamId: installation.team.id,
            text: messageText,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `${messageText}\nActivate your account and user email is: ${newAuthPayload.profileData.email}`
                }
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Activate Account"
                    },
                    action_id: "activate_account",
                    value:`https://uat.app.unnanu.com/activate/${authResponse.data.Data.hashcode}`
                  }
                ]
              }
            ],
          });
        } else {
          await WEB.chat.postMessage({
            channel: userId,
            teamId: installation.team.id,
            text: messageText,
          });
        }
        return newAuthPayload.slackData;
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
      // console.log("in fetch installation");
      // console.log("install Query", installQuery);

      try {
        if (installQuery.teamId !== undefined) {
          const teamId = installQuery.teamId;
          const userId = installQuery.userId;
          // console.log(teamId, userId);
          const response = await axios.get(
            `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/talent`,
            {
              headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
              }
            }
          );
          const installData = response.data[0];

          // Handle case when user is not found
          // if (response.data === 'User not found.' || !response.data || !response.data[0]) {
          //   console.log("User not found from uat-unnanu");
          //   throw new Error('User installation not found');
          // }

          // Return the installation data
          // console.log(installData);
          
          return {
            // appId: "A08B4QY469L",
            // authVersion: 'v2',
            // bot_user_id: response.data[0].bot_user_id,
            user: {
              // id: userId,
              token: installData.user_token,
              // scopes: manifest.oauth_config.scopes.user,
            },
            bot: {
              token: installData.bot_access_token,
              // userId: installData.bot_user_id,
              // scopes: manifest.oauth_config.scopes.bot,
              // id : installData.bot_id,
            },
            // team: { id: teamId, name: installData.team_name },
            // enterprise: undefined,
            // isEnterpriseInstall: false,
            // tokenType: 'bot',
          };
          // console.log(response.data[0]);
          
          // return response.data[0];
        }
        // throw new Error('Team ID is undefined');
      } catch (error) {
        console.error("Error fetching installation:", error.response?.data || error.message);
        // throw error; // Re-throw the error to properly handle authorization failure
      }
    },
    deleteInstallation: async (installQuery) => {
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        return database.delete(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        return database.delete(installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    },
  },
  installerOptions: {
    directInstall: false,
    socketMode: true,
    userScopes: manifest.oauth_config.scopes.user,
    stateVerification : false,
  },
});

/** Register Listeners */
registerListeners(app);

app.error((error) => {
  console.error(error);
});


/** Start Bolt App */
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
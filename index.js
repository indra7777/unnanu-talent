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
  stateSecret: 'my-state-secret',
  scopes: manifest.oauth_config.scopes.bot,
  socketMode: true,

  customRoutes: customRoutes,
  installationStore: {
    storeInstallation: async (installation) => {
      try {
        console.log('Storing Slack installation for team:', JSON.stringify(installation, null, 2));

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
            app_id: installation.appId || '',
            team: {
              id: installation.team?.id || '',
              name: installation.team?.name || ''
            },
            enterprise: {
              id: null,
              name: null,
            },
            bot_user_id: installation.bot?.userId || '',
            scope: installation.bot?.scopes ? installation.bot.scopes.join(',') : '',
            access_token: installation.bot?.token || '',
            bot_id: installation.bot?.id || '',
            authed_user: {
              id: installation.user?.id || 'null',
              access_token: installation.user?.token || 'null',
              scope: installation.user?.scopes ? installation.user.scopes.join(',') : 'null'
            },
          },
          profileData: {
            first_name: userProfile.first_name || 'null',
            last_name: userProfile.last_name || 'null',
            title: userProfile.title || 'null',
            phone: userProfile.phone || 'null',
            start_date: userProfile.startDate || new Date().toISOString(),
            email: userProfile.email || 'null',
            image_512: userProfile.image_512 || 'null',
          }
        };

        console.log('Sending Slack Auth payload to backend:', JSON.stringify(newAuthPayload, null, 2));

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
        await WEB.chat.postMessage({
          channel: userId,
          text: "Welcome to Unnanu Talent! We’ve successfully connected your account."
        });

        console.log("Backend response for storeInstallation:", authResponse.data);
        return await database.set(installation.team.id, installation);
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
      console.log("in fetch installation");
      console.log("install Query", installQuery);

      try {
        if (installQuery.teamId !== undefined) {
          const teamId = installQuery.teamId;
          const userId = installQuery.userId;

          const response = await axios.get(`${process.env.BACKEND_URI}/user/slack/${teamId}/${userId}/talent`,
            {
              headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
              }
            }
          );

          const data = {
            user: {
              token: response.data[0].user_token,
              scopes: response.data[0].user_scope ? response.data[0].user_scope.split(',') : [], // optional
            },
            bot: {
              token: response.data[0].access_token,
              userId: response.data[0].bot_user_id,
              scopes: response.data[0].bot_scope ? response.data[0].bot_scope.split(',') : []
            },
            team: { id: teamId, name: response.data[0].team_name },
            enterprise: undefined,
            tokenType: 'bot',
          };
          console.log("fetch installation return data", data);

          return {
            appId: "A08B4QY469L",
            authVersion: 'v2',
            bot_user_id: response.data[0].bot_user_id,
            user: {
              id: userId,
              token: response.data[0].user_token,
              scopes: response.data[0].user_scope ? response.data[0].user_scope.split(',') : [], // optional
            },
            bot: {
              token: response.data[0].access_token,
              userId: response.data[0].bot_user_id,
              scopes: response.data[0].bot_scope ? response.data[0].bot_scope.split(',') : [],
            },
            team: { id: teamId, name: response.data[0].team_name },
            enterprise: undefined,
            isEnterpriseInstall: false,
            tokenType: 'bot',
          };
        }
      } catch (error) {
        console.error("Error fetching installation:", error.response?.data || error.message);
        throw error;
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
  },
});

/** Register Listeners */
registerListeners(app);

app.error((error) => {
  console.error(error);
});

app.message('hello', async ({ message, say }) => {
  console.log("message", message);
  await say(`Hey there <@${message.user}>!`);
});

app.event('team_join', async ({ event, client, logger }) => {
  try {
    await client.chat.postMessage({
      channel: event.user.id,
      text: "Welcome to Unnanu Talent! We find the best matching for you. Your Unnanu account is now connected successfully."
    });
  } catch (error) {
    logger.error(`Error posting welcome message: ${error}`);
  }
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
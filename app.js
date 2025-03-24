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

const BACKEND_API_URL = process.env.BACKEND_URI + '/user/slack/talent';
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
  // logLevel: LogLevel.DEBUG,
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
                    value: `${process.env.ACTIVATE_URI}/${authResponse.data.Data.hashcode}`
                  }
                ]
              }
            ]
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
            `${process.env.BACKEND_URI}/user/slack/${teamId}/${userId}/talent`,
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
app.event('app_home_opened', async ({ event, client }) => {
  console.log(`app home event triggered with tab: ${event.tab}`);
  try {
      await client.views.publish({
          user_id: event.user,
          view: {
              type: 'home',
              blocks: [
                  {
                      type: 'header',
                      text: { type: 'plain_text', text: "Welcome to Unnanu Talent! 🚀" }
                  },
                  {
                      type: 'section',
                      text: { 
                          type: 'mrkdwn',
                          text: "🎯 *Find the job you deserve!*\nUnnanu Talent connects you to top job platforms like Indeed, LinkedIn, and more. Use the commands below to get started:"
                      }
                  },
                  {
                      type: 'divider'
                  },
                  {
                      type: 'section',
                      text: { type: 'mrkdwn', text: "*Quick Actions:*" }
                  },
                  {
                      type: 'actions',
                      elements: [
                        {
                          type: 'button',
                          text: { type: 'plain_text', text: "📝 Edit Profile" },
                          value: '/edit-profile',
                          action_id: 'cmd_edit_profile'
                        },
                        {
                          type: 'button',
                          text: { type: 'plain_text', text: "📄 Upload Resume" },
                          value: '/resume-upload',
                          action_id: 'cmd_resume_upload'
                      }, 
                       {
                        type: 'button',
                        text: { type: 'plain_text', text: "📝 Edit skills" },
                        value: '/skills',
                        action_id: 'cmd_skills'
                      },
                      {
                              type: 'button',
                              text: { type: 'plain_text', text: "🔎 Find Jobs" },
                              value: '/jobs-unnanu',
                              action_id: 'cmd_jobs_unnanu'
                          },
                        
              
                          
                      ]
                  },
                  {
                      type: 'section',
                      text: { 
                          type: 'mrkdwn',
                          text: "❓ Need help? Use `/help` to access guidance and tips." 
                      }
                  }
              ]
          }
      });
  } catch (error) {
      console.error('Error publishing App Home:', error);
  }
});


app.action('find_jobs', async ({ ack, say }) => {
  await ack();
  await say("Use `/jobs-unnanu` to find jobs tailored to your profile! 🚀");
});

app.action('upload_resume', async ({ ack, say }) => {
  await ack();
  await say("Use `/upload-resume` to submit your resume for better job matches. 📄");
});

app.action('edit_profile', async ({ ack, say }) => {
  await ack();
  await say("Use `/edit-profile` to update your Unnanu Talent profile easily. ✍️");
});

// app.command('/skills', async ({ command, ack, client }) => {
//   await ack();

//   try {
//     // Fetch user's current skills
//     const response = await axios.get('${process.env.BACKEND_URI}/user/slack/T172ZH6CE/U089XSZ069K/skill/get',
//       {
//         headers: {
//           Authorization: `Bearer ${AUTH_TOKEN}`
//         }
//       }
//     );
//     const skills = response.data;

//     const initialOptions = skills.map(skill => ({
//       text: {
//         type: 'plain_text',
//         text: skill.SkillName
//       },
//       value: skill.Id.toString()
//     }));

//     const result = await client.views.open({
//       trigger_id: command.trigger_id,
//       view: {
//         type: 'modal',
//         callback_id: 'skills_modal',
//         title: {
//           type: 'plain_text',
//           text: 'Update Skills'
//         },
//         blocks: [
//           {
//             type: 'input',
//             block_id: 'skill_input_block',
//             element: {
//               type: 'multi_external_select',
//               action_id: 'skill_input',
//               placeholder: {
//                 type: 'plain_text',
//                 text: 'Search for skills...'
//               },
//               initial_options: initialOptions,
//               min_query_length: 1
//             },
//             label: {
//               type: 'plain_text',
//               text: 'Skills'
//             }
//           }
//         ],
//         submit: {
//           type: 'plain_text',
//           text: 'Save'
//         }
//       }
//     });
//   } catch (error) {
//     console.error(error);
//   }
// });

app.options('skill_input', async ({ options, ack }) => {
  const query = options.value.toLowerCase();

  const response = await axios.get(`${process.env.BACKEND_URI}/autocomplete/skills/${query}`,
    {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    }
  );
  const skills = response.data;

  const matchingSkills = skills.filter(skill => skill.SkillName.toLowerCase().includes(query));

  const optionsList = matchingSkills.map(skill => ({
    text: {
      type: 'plain_text',
      text: skill.SkillName
    },
    value: skill.Id.toString()
  }));

  await ack({
    options: optionsList
  });
});

// app.view('skills_modal', async ({ ack, body, view, client }) => {
//   await ack();

//   const selectedSkills = view.state.values.skill_input_block.skill_input.selected_options.map(option => ({
//     SkillName: option.text.text,
//     Value: option.value,
//     CoGuid: "0"
//   }));

//   try {
//     const response = await axios.post(`${process.env.BACKEND_URI}/user/slack/T172ZH6CE/U089XSZ069K/skill/update`, selectedSkills, {
//       headers: {
//         Authorization: `Bearer ${AUTH_TOKEN}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log('Skills updated successfully:', response.data);
//   } catch (error) {
//     console.error('Error updating skills:', error);
//   }
// });

/** Start Bolt App */
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
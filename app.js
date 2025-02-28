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
  // token: process.env.SLACK_TOKEN,
  stateSecret: process.env.STATE_SECRET,
  scopes: manifest.oauth_config.scopes.bot,
  socketMode:true,

  // customRoutes : customRoutes,
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

                const newAuthPayload = { //updated one
                    slackData: {
                        app_id: installation.appId || '',
                        team: {
                            id: installation.team?.id || '',
                            name: installation.team?.name || ''
                        },
                        enterprise:  {
                            id: null,
                            name: null,
                        },
                        bot_id : installation.bot?.id || '',
                        bot_user_id: installation.bot?.userId || '',
                        scope: installation.bot?.scopes ? installation.bot.scopes.join(',') : '',
                        access_token: installation.bot?.token || '',
                        bot_id: installation.bot?.id || '',
                        authed_user: {
                            id: installation.user?.id || 'null',
                            access_token: installation.user?.token || 'null',
                            scope: installation.user?.scopes ? installation.user.scopes.join(',') : 'null'
                        },
                        refresh_token : null,
                        token_expiry : null,
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
                    "https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/talent",
                    newAuthPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
                            'Content-Type': 'application/json',
                        }
                    }
                );

                const WEB = new WebClient(installation.bot.token);
                const userId = installation.user.id;
                console.log("Backend response for storeInstallation:", authResponse.data);
                await WEB.chat.postMessage({
                channel: userId,
                text: "Welcome to Unnanu Talent! we have successfully connected your account."
                });

                
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
      console.log("in fetch installation");
      
      console.log("install Query",installQuery);
      

        try {
            if (installQuery.teamId !== undefined) {
                console.log(database.get(installQuery.teamId));
                
                console.log(installQuery);
                const teamId = installQuery.teamId;
                const userId = installQuery.userId;

                const response = await axios.get(`https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/talent`,
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
                      'Content-Type': 'application/json',
                  }
                  }
                )
             

                const data = { user: {
                  token: response.data[0].user_token,
                  scopes: response.data[0].user_scope ? response.data[0].user_scope.split(','):[], // optional
                },
                bot:  {
                  id : response.data[0].bot_id,
                  token: response.data[0].bot_access_token,
                  userId: response.data[0].bot_user_id,
                  scopes: response.data[0].bot_scope ? response.data[0].bot_scope.split(','):[]
                },
                team: { id: teamId,  name: response.data[0].team_name },
                enterprise: undefined,
                tokenType: 'bot',
              };
              console.log("fetch installation return data",data);

                return data;
              }
      
        } catch (error) {
            console.error("Error fetching installation:", error.response?.data || error.message);
            throw error;
        }

        
    },
    deleteInstallation: async (installQuery) => {
      // Org-wide installation deletion
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        return tempDB.delete(installQuery.enterpriseId);
      }
      // Single team installation deletion
      if (installQuery.teamId !== undefined) {
        return tempDB.delete(installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    },
  },
  installerOptions: {
    // If true, /slack/install redirects installers to the Slack Authorize URL
    // without rendering the web page with "Add to Slack" button
    directInstall: false,
    socketMode: true,
    userScopes : manifest.oauth_config.scopes.user,
  },
});

/** Register Listeners */
registerListeners(app);

app.error((error) => {
  console.error(error);
});

app.message('hello', async ({ message, say }) => {
    // say() sends a message to the channel where the event was triggered
    console.log("message", message);
    await say(`Hey there <@${message.user}>!`);
    }
);
app.event('team_join', async ({ event, client, logger }) => {
    try {
      // event.user.id is the newly joined user’s ID
      await client.chat.postMessage({
        channel: event.user.id,
        text: "Welcome to Unnanu Talent! We find the best matching for you. Your Unnanu account is now connected successfully."
      });
    } catch (error) {
      logger.error(`Error posting welcome message: ${error}`);
    }
  });

// 1) Listen for the /apply slash command
app.command('/apply', async ({ command, ack, client }) => {
    // Acknowledge the command immediately
    await ack();
    
    try {
      // Open a modal to collect location and roles
      await client.views.open({
        trigger_id: command.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'apply_modal',
          title: {
            type: 'plain_text',
            text: 'Application Info'
          },
          blocks: [
            {
              type: 'input',
              block_id: 'location_block',
              label: {
                type: 'plain_text',
                text: 'Location'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'location_input'
              }
            },
            {
              type: 'input',
              block_id: 'primary_role_block',
              label: {
                type: 'plain_text',
                text: 'Primary Role'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'primary_role_input'
              }
            },
            {
              type: 'input',
              block_id: 'secondary_role_block',
              label: {
                type: 'plain_text',
                text: 'Secondary Role'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'secondary_role_input'
              }
            }
          ],
          submit: {
            type: 'plain_text',
            text: 'Submit'
          }
        }
      });
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  });

  // 2) Listen for the modal submission
app.view('apply_modal', async ({ ack, body, view, client }) => {
    // Acknowledge Slack so it knows we received the submission
    await ack();
  
    // Extract user inputs from the view state
    const location = view.state.values.location_block.location_input.value;
    const primaryRole = view.state.values.primary_role_block.primary_role_input.value;
    const secondaryRole = view.state.values.secondary_role_block.secondary_role_input.value;
  
    // The user who submitted the modal
    const userId = body.user.id;
  
    // For demonstration: DM the user a confirmation & instructions
    try {
      await client.chat.postMessage({
        channel: userId,
        text: `Thanks for your info!\n• Location: ${location}\n• Primary Role: ${primaryRole}\n• Secondary Role: ${secondaryRole}\n\n*Please upload your resume* here in this DM or in any channel we both share so I can capture it.`
      });
    } catch (error) {
      console.error('Error sending DM:', error);
    }
  
    // Optionally, store the info in your DB or do other logic
  });
// 3) Subscribe to file_shared event in Slack app settings
//    Then handle it here:
app.event('file_shared', async ({ event, client }) => {
    try {
      // Grab info about the shared file
      const fileId = event.file.id;
  
      // Check if you want to process certain file types only
      // e.g., if it's a PDF or Word doc for a resume
      // event.file.mimetype, etc.
  
      // If you need the file data, call files.info
      const fileInfo = await client.files.info({ file: fileId });
      // fileInfo.file contains details (title, mimetype, size, URL, etc.)
  
      // If you want to download the file, use the URL from fileInfo.file.url_private
      // Then your server can fetch it with an authenticated request using your bot token.
  
      console.log('Got a file_shared event:', fileInfo.file);
  
      // Possibly link this file to the user’s location/roles info
      // You might store: user_id => file_id => metadata
      // Then you can confirm back to the user that you received the resume
      const channelId = event.channel_id;  // channel or DM where it was uploaded
      const userId = event.user_id;        // user who shared the file
  
      await client.chat.postMessage({
        channel: channelId,
        text: `Thanks <@${userId}>, I received your resume!`
      });
    } catch (error) {
      console.error('Error handling file_shared event:', error);
    }
  });
    

  //job command

  // Fake function returning hardcoded job data for demonstration
// async function getTop5JobsForUser(userId) {
//     // In reality, you’d look at the user’s profile/resume, do matching, etc.
//     // But for now, just return static data:
//     return [
//       {
//         id: 101,
//         title: "Full Stack Java Developer with AWS and Angular",
//         company: "Deltacubes",
//         location: "Pune, Maharashtra, India",
//         matchScore: 84,
//         shortDescription: "4+ years of experience in full stack Java development. AWS & Angular expertise.",
//         applyUrl: "https://example.com/job/101"
//       },
//       {
//         id: 102,
//         title: "Fullstack Java Developer",
//         company: "IBM",
//         location: "Kochi, Kerala, India",
//         matchScore: 84,
//         shortDescription: "Design, code, test, and provide industry-leading solutions at IBM.",
//         applyUrl: "https://example.com/job/102"
//       },
//       {
//         id: 103,
//         title: "Java Fullstack Developer",
//         company: "Cloud Counselage",
//         location: "Coimbatore, Tamil Nadu, India",
//         matchScore: 82,
//         shortDescription: "Looking for a highly skilled and experienced Full Stack Developer…",
//         applyUrl: "https://example.com/job/103"
//       },
//       {
//         id: 104,
//         title: "Backend Engineer (Java/Python)",
//         company: "TechCorp",
//         location: "Bangalore, Karnataka, India",
//         matchScore: 80,
//         shortDescription: "Join the core backend team working on distributed systems, microservices, and APIs.",
//         applyUrl: "https://example.com/job/104"
//       },
//       {
//         id: 105,
//         title: "Senior Java Developer",
//         company: "Globex Corporation",
//         location: "Remote (India)",
//         matchScore: 78,
//         shortDescription: "Seeking experienced Java dev to build scalable software solutions in the cloud.",
//         applyUrl: "https://example.com/job/105"
//       }
//     ];
//   }
//   app.command('/jobs', async ({ command, ack, respond, client }) => {
//     await ack(); // Acknowledge the slash command
  
//     try {
//       // Hardcoded user => ignoring, or you might pass command.user_id
//       const userId = command.user_id;
  
//       // Use the test data function
//       const matchedJobs = await getTop5JobsForUser(userId);
  
//       if (!matchedJobs || matchedJobs.length === 0) {
//         await client.chat.postEphemeral({
//           channel: command.channel_id,
//           user: userId,
//           text: "No jobs found matching your profile right now. (Testing data)"
//         });
//         return;
//       }
  
//       // Build the blocks
//       const blocks = [];
//       matchedJobs.forEach((job) => {
//         blocks.push({
//           type: 'section',
//           text: {
//             type: 'mrkdwn',
//             text: `*${job.title}*\n${job.company} - ${job.location}\n${job.shortDescription}`
//           }
//         });
//         blocks.push({
//           type: 'context',
//           elements: [
//             {
//               type: 'mrkdwn',
//               text: `*Match Score:* ${job.matchScore}`
//             }
//           ]
//         });
//         blocks.push({
//           type: 'actions',
//           elements: [
//             {
//               type: 'button',
//               text: {
//                 type: 'plain_text',
//                 text: 'Save'
//               },
//               style: 'primary',
//               action_id: `save_job_${job.id}`
//             },
//             {
//               type: 'button',
//               text: {
//                 type: 'plain_text',
//                 text: 'Apply Now'
//               },
//               style: 'primary',
//               // In testing, we might just open a dummy link
//               url: job.applyUrl
//               // or if you want to capture a click, use an action_id instead
//               // action_id: `apply_job_${job.id}`
//             }
//           ]
//         });
//         blocks.push({ type: 'divider' });
//       });
  
//       // Post ephemeral so only the user sees it
//       await client.chat.postEphemeral({
//         channel: command.channel_id,
//         user: userId,
//         text: 'Here are your top job matches! (Test Data)',
//         blocks
//       });
//     } catch (error) {
//       console.error('Error with /jobs command:', error);
//       await respond({ text: 'Oops! Something went wrong fetching test jobs.' });
//     }
//   });
//   app.action(/save_job_(.*)/, async ({ ack, body, client }) => {
//     await ack();
//     const jobId = body.actions[0].action_id.replace('save_job_', '');
//     const userId = body.user.id;
  
//     console.log(`User ${userId} saved job ${jobId} (test data)`);
  
//     await client.chat.postEphemeral({
//       channel: body.channel.id,
//       user: userId,
//       text: `Job #${jobId} saved! (Test)`,
//     });
//   });
//   // For the "Save" button
// // app.action(/save_job_(.*)/, async ({ ack, body, client, context }) => {
// //     await ack(); // Acknowledge the action
  
// //     const jobId = body.actions[0].action_id.replace('save_job_', '');
// //     const userId = body.user.id;
  
// //     // Save the job in your DB, e.g. user’s “saved jobs” list
// //     await saveJobForUser(userId, jobId);
  
// //     // Optionally let the user know it’s saved
// //     await client.chat.postEphemeral({
// //       channel: body.channel.id,
// //       user: userId,
// //       text: `Job #${jobId} saved!`
// //     });
// //   });
  
//   // For the "Apply" button
//   app.action(/apply_job_(.*)/, async ({ ack, body, client }) => {
//     await ack();
  
//     const jobId = body.actions[0].action_id.replace('apply_job_', '');
//     const userId = body.user.id;
  
//     // Possibly open a new modal or redirect them to your external “apply” link
//     // Example: open a Slack modal for additional questions
//     await client.views.open({
//       trigger_id: body.trigger_id,
//       view: {
//         type: 'modal',
//         callback_id: 'apply_job_modal',
//         title: {
//           type: 'plain_text',
//           text: 'Apply for Job'
//         },
//         blocks: [
//           {
//             type: 'section',
//             text: {
//               type: 'mrkdwn',
//               text: `You're applying for job #${jobId}!`
//             }
//           },
//           // Additional form fields here...
//         ],
//         submit: {
//           type: 'plain_text',
//           text: 'Submit'
//         }
//       }
//     });
//   });
  

/** Start Bolt App */
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    app.logger.info('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    app.logger.error('Unable to start App', error);
  }
})();
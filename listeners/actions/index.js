const {saved_jobs} = require ("./saved_jobs");
const {apply_jobs} = require ("./apply_job");
const {activate_account} = require ("./activate_account");
const {residency_location_input} = require ("./residency_location");

const {get_profile} = require("../commands/get_profile");

const {edit_profile} = require("../commands/edit_profile");

const {jobs} = require("../commands/jobs");

const {upload_resume} = require("../commands/upload_resume");
const {skills} = require("../commands/skills");

module.exports.register = (app) => {
  app.action('save_job_(.*)', saved_jobs);
  app.action('apply_job_(.*)', apply_jobs);
  app.action('activate_account', activate_account);
  app.action('residency_location_input',residency_location_input );

  // Action handlers for buttons from the help message

  // Edit Profile Button Action
  app.action('cmd_edit_profile', async ({ ack, body, client }) => {
    await ack();
    // Call your edit_profile handler; simulate a slash command payload if needed.
    await edit_profile({
      command: { command: '/edit-profile' },
      ack,
      client,
      body
    });
  });

  // Jobs Button Action
  // app.action('cmd_jobs_unnanu', async ({ ack, body, client }) => {
  //   await ack();
  //   await jobs({
  //     command: { command: '/jobs-unnanu' },
  //     ack,
  //     client,
  //     body
  //   });
  // });
  app.action('cmd_jobs_unnanu', async ({ ack, body, client }) => {
    try {
      await ack();
  
      // Open a DM with the user to obtain a valid channel ID
      const imResponse = await client.conversations.open({ users: body.user.id });
      const dmChannel = imResponse.channel.id;
  
      // Build an updated payload with the required fields
      const updatedBody = {
        ...body,
        channel: dmChannel,
        channel_id: dmChannel,
        user: body.user.id,
        user_id: body.user.id
      };
  
      // Now call your jobs command handler
      await jobs({
        command: { command: '/jobs-unnanu' },
        // You may pass a dummy ack if your handler calls it (or refactor to not call ack again)
        ack: async () => {},
        client,
        body: updatedBody
      });
    } catch (error) {
      console.error("Error in job button action:", error);
    }
  });
  
  
  
  // Get Profile Button Action
  app.action('cmd_get_profile', async ({ ack, body, client }) => {
    await ack();
    await get_profile({
      command: { command: '/get-profile' },
      ack,
      client,
      body
    });
  });

  // Resume Upload Button Action
  app.action('cmd_resume_upload', async ({ ack, body, client }) => {
    await ack();
    await upload_resume({
      command: { command: '/upload-resume' },
      ack,
      client,
      body
    });
  });
  app.action('cmd_skills', async ({ ack, body, client }) => {
    await ack();
    await skills({
      command: { command: '/skills' },
      ack,
      client,
      body
    });
  });
};
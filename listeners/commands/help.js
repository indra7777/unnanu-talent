const help = async ({ command, ack, client, body }) => {
    await ack();
  
    await client.chat.postMessage({
      channel: body.user_id,
      text: "Unnanu Talent Help",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Unnanu Talent Help"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Edit Profile*\nUpdate your Unnanu Talent profile with your latest information."
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Edit Profile"
            },
            action_id: "cmd_edit_profile", // When clicked, trigger the /edit-profile logic
            value: "/edit-profile"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Jobs*\nDiscover jobs that match your skills and preferences."
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Jobs"
            },
            action_id: "cmd_jobs_unnanu", // Trigger the /jobs-unnanu command
            value: "/jobs-unnanu"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Skills*\nView your current Unnanu Talent skill details."
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Update Skills"
            },
            action_id: "cmd_skills", // Trigger the /get-profile command
            value: "/skills"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Upload Resume*\nUpload your resume to improve job matching."
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Upload Resume"
            },
            action_id: "cmd_resume_upload", // Trigger the /resume-upload command
            value: "/resume-upload"
          }
        }
      ]
    });
  };
  
  module.exports = { help };
  
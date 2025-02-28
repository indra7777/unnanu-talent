const  getTop5JobsForUser = require('../data/getTop5Jobs');

const jobs = async ({ command, ack, respond, client }) => {
    await ack(); // Acknowledge the slash command
  
    try {
      // Hardcoded user => ignoring, or you might pass command.user_id
      const userId = command.user_id;
  
      // Use the test data function
      const matchedJobs = await getTop5JobsForUser(userId);
  
      if (!matchedJobs || matchedJobs.length === 0) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: userId,
          text: "No jobs found matching your profile right now. (Testing data)"
        });
        return;
      }
  
      // Build the blocks
      const blocks = [];
      matchedJobs.forEach((job) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${job.title}*\n${job.company} - ${job.location}\n${job.shortDescription}`
          }
        });
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Match Score:* ${job.matchScore}`
            }
          ]
        });
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Save'
              },
              style: 'primary',
              action_id: `save_job_${job.id}`
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Apply Now'
              },
              style: 'primary',
              // In testing, we might just open a dummy link
              url: job.applyUrl
              // or if you want to capture a click, use an action_id instead
              // action_id: `apply_job_${job.id}`
            }
          ]
        });
        blocks.push({ type: 'divider' });
      });
  
      // Post ephemeral so only the user sees it
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: userId,
        text: 'Here are your top job matches! (Test Data)',
        blocks
      });
    } catch (error) {
      console.error('Error with /jobs command:', error);
      await respond({ text: 'Oops! Something went wrong fetching test jobs.' });
    }
  };
 
  
 

 module.exports = { jobs };
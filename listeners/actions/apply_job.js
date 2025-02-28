const apply_jobs = async ({ ack, body, client }) => {
    await ack();
  
    const jobId = body.actions[0].action_id.replace('apply_job_', '');
    const userId = body.user.id;
  
    // Possibly open a new modal or redirect them to your external “apply” link
    // Example: open a Slack modal for additional questions
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'apply_job_modal',
        title: {
          type: 'plain_text',
          text: 'Apply for Job'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `You're applying for job #${jobId}!`
            }
          },
          // Additional form fields here...
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
  };
  
  module.exports = { apply_jobs };
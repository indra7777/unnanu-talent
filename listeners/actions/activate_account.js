const axios = require('axios');

const activate_account = async ({ ack, body, client }) => {
  await ack();

  console.log(body);
  
  const activationUrl = body.actions[0].value;

  try {
    const response = await axios.get(activationUrl);

    if (response.status === 200) {
      // Open a modal with success message
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: {
            type: 'plain_text',
            text: 'Account Activation'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '✅ Your account has been activated successfully!'
              }
            }
          ]
        }
      });

      // Update the original message with disabled button
      await client.chat.update({
        channel: body.channel.id,  // Ensure these values match the original message response
        ts: body.message.ts,
        text: body.message.text,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Your account has been activated successfully!"
            }
          }
        ]
      });
    } else {
      // Show error modal
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: {
            type: 'plain_text',
            text: 'Activation Error'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '❌ There was an issue activating your account. Please try again later.'
              }
            }
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error activating account:', error);
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Activation Error'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '❌ There was an issue activating your account. Please try again later.'
            }
          }
        ]
      }
    });
  }
};

module.exports = {activate_account};
const axios = require('axios');
const { AUTH_TOKEN } = process.env;

const upload_skills = async ({ ack, body, view, client }) => {
  try {
    const teamId = body.team_id || (body.team && body.team.id);
    const userId = body.user_id || (body.user && body.user.id);

    // Extract selected skills from the view state
    const selectedSkills = view.state.values.skill_input_block.skill_input.selected_options.map(
      option => option.text.text
    );

    // Prepare payload
    const payload = {
      skills: selectedSkills
    };

    // Make API call to update skills
    const response = await axios.post(
      `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/skill/update`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Acknowledge the submission with a response modal
    await ack({
      response_action: 'update',
      view: {
        type: 'modal',
        callback_id: response.status === 200 ? 'upload_skills_done' : 'upload_skills_not_done',
        title: {
          type: 'plain_text',
          text: response.status === 200 ? 'Skills Updated' : 'Update Failed'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: response.status === 200 
                ? 'Your skills were updated successfully.' 
                : 'There was an error updating your skills. Please try again.'
            }
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error updating skills:', error);
    await ack({
      response_action: 'update',
      view: {
        type: 'modal',
        callback_id: 'upload_skills_error',
        title: {
          type: 'plain_text',
          text: 'Error'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'An error occurred while updating your skills. Please try again.'
            }
          }
        ]
      }
    });
  }
};

module.exports = { upload_skills };
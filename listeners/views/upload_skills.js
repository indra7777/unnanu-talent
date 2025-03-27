const axios = require('axios');
const { AUTH_TOKEN } = process.env;

const upload_skills = async ({ ack, body, view, client }) => {
  await ack();

  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);

  console.log('Processing skill update for teamId:', teamId, 'userId:', userId);

  // Safely access selected options with thorough null checks
  let selectedOptions = [];
  try {
    // Handle the case where no skills are selected
    if (view.state?.values?.skill_input_block?.skill_input?.selected_options) {
      selectedOptions = view.state.values.skill_input_block.skill_input.selected_options;
    }
  } catch (e) {
    console.error('Error accessing selected options:', e);
    await client.chat.postEphemeral({
      channel: body.user.id,
      user: body.user.id,
      text: 'Error processing skills. Please try again.'
    });
    return;
  }
  
  console.log('Selected options count:', selectedOptions.length);

  // Process the selected skills and ensure consistent property naming
  const selectedSkills = selectedOptions.map(option => {
    const value = option.value;
    const text = option.text.text;
    
    // Handle new skills with the "new-" prefix
    if (value.startsWith('new-')) {
      const skillName = value.substring(4).trim();
      console.log(`Processing new skill: ${skillName}`);
      return {
        SkillName: skillName,
        IsNew: true
      };
    } else {
      // Regular existing skill - ensure we use SkillId consistently
      const skillId = parseInt(value);
      console.log(`Processing existing skill: ${text} (ID: ${skillId})`);
      return {
        SkillName: text,
        value: skillId
      };
    }
  });
  
  console.log('Formatted skills payload:', JSON.stringify(selectedSkills));

  try {
    // Use the hardcoded URL to ensure consistency
    const requestUrl = `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/skill/update`;
    console.log('Making API request to:', requestUrl);
    
    const response = await axios.post(
      requestUrl,
      selectedSkills, // Send the array directly as the API expects
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API response:', JSON.stringify(response.data));

    // Send success message to the user
    await client.chat.postEphemeral({
      channel: body.user.id,
      user: body.user.id,
      text: 'Skills updated successfully!'
    });
  } catch (error) {
    console.error('Error updating skills:', error);
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response status:', error.response.status);
    }
    
    await client.chat.postEphemeral({
      channel: body.user.id,
      user: body.user.id,
      text: 'Error updating skills. Please try again.'
    });
  }
};

module.exports = { upload_skills };
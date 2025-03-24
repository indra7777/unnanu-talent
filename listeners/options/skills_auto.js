const axios = require('axios');
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const skills_auto = async ({ options, ack, context }) => {
  try {
    const teamId = context.teamId;
    const userId = context.userId;
    
    // Make API call to fetch skills based on search query
    const response = await axios.get(
      `${process.env.BACKEND_URI}/autocomplete/skills/${options.value}`,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    // Transform the API response into the required format for Slack
    const skills = response.data.Data.map(skill => ({
      text: {
        type: 'plain_text',
        text: skill.Name,
      },
      value: skill.Id.toString()
    }));

    // Acknowledge the request with the skills options
    await ack({
      options: skills
    });

  } catch (error) {
    console.error('Error fetching skills:', error);
    // Return empty options array in case of error
    await ack({
      options: []
    });
  }
};

module.exports = { skills_auto };
const axios = require('axios');
const { AUTH_TOKEN } = process.env;

const skills_auto = async ({ ack, body, client, options, context }) => {
  try {
    const userId = context.userId;
    const teamId = context.teamId;
    
    // Log the options received from Slack
    console.log('Options received from Slack:', JSON.stringify(options));
    console.log('Search term:', options.value);
    
    // Log the URL being requested
    const requestUrl = `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/skills/${options.value}`;
    console.log('Making API request to:', requestUrl);
    
    // Make API call to fetch skills based on search query
    const response = await axios.get(
      requestUrl,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    console.log('Skills API response:', JSON.stringify(response.data));
    
    // Check if the response data is null, undefined, or empty
    const hasSkills = response.data && 
                      response.data.Data && 
                      Array.isArray(response.data.Data) && 
                      response.data.Data.length > 0;
    
    let skills = [];
    
    if (hasSkills) {
      skills = response.data.Data.map(skill => ({
        text: {
          type: 'plain_text',
          text: skill.SkillName,
        },
        value: skill.SkillId?.toString() || skill.Id?.toString()
      }));
      console.log(`Found ${skills.length} matching skills from API`);
    } else {
      console.log('No skills found or invalid response format');
    }
    
    // Always add the option to create a new skill if the user entered something
    if (options.value.trim() && (!hasSkills || !skills.some(s => s.text.text.toLowerCase() === options.value.toLowerCase()))) {
      console.log(`Adding option to create new skill: ${options.value}`);
      skills.push({
        text: {
          type: 'plain_text',
          text: `${options.value} (New)`,
        },
        value: `new-${options.value}`
      });
    }
    
    console.log('Final skills options:', JSON.stringify(skills));
    
    // Acknowledge the request with the skills options
    await ack({
      options: skills
    });
  } catch (error) {
    console.error('Error in skills_auto:', error);
    
    // Even if the API fails, still allow adding a new skill
    if (options.value.trim()) {
      console.log(`Error occurred, still adding "${options.value}" as new skill option`);
      await ack({
        options: [{
          text: {
            type: 'plain_text',
            text: `${options.value} (New)`,
          },
          value: `new-${options.value}`
        }]
      });
    } else {
      // If no search term, return empty options
      await ack({
        options: []
      });
    }
  }
};

module.exports = { skills_auto };
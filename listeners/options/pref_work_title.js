const axios = require('axios');
const  AUTH_TOKEN = process.env.AUTH_TOKEN;

const pref_work_title = async ({ options, ack ,context}) => {
  try {

    const teamId = context.teamId;
    const userId = context.userId;
    const response = await axios.get(`https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/prof/${options.value}`,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    const professions = response.data.Data.map(profession => ({
      text: {
        type: 'plain_text',
        text: profession.Name,
      },
      value: profession.Id.toString()
    }));

    await ack({
      options: professions
    });
  } catch (error) {
    console.error('Error fetching professions:', error);
    await ack({
      options: []
    });
  }
};

module.exports = {pref_work_title};
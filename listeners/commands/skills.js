
const axios = require('axios');
const { AUTH_TOKEN } = process.env;
const skills =  async ({ command, ack, client,body }) => {
  await ack();
  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);
  try {
    // Fetch user's current skills
    const response = await axios.get(`${process.env.BACKEND_URI}/user/slack/${teamId}/${userId}/skill/get`,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    const skills = response.data;

    const initialOptions = skills.map(skill => ({
      text: {
        type: 'plain_text',
        text: skill.SkillName
      },
      value: skill.Id.toString()
    }));

    const result = await client.views.open({
    trigger_id: command.trigger_id || body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'upload_skills',
        title: {
          type: 'plain_text',
          text: 'Update Skills'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'skill_input_block',
            element: {
              type: 'multi_external_select',
              action_id: 'skill_input',
              placeholder: {
                type: 'plain_text',
                text: 'Search for skills...'
              },
              initial_options: initialOptions,
              min_query_length: 1
            },
            label: {
              type: 'plain_text',
              text: 'Skills'
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Save'
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {skills};
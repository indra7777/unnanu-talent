const axios = require('axios');
const { JSDOM } = require("jsdom");
const mrkdwn = require('html-to-mrkdwn');

const jobs = async ({ command, ack, respond, client, body }) => {
    await ack(); // Acknowledge the slash command
    const teamId = body.team_id || (body.team && body.team.id);
    const userId = body.user_id || (body.user && body.user.id);
    try {
        const response = await axios.get(`https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/ulist`, {
            headers: {
                Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });
        console.log(response.data);
        const matchedJobs = response.data.Data;

        if (matchedJobs === 'No Match Data Found.') {
            await client.chat.postEphemeral({
                channel: command.channel_id || body.channel_id,
                user: userId,
                text: "No jobs found matching your profile right now."
            });
            return;
        }

        // Subset 2 jobs from the list
        const subsetJobs = matchedJobs.slice(0, 2);

        // Build the blocks
        const blocks = [];
        console.log(mrkdwn(subsetJobs[0].text).text);

        subsetJobs.forEach((job) => {
            let jobDescription = mrkdwn(job.text).text;
            if (jobDescription.length > 1000) {
                jobDescription = jobDescription.substring(0, 1000) + '...';
            }

            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${job.j_title}*\n${job.company_name} - ${job.location}\n*Match Score: ${job.matchscore}*\n${jobDescription}`
                }
            });
            // blocks.push({
            //     type: 'context',
            //     elements: [
            //         {
            //             type: 'mrkdwn',
            //             text: `*Match Score:* ${job.matchscore}`
            //         }
            //     ]
            // });
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
                        action_id: `save_job_${job.j_id}`
                    },
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Apply Now'
                        },
                        url: job.apply_link || 'https://default.apply.link' // Ensure URL is not null
                    }
                ]
            });
            blocks.push({ type: 'divider' });
        });

        // Post ephemeral so only the user sees it
        await client.chat.postEphemeral({
            channel: command.channel_id || body.channel_id,
            user: userId,
            text: 'Here are your top job matches! (Test Data)',
            blocks: blocks
        });
    } catch (error) {
        console.error('Error with /jobs command:', error);
        await client.chat.postEphemeral({
            channel: command.channel_id || body.channel_id,
            user: userId,
            text: 'Oops! Something went wrong fetching test jobs.'
        });
    }
};

module.exports = { jobs };
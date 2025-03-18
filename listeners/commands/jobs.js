// const  getTop5JobsForUser = require('../data/getTop5Jobs');

const axios = require('axios');
const { JSDOM } = require("jsdom");
const mrkdwn = require('html-to-mrkdwn')

const jobs = async ({ command, ack, respond, client,body }) => {
    await ack(); // Acknowledge the slash command
  
    try {
      // Hardcoded user => ignoring, or you might pass command.user_id
      const teamId = body.team_id || (body.team && body.team.id);
      const userId = body.user_id || (body.user && body.user.id);

  
      // Use the test data function
      // const matchedJobs = await getTop5JobsForUser(userId);

      const resonse = await axios.get(`https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/ulist`,
        {
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          }
        }
      );
      console.log(resonse.data);
      const matchedJobs = resonse.data.Data;
  
      if ( matchedJobs === 'No Match Data Found.') {
        await client.chat.postEphemeral({
          channel: command.channel_id || body.channel_id,
          user: userId,
          text: "No jobs found matching your profile right now."
        });
        return;
      }
  
      // Build the blocks
      const blocks = [];
      console.log(mrkdwn(matchedJobs[0].text).text);
      
      matchedJobs.forEach((job) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${job.j_title}*\n${job.company_name} - ${job.location}\n${mrkdwn(job.text).text}`
          }
        });
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Match Score:* ${job.matchscore}`
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
        channel: command.channel_id || body.channel_id,
        user: userId,
        text: 'Here are your top job matches! (Test Data)',
        blocks
      });
    } catch (error) {
      console.error('Error with /jobs command:', error);
      await client.chat.postEphemeral({channel : command.channel_id , text: 'Oops! Something went wrong fetching test jobs.' });
    }
  };

  


    function extractJobSummary(htmlString) {
      // Parse the HTML using JSDOM
      let dom = new JSDOM(htmlString);
      let doc = dom.window.document;
  
      // Extract job title
      let titleElement = doc.querySelector("div");
      let jobTitle = titleElement ? titleElement.textContent.match(/Sr\.? Java Developer/i) : "Java Developer";
  
      // Extract employment type
      let employmentType = htmlString.includes("Full-time") ? "Full-time" : "Contract";
  
      // Extract required skills
      let requiredSkills = [...doc.querySelectorAll("ul:first-of-type li")].map(li => li.textContent.trim());
  
      // Extract preferred skills
      let preferredSkills = [...doc.querySelectorAll("ul:nth-of-type(2) li")].map(li => li.textContent.trim());
  
      // Combine skills and limit the length
      let topSkills = [...new Set([...requiredSkills, ...preferredSkills])].slice(0, 5).join(", ");
  
      // Generate the short description
      // console.log(`Hiring ${jobTitle} (${employmentType}). Key skills: ${topSkills}.`);
      return `Hiring ${jobTitle} (${employmentType}). Key skills: ${topSkills}.`;
  }




 
  
 

 module.exports = { jobs };
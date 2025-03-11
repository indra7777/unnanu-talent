

const link_shared = async ({ event, client, logger }) => {
    try {
      logger.info('Link shared event received:', {
        channel: event.channel,
        channel_type: event.channel_type,
        user: event.user,
        links: event.links
      });
  
      const jobUrl = event.links[0].url;
      // Extract jobId from URL
      const jobId = jobUrl.split('/job/')[1].split('/')[0];
  
      // Temporary fake job data
      const jobData = {
        title: "Senior Business Analyst",
        company: "PMCS Services Inc",
        location: "Austin, TX",
        description: "We are seeking an experienced Senior Business Analyst to join our team. The ideal candidate will have strong analytical skills, excellent communication abilities, and experience in requirements gathering and documentation.",
        salary: "$120,000 - $150,000 per year",
        employmentType: "Full-time",
        requirements: [
          "5+ years of Business Analysis experience",
          "Bachelor's degree in Business or related field",
          "Strong SQL and data analysis skills"
        ]
      };
  
      // Create unfurl content with jobId
      const unfurl = {
        [jobUrl]: {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${jobData.title}*\n${jobData.company}\n${jobData.location}`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: jobData.description.substring(0, 150) + "..."
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Salary:*\n${jobData.salary}`
                },
                {
                  type: "mrkdwn",
                  text: `*Type:*\n${jobData.employmentType}`
                }
              ]
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "View Job Details"
                  },
                  url: jobUrl,
                  style: "primary"
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Apply Now"
                  },
                  action_id: "apply_job",
                  value: jobId // Now jobId is defined
                }
              ]
            }
          ]
        }
      };
  
      await client.chat.unfurl({
        channel: event.channel,
        ts: event.message_ts,
        unfurls: unfurl
      });
  
      logger.info('Link unfurled successfully');
    } catch (error) {
      logger.error('Error in link_shared event:', {
        error: error.message,
        channel: event.channel,
        url: event.links[0]?.url
      });
      
      // Attempt to send error message
      try {
        await client.chat.postMessage({
          channel: event.channel,
          text: "Sorry, I couldn't process that job link. Please try again later."
        });
      } catch (msgError) {
        logger.error('Error sending error message:', msgError);
      }
    }
  };
  
  module.exports = {link_shared};
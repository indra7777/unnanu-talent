const axios = require('axios');

const get_profile = async ({ command, ack, client, body }) => {
  // Acknowledge the slash command immediately
  await ack();
  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);
  try {
    // Fetch profile data from your API
    const response = await axios.get(
      `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/get`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Assume response.data is an array and take the first profile object
    const profile = response.data[0];

    // Construct the profile text using the dynamic data
    const profileText = 
      `*User ID:* ${profile.UserId}\n` +
      `*Name:* ${profile.FirstName} ${profile.LastName}\n` +
      `*Availability:* ${profile.Availability}\n` +
      `*Pay Range:* $${profile.StartPay} - $${profile.EndPay}\n` +
      `*Location:* ${profile.Location}\n` +
      `*Job Title:* ${profile.JobTitle.trim()}\n` +
      `*Verified:* ${profile.IsVerified ? 'Yes' : 'No'}\n` +
      `*Referral ID:* ${profile.ReferralId}\n` +
      `*Work Type:* ${profile.WorkType}\n` +
      `*Willing To Relocate:* ${profile.WillingToRelocate}\n` +
      `*Profile Pic Shared:* ${profile.shareProfilePic}\n` +
      `*Web Links:* ${profile.webLinks ? profile.webLinks : 'None'}`;

    // Open a modal to display the profile details
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "profile_details",
        title: {
          type: "plain_text",
          text: "Profile Details"
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: profileText
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { get_profile };

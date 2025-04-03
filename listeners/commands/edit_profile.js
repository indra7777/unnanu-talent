const axios = require('axios');

const edit_profile = async ({ command, ack, client, body }) => {
  // Acknowledge the command immediately
  await ack();
  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);

  try {
    // Open a modal to collect the specified information
    const response = await axios.get(`${process.env.BACKEND_URI}/user/slack/${teamId}/${userId}/get`, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const workTypeStaticOptions = [
      { text: { type: 'plain_text', text: 'Contract' }, value: '0' },
      { text: { type: 'plain_text', text: 'Internship' }, value: '1' },
      { text: { type: 'plain_text', text: 'Full-Time' }, value: '2' },
      { text: { type: 'plain_text', text: 'Volunteer' }, value: '3' }
    ];
    
    // Convert the job types from the API to strings (if they aren't already)
    const jobTypesFromResponse = response.data[0].JobTypes.map(type => type.toString());
    
    // Filter the static options to only include those that match the API values
    const initialWorkTypeOptions = workTypeStaticOptions.filter(option =>
      jobTypesFromResponse.includes(option.value)
    );
    

    const workAuthOptions = [
      { text: { type: 'plain_text', text: 'US Citizen' }, value: '1' },
      { text: { type: 'plain_text', text: 'Green Card Holder' }, value: '2' },
      { text: { type: 'plain_text', text: 'Employment Authorization' }, value: '3' },
      { text: { type: 'plain_text', text: 'Have H1 Visa' }, value: '4' },
      { text: { type: 'plain_text', text: 'Need H1 Visa' }, value: '5' },
      { text: { type: 'plain_text', text: 'Canadian Citizen' }, value: '6' },
      { text: { type: 'plain_text', text: 'TN Permit Holder' }, value: '7' }
    ];

    const initialWorkAuthOption = workAuthOptions.find(option => option.value === response.data[0].WorkType.toString());

    const availabilityOptions = [
      { text: { type: 'plain_text', text: 'Immediate' }, value: '1' },
      { text: { type: 'plain_text', text: 'In Two Weeks' }, value: '2' },
      { text: { type: 'plain_text', text: 'In a Month' }, value: '3' },
      { text: { type: 'plain_text', text: 'In Two Months' }, value: '4' },
      { text: { type: 'plain_text', text: 'After Two Months' }, value: '5' },
      { text: { type: 'plain_text', text: 'Not Available' }, value: '6' },
      { text: { type: 'plain_text', text: 'Open' }, value: '7' }
    ];

    const initialAvailabilityOption = availabilityOptions.find(option => option.value === response.data[0].Availability.toString());

    const initialWillingToRelocateOption = {
      text: { type: 'plain_text', text: response.data[0].WillingToRelocate ? 'Yes' : 'No' },
      value: response.data[0].WillingToRelocate ? 'Yes' : 'No'
    };
    
    // Check if JobTitle exists and is not empty
    const hasJobTitle = response.data[0].JobTitle && response.data[0].JobTitle.trim() !== '';
    
    // Check if JobTitle1 exists and is not empty
    const hasJobTitle1 = response.data[0].JobTitle1 && response.data[0].JobTitle1.trim() !== '';
    
    // Check if JobTitle2 exists and is not empty
    const hasJobTitle2 = response.data[0].JobTitle2 && response.data[0].JobTitle2.trim() !== '';

    // Create blocks array
    const blocks = [
      {
        type: 'input',
        block_id: 'first_name_block',
        label: { type: 'plain_text', text: 'First Name*' },
        element: { type: 'plain_text_input', action_id: 'first_name_input', initial_value: response.data[0].FirstName }
      },
      {
        type: 'input',
        block_id: 'last_name_block',
        label: { type: 'plain_text', text: 'Last Name*' },
        element: { type: 'plain_text_input', action_id: 'last_name_input', initial_value: response.data[0].LastName }
      }
    ];
    
    // Add Preferred Work Title block with conditional initial_option
    blocks.push({
      type: 'input',
      block_id: 'preferred_work_title_block',
      label: { type: 'plain_text', text: 'Preferred Work Title*' },
      element: { 
        type: 'external_select', 
        action_id: 'preferred_work_title_input',
        ...(hasJobTitle ? { 
          initial_option: { 
            text: { type: 'plain_text', text: response.data[0].JobTitle }, 
            value: response.data[0].JobTitle 
          } 
        } : {})
      }
    });
    
    // Add Alternate Title block with conditional initial_option
    blocks.push({
      type: 'input',
      block_id: 'alternate_title_block',
      label: { type: 'plain_text', text: 'Alternate Title (Optional)' },
      element: { 
        type: 'external_select', 
        action_id: 'alternate_work_title_input',
        ...(hasJobTitle1 ? { 
          initial_option: { 
            text: { type: 'plain_text', text: response.data[0].JobTitle1 }, 
            value: response.data[0].JobTitle1 
          } 
        } : {})
      }
    });
    
    // Add Other Title block with conditional initial_option
    blocks.push({
      type: 'input',
      block_id: 'other_title_block',
      label: { type: 'plain_text', text: 'Other Title (Optional)' },
      element: { 
        type: 'external_select', 
        action_id: 'other_work_title_input',
        ...(hasJobTitle2 ? { 
          initial_option: { 
            text: { type: 'plain_text', text: response.data[0].JobTitle2 }, 
            value: response.data[0].JobTitle2 
          } 
        } : {})
      }
    });
    
    // Add the rest of the blocks
    blocks.push(
      {
        type: "section",
        text: { type: "plain_text", text: "Please enter your desired pay rate range per hour in USD. You can enter whole numbers or decimal numbers (e.g., 20 or 20.50)." }
      },
      {
        type: "input",
        block_id: "start_pay_rate_block",
        label: { type: "plain_text", text: "Min (per Hourly in USD)" },
        element: { type: "plain_text_input", initial_value: response.data[0].StartPay.toString(), action_id: "start_pay_rate_input" }
      },
      {
        type: "input",
        block_id: "end_pay_rate_block",
        label: { type: "plain_text", text: "Max (per Hourly in USD)" },
        element: { type: "plain_text_input", initial_value: response.data[0].EndPay.toString(), action_id: "end_pay_rate_input" }
      },
      {
        type: 'input',
        block_id: 'preferred_work_type_block',
        label: { type: 'plain_text', text: 'Preferred Work Type*' },
        element: {
          type: 'multi_static_select',
          action_id: 'preferred_work_type_input',
          options: workTypeStaticOptions,
          ...(initialWorkTypeOptions.length ? { initial_options: initialWorkTypeOptions } : {})
        }
      },
      {
        type: 'input',
        block_id: 'work_authorization_block',
        label: { type: 'plain_text', text: 'Work Authorization*' },
        element: { 
          type: 'static_select', 
          action_id: 'work_authorization_input', 
          options: workAuthOptions, 
          ...(initialWorkAuthOption ? { initial_option: initialWorkAuthOption } : {})
        }
      },
      {
        type: 'input',
        block_id: 'availability_block',
        label: { type: 'plain_text', text: 'Availability*' },
        element: { 
          type: 'static_select', 
          action_id: 'availability_input', 
          options: availabilityOptions, 
          ...(initialAvailabilityOption ? { initial_option: initialAvailabilityOption } : {})
        }
      },
      {
        type: "input",
        block_id: "residency_location_block",
        label: { type: "plain_text", text: "Residency Location*" },
        element: { type: "plain_text_input", action_id: "residency_location_input", initial_value: response.data[0].Location }
      },
      {
        type: 'input',
        block_id: 'willing_to_relocate_block',
        label: { type: 'plain_text', text: 'Willing to Relocate' },
        element: { 
          type: 'static_select', 
          action_id: 'willing_to_relocate_input', 
          options: [
            { text: { type: 'plain_text', text: 'Yes' }, value: 'Yes' }, 
            { text: { type: 'plain_text', text: 'No' }, value: 'No' }
          ], 
          initial_option: initialWillingToRelocateOption 
        }
      }
    );

    await client.views.open({
      trigger_id: command.trigger_id || body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'upload_profile_form',
        title: { type: 'plain_text', text: 'Edit Profile' },
        blocks: blocks,
        submit: { type: 'plain_text', text: 'Submit' }
      }
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

module.exports = { edit_profile };
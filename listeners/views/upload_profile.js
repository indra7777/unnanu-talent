

const upload_profile = async ({ ack, body, view, client }) => {
    // Acknowledge Slack so it knows we received the submission
    await ack();
  
    // Extract user inputs from the view state
    const firstName = view.state.values.first_name_block.first_name_input.value;
    const lastName = view.state.values.last_name_block.last_name_input.value;
    const preferredWorkTitle = view.state.values.preferred_work_title_block.preferred_work_title_input.selected_option.text.text;
    const alternateTitle = view.state.values.alternate_title_block.alternate_title_input.value;
    const otherTitle = view.state.values.other_title_block.other_title_input.value;
    const desiredPayRate = view.state.values.desired_pay_rate_block.desired_pay_rate_input.value;
    const preferredWorkType = view.state.values.preferred_work_type_block.preferred_work_type_input.selected_option.value;
    const workAuthorization = view.state.values.work_authorization_block.work_authorization_input.selected_option.value;
    const availability = view.state.values.availability_block.availability_input.selected_option.value;
    const residencyLocation = view.state.values.residency_location_block.residency_location_input.value;
    const willingToRelocate = view.state.values.willing_to_relocate_block.willing_to_relocate_input.value;
  
    // The user who submitted the modal
    const userId = body.user.id;
  
    // For demonstration: DM the user a confirmation & instructions
    try {
      await client.chat.postMessage({
        channel: userId,
        text: `Thanks for your info!\n• First Name: ${firstName}\n• Last Name: ${lastName}\n• Preferred Work Title: ${preferredWorkTitle}\n• Alternate Title: ${alternateTitle}\n• Other Title: ${otherTitle}\n• Desired Pay Rate: ${desiredPayRate}\n• Preferred Work Type: ${preferredWorkType}\n• Work Authorization: ${workAuthorization}\n• Availability: ${availability}\n• Residency Location: ${residencyLocation}\n• Willing to Relocate: ${willingToRelocate}\n\n*Please upload your resume* here in this DM or in any channel we both share so I can capture it.`
      });
    } catch (error) {
      console.error('Error sending DM:', error);
    }
  
    // Optionally, store the info in your DB or do other logic
};
  
module.exports = {upload_profile}
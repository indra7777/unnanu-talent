

const upload_profile = async ({ ack, body, view, client }) => {
    // Acknowledge Slack so it knows we received the submission
   
    // console.log("upload_profile body : ",body);
    // console.log("upload_profile view : ",view.state.values.first_name_block);
    console.log("upload_profile view : ",view.state.values.first_name_block);
    console.log("upload_profile view : ",view.state.values.last_name_block);
    console.log("upload_profile view : ",view.state.values.preferred_work_title_block);
    console.log("upload_profile view : ",view.state.values.alternate_title_block);
    console.log("upload_profile view : ",view.state.values.other_title_block);
    console.log("upload_profile view : ",view.state.values.start_pay_rate_block);
    console.log("upload_profile view : ",view.state.values.end_pay_rate_block);
    console.log("upload_profile view : ",view.state.values.preferred_work_type_block.preferred_work_type_input.selected_options);
    console.log("upload_profile view : ",view.state.values.work_authorization_block);
    console.log("upload_profile view : ",view.state.values.availability_block);
    console.log("upload_profile view : ",view.state.values.residency_location_block);
    console.log("upload_profile view : ",view.state.values.willing_to_relocate_block);
    
    
    // Extract user inputs from the view state
    const firstName = view.state.values.first_name_block.first_name_input.value;
    console.log("firstName : ",firstName);
    
    const lastName = view.state.values.last_name_block.last_name_input.value;
    console.log("lastName : ",lastName);
    const preferredWorkTitle = view.state.values.preferred_work_title_block.preferred_work_title_input.selected_option.value;
    console.log("preferredWorkTitle : ",preferredWorkTitle);
    const alternateTitle = view.state.values.alternate_title_block.alternate_work_title_input.selected_option.value;
    console.log("alternateTitle : ",alternateTitle);
    const otherTitle = view.state.values.other_title_block.other_work_title_input.selected_option.value;
    console.log("otherTitle : ",otherTitle);
    // const desiredPayRate = view.state.values.desired_pay_rate_block.desired_pay_rate_input.value;
    const start_pay_rate = view.state.values.start_pay_rate_block.start_pay_rate_input.value;
    console.log("startPayRate : ",start_pay_rate);
    const end_pay_rate = view.state.values.end_pay_rate_block.end_pay_rate_input.value;
    console.log("endPayRate : ",end_pay_rate);
    const preferredWorkType = view.state.values.preferred_work_type_block.preferred_work_type_input.selected_options.map(option => option.value);
    console.log("preferredWorkType : ",preferredWorkType);
    const workAuthorization = view.state.values.work_authorization_block.work_authorization_input.selected_option;
    console.log("workAuthorization :",workAuthorization);
    const availability = view.state.values.availability_block.availability_input.selected_option.value;
    console.log("availability : ",availability);
    const residencyLocation = view.state.values.residency_location_block.residency_location_input.value;
    console.log("residencyLocation : ",residencyLocation);
    const willingToRelocate = view.state.values.willing_to_relocate_block.willing_to_relocate_input.selected_option.value;
    console.log("willingToRelocate : ",willingToRelocate);
  
    // The user who submitted the modal
    const userId = body.user.id;

    const form = new FormData();


    const response =  await fetch(
      `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/update`,
      {
        method: 'POST',
        body: form,
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`
          // Let FormData set the appropriate Content-Type automatically.
        }
      }
    );
  
    // For demonstration: DM the user a confirmation & instructions
    await ack({
      response_action: 'update',
      view: {
        type: 'modal',
        callback_id: response.status === 200 ? 'resume_done' : 'resume_not_done',
        title: {
          type: 'plain_text',
          text: response.status === 200 ? 'Resume Uploaded' : 'Upload Failed'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: response.status === 200 
                ? 'Your resume was uploaded successfully.' 
                : 'There was an error uploading your resume. Please try again.'
            }
          }
        ]
      }
    });
  
    // Optionally, store the info in your DB or do other logic
};
  
module.exports = {upload_profile}
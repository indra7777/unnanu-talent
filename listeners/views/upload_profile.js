

const upload_profile = async ({ ack, body, view, client }) => {
    // Acknowledge Slack so it knows we received the submission
   
  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);
  
     
    // Extract user inputs from the view state
    const firstName = view.state.values.first_name_block.first_name_input.value;
    console.log("firstName : ",firstName);
    
    const lastName = view.state.values.last_name_block.last_name_input.value;
    // console.log("lastName : ",lastName);
    const preferredWorkTitle = view.state.values.preferred_work_title_block.preferred_work_title_input.selected_option.text.text;
    console.log("preferredWorkTitle : ",preferredWorkTitle);
    const alternateTitle = view.state.values.alternate_title_block.alternate_work_title_input.selected_option.text.text;
    console.log("alternateTitle : ",alternateTitle);
    const otherTitle = view.state.values.other_title_block.other_work_title_input.selected_option.text.text;
    console.log("otherTitle : ",otherTitle);

    const start_pay_rate = view.state.values.start_pay_rate_block.start_pay_rate_input.value;
    // console.log("startPayRate : ",start_pay_rate);
    const end_pay_rate = view.state.values.end_pay_rate_block.end_pay_rate_input.value;
    // console.log("endPayRate : ",end_pay_rate);
    const preferredWorkType = view.state.values.preferred_work_type_block.preferred_work_type_input.selected_options.map(option => parseInt(option.value));
    // console.log("preferredWorkType : ",preferredWorkType);
    const workAuthorization = view.state.values.work_authorization_block.work_authorization_input.selected_option;
    // console.log("workAuthorization :",workAuthorization);
    const availability = view.state.values.availability_block.availability_input.selected_option.value;
    // console.log("availability : ",availability);
    const residencyLocation = view.state.values.residency_location_block.residency_location_input.value;
    // console.log("residencyLocation : ",residencyLocation);
    const willingToRelocate = view.state.values.willing_to_relocate_block.willing_to_relocate_input.selected_option.value;
    // console.log("willingToRelocate : ",willingToRelocate);
  
    // The user who submitted the modal
    // const userId = body.user.id;

    // const form = new FormData();
   //payload strucutre 
  //   {
  //     "FirstName": "Mahendar",
  //     "LastName": "Kanjarla",
  //     "Availability": 7,
  //     "JobTitle1": "201",
  //     "JobTitle2": "301",
  //     "Location": "Texas",
  //     "StartPay": 60000.0,
  //     "EndPay": 90000.0,
  //     "DesiredJobType": [0,1],  
  //     "WorkType": 1,  
  //     "WillingToRelocate": true
  // }
    // form.append('FirstName', firstName);
    // form.append('LastName', lastName);
    // form.append('Availability', availability);
    // form.append('JobTitle', preferredWorkTitle);
    // form.append('JobTitle1', alternateTitle);
    // form.append('JobTitle2', otherTitle);
    // form.append('Location', residencyLocation);
    // form.append('StartPay', start_pay_rate);
    // form.append('EndPay', end_pay_rate);
    // form.append('DesiredJobType', JSON.stringify(preferredWorkType));
    // form.append('WorkType', workAuthorization.value);
    // form.append('WillingToRelocate', willingToRelocate === 'Yes');
    // console.log(form);
    const payload = {
      FirstName: firstName,
      LastName: lastName,
      Availability: availability, // Ensure this is the expected type (number or string)
      JobTitle: preferredWorkTitle,
      JobTitle1: alternateTitle,
      JobTitle2: otherTitle,
      Location: residencyLocation,
      StartPay: start_pay_rate,    // Optionally convert these to numbers if required
      EndPay: end_pay_rate,
      DesiredJobType: preferredWorkType, // This will be an array, as expected
      WorkType: workAuthorization.value,
      WillingToRelocate: willingToRelocate === 'Yes'
    };

    const response =  await fetch(
      `${process.env.BACKEND_URI}/user/slack/${teamId}/${userId}/update`,
      {
        method: 'POST',
        body:  JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );
    // await ack();
    // For demonstration: DM the user a confirmation & instructions
    console.log(response);
    
    await ack({
      response_action: 'update',
      view: {
        type: 'modal',
        callback_id: response.status === 200 ? 'upload_profile_done' : 'upload_profile_not_done',
        title: {
          type: 'plain_text',
          text: response.status === 200 ? 'Profile Uploaded' : 'Upload Failed'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: response.status === 200 
                ? 'Your Profile was uploaded successfully.' 
                : 'There was an error uploading your profile details. Please try again.'
            }
          }
        ]
      }
    });
  
    // Optionally, store the info in your DB or do other logic
};
  
module.exports = {upload_profile}
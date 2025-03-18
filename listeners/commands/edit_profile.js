
const axios = require('axios');

const edit_profile = async ({ command, ack, client,body }) => {
  // Acknowledge the command immediately
  await ack();
  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);

  try {
    // Open a modal to collect the specified information
   
    
    const response = await axios.get(`https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/get`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );
    console.log(response.data);
    // [
    //   {
    //     UserId: 5612,
    //     Availability: 7,
    //     StartPay: 24,
    //     EndPay: 84,
    //     Location: 'Austin, TX, USA',
    //     JobTitle: 'Java Developer\n',
    //     JobTitle1: '',
    //     JobTitle2: '',
  
    //     IsVerified: 0,
    //     FirstName: 'Indra',
    //     LastName: 'Prakash',
    //     ReferralId: 'U089XSZ069K',
    //     WillingToRelocate: false,
    //     shareProfilePic: true,
    //JobTypes
    //     webLinks: null
    //   }
    // ]    

    
    // Map work type values to corresponding options
    const workTypeOptions = {
      "0": "Contract",
      "1": "Internship",
      "2": "Full-Time",
      "3": "Volunteer"
    };

    // Determine initial options based on response data
    const initialWorkTypeOptions = response.data[0].JobTypes.map(type => ({
      text: {
        type: 'plain_text',
        text: workTypeOptions[type]
      },
      value: type.toString()
    }));
    // console.log(initialWorkTypeOptions);

     // Map work authorization values to corresponding options
     const workAuthOptions = {
      "1": "US Citizen",
      "2": "Green Card Holder",
      "3": "Employment Authorization",
      "4": "Have H1 Visa",
      "5": "Need H1 Visa",
      "6": "Canadian Citizen",
      "7": "TN Permit Holder"
    };

    // Determine initial option for work authorization based on response data
    const initialWorkAuthOption = {
      text: {
        type: 'plain_text',
        text: workAuthOptions[response.data[0].WorkType]
      },
      value: response.data[0].WorkType.toString()
    };
    // Map availability values to corresponding options
    const availabilityOptions = {
      "1": "Immediate",
      "2": "In Two Weeks",
      "3": "In a Month",
      "4": "In Two Months",
      "5": "After Two Months",
      "6": "Not Available",
      "7": "Open"
    };

    // Determine initial option for availability based on response data
    const initialAvailabilityOption = {
      text: {
        type: 'plain_text',
        text: availabilityOptions[response.data[0].Availability]
      },
      value: response.data[0].Availability.toString()
    };
    const initialWillingToRelocateOption = {
      text: {
        type: 'plain_text',
        text: response.data[0].WillingToRelocate ? 'Yes' : 'No'
      },
      value: response.data[0].WillingToRelocate ? 'Yes' : 'No'
    };

    

    await client.views.open({
      trigger_id: command.trigger_id || body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'upload_profile_form',
        title: {
          type: 'plain_text',
          text: 'Edit Profile'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'first_name_block',
            label: {
              type: 'plain_text',
              text: 'First Name*'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'first_name_input',
              initial_value: response.data[0].FirstName,
            }
          },
          {
            type: 'input',
            block_id: 'last_name_block',
            label: {
              type: 'plain_text',
              text: 'Last Name*'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'last_name_input',
              initial_value: response.data[0].LastName,
            }
          },
          {
            type: 'input',
            block_id: 'preferred_work_title_block',
            label: {
              type: 'plain_text',
              text: 'Preferred Work Title*'
            },
            element: {
              type: 'external_select',
              action_id: 'preferred_work_title_input',
              initial_option : {
                text : {
                  type : 'plain_text',
                  text : response.data[0].JobTitle,
                }
              }
            }
          },
          {
            type: 'input',
            block_id: 'alternate_title_block',
            label: {
              type: 'plain_text',
              text: 'Alternate Title (Optional)'
            },
            element: {
              type: 'external_select',
              action_id: 'alternate_work_title_input',
             
                initial_option : {
                  text : {
                    type : 'plain_text',
                    text : response.data[0].JobTitle1,
                  }
                }
              
            }
          },
          {
            type: 'input',
            block_id: 'other_title_block',
            label: {
              type: 'plain_text',
              text: 'Other Title (Optional)'
            },
            element: {
              type: 'external_select',
              action_id: 'other_work_title_input',
              initial_option : {
                text : {
                  type : 'plain_text',
                  text : response.data[0].JobTitle2,
                }
              }
            }
          },
          {
            type: "section",
            text: {
             type: "plain_text",
              text: "Please enter your desired pay rate range per hour in USD. You can enter whole numbers or decimal numbers (e.g., 20 or 20.50)."
            }
          },
          {
           type: "input",
           block_id : "start_pay_rate_block",
            label: {
             type: "plain_text",
              text: "Start*"
            },
            element: {
             type: "plain_text_input",
              initial_value: response.data[0].StartPay.toString(),
              action_id: "start_pay_rate_input",
            
            }
          },
          {
           type: "input",
            block_id : "end_pay_rate_block",
            label: {
             type: "plain_text",
              text: "End*"
            },
            element: {
             type: "plain_text_input",
             initial_value: response.data[0].EndPay.toString(),
              "action_id": "end_pay_rate_input"
            }
          },
          {
            type: 'input',
            block_id: 'preferred_work_type_block',
            label: {
              type: 'plain_text',
              text: 'Preferred Work Type*'
            },
            element: {
              type: 'multi_static_select',
              action_id: 'preferred_work_type_input',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Full-Time'
                  },
                  value: '2'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Contract'
                  },
                  value: '0'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Internship'
                  },
                  value: '1'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Volunteer'
                  },
                  value: '3'
                }
              ],
              initial_options: initialWorkTypeOptions
            }
          },
          {
            type: 'input',
            block_id: 'work_authorization_block',
            label: {
              type: 'plain_text',
              text: 'Work Authorization*'
            },
            element: {
              type: 'static_select',
              action_id: 'work_authorization_input',
              
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'US Citizen'
                  },
                  value: '1'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Green Card Holder'
                  },
                  value: '2'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Employment Authorization'
                  },
                  value: '3'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Have H1 Visa'
                  },
                  value: '4'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Need H1 Visa'
                  },
                  value: '5'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Canadian Citizen'
                  },
                  value: '6'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'TN Permit Holder'
                  },
                  value: '7'
                }
              ],
              initial_option: initialWorkAuthOption
            }
          },
          {
            type: 'input',
            block_id: 'availability_block',
            label: {
              type: 'plain_text',
              text: 'Availability*'
            },
            element: {
              type: 'static_select',
              action_id: 'availability_input',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Open'
                  },
                  value: '7'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Immediate'
                  },
                  value: '1'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'In Two Weeks'
                  },
                  value: '2'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'In a Month'
                  },
                  value: '3'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'In Two Months'
                  },
                  value: '4'
                },{
                  text: {
                    type: 'plain_text',
                    text: 'After Two Months'
                  },
                  value: '5'
                },{
                  text: {
                    type: 'plain_text',
                    text: 'Not Available'
                  },
                  value: '6'
                }
              ],
              initial_option: initialAvailabilityOption
            }
          },
          {
            type: "input",
            block_id: "residency_location_block",
            label: {
            type: "plain_text",
              text: "Residency Location*"
            },
            element: {
              // type: "external_select",
              type: "plain_text_input",
              action_id: "residency_location_input",
              initial_value : response.data[0].Location
            }
          },
          {
            type: 'input',
            block_id: 'willing_to_relocate_block',
            label: {
              type: 'plain_text',
              text: 'Willing to Relocate'
            },
            element: {
              type: 'static_select',
              action_id: 'willing_to_relocate_input',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Yes'
                  },
                  value: 'Yes'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'No'
                  },
                  value: 'No'
                }
              ],
              initial_option: initialWillingToRelocateOption
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
};

module.exports ={ edit_profile };
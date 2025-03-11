


const edit_profile = async ({ command, ack, client }) => {
  // Acknowledge the command immediately
  await ack();

  try {
    // Open a modal to collect the specified information
    await client.views.open({
      trigger_id: command.trigger_id,
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
              action_id: 'first_name_input'
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
              action_id: 'last_name_input'
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
              placeholder: {
                type: 'plain_text',
                text: 'Select a title'
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
              type: 'plain_text_input',
              action_id: 'alternate_title_input'
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
              type: 'plain_text_input',
              action_id: 'other_title_input'
            }
          },
          {
            type: 'input',
            block_id: 'desired_pay_rate_block',
            label: {
              type: 'plain_text',
              text: 'Desired Pay Rate (Per Hour)*'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'desired_pay_rate_input'
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
                  value: 'Full-Time'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Contract'
                  },
                  value: 'Contract'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Internship'
                  },
                  value: 'Internship'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Volunteer'
                  },
                  value: 'Volunteer'
                }
              ]
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
                  value: 'US Citizen'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Green Card Holder'
                  },
                  value: 'Green Card Holder'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Employment Authorization'
                  },
                  value: 'Employment Authorization'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Have H1 Visa'
                  },
                  value: 'Have H1 Visa'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Need H1 Visa'
                  },
                  value: 'Need H1 Visa'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Canadian Citizen'
                  },
                  value: 'Canadian Citizen'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'TN Permit Holder'
                  },
                  value: 'TN Permit Holder'
                }
              ]
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
                  value: 'Open'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Immediate'
                  },
                  value: 'Immediate'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'In Two Weeks'
                  },
                  value: 'In Two Weeks'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'In a Month'
                  },
                  value: 'In a Month'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'In Two Months'
                  },
                  value: 'In Two Months'
                },{
                  text: {
                    type: 'plain_text',
                    text: 'After Two Months'
                  },
                  value: 'After Two Months'
                },{
                  text: {
                    type: 'plain_text',
                    text: 'Not Available'
                  },
                  value: 'Not Available'
                }
              ]
            }
          },
          {
            type: 'input',
            block_id: 'residency_location_block',
            label: {
              type: 'plain_text',
              text: 'Residency Location*'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'residency_location_input'
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
              ]
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
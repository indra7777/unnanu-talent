const upload_resume = async ({ command, ack, body, client }) => {
  await ack();
  try {
    await client.views.open({
      trigger_id: body.trigger_id || command.trigger_id,
      view: {
        type: "modal",
        title: { type: "plain_text", text: "Upload Resume" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "File size: 2MB or less | File types: 'doc', 'docx', 'txt', .rtf, .odt, .html and 'pdf'."
            }
          },
          {
            type: "input",
            block_id: "input_block_id",
            label: { type: "plain_text", text: "Upload your resume" },
            element: {
              type: "file_input",
              action_id: "file_input_action",
              max_files: 1
            }
          }
        ],
        callback_id: "upload_resume_form"
      }
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { upload_resume };
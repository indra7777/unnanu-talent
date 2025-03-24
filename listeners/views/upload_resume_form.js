
const { Blob } = require('buffer');
// const { channel } = require('diagnostics_channel');



const upload_resume_form = async ({ say ,view, ack, client, body }) => {
  // await ack();
  console.log(body);
  
  const teamId = body.team_id;
  const userId = body.user_id;
  console.log("View form state:", view.state.values.input_block_id.file_input_action);

  // Use the 'value' property from the input block instead of 'files'
  const fileInput = view.state.values.input_block_id.file_input_action;
  if (fileInput && fileInput.files) {
    // Assuming the input returns a file ID as a string
    const fileData = fileInput.files[0];
    const fileId = fileData.id;
    console.log(`File ID: ${fileId}`);

    // Retrieve file information from Slack
    const fileResponse = await client.files.info({ file: fileId });
    const fileUrl = fileResponse.file.url_private;

    // Download file content with proper authorization header
    const resumeData = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
    });
    
    // Declare fileContent as a mutable variable
    let fileContent = await resumeData.arrayBuffer();

    // If file content is directly available from Slack (if provided)
    if (fileResponse.file.content) {
      fileContent = Buffer.from(fileResponse.file.content, 'base64');
    }
    const fileBlob = new Blob([fileContent], {
      type: fileResponse.file.mimetype || 'application/octet-stream'
    });
    
    // Prepare the FormData for the resume upload API
    console.log('fileblob',fileBlob);
    
    const form = new FormData();
    if (fileResponse.file.name) {
      form.append('uploaded_file', fileBlob, fileResponse.file.name);
    } else {
      form.append('uploaded_file', fileBlob);
    }
    form.append('file_type', "1");
    form.append('co_guid',' ');

    // Upload to resume API – do not set 'Content-Type' header manually when using FormData
    const response = await fetch(
      `${process.env.BACKEND_URI}/user/slack/${teamId}/${userId}/resume/upload`,
      {
        method: 'POST',
        body: form,
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`
          // Let FormData set the appropriate Content-Type automatically.
        }
      }
    );
    // const response = {
    //   "status": 200,
    // }
    // console.log("File upload response:", response);
    try {
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
    }catch (error){
      console.error("Error during file upload or modal update:", error);
    // Optionally update the modal with an error message if processing fails
    await ack({
      response_action: "update",
      view: {
        type: "modal",
        callback_id: "resume_not_done",
        title: {
          type: "plain_text",
          text: "Upload Failed"
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "There was an error uploading your resume. Please try again."
            }
          }
        ]
      }
    });
    }
    
    
    
  } else {
    await ack({
      response_action: "update",
      view: {
        type: "modal",
        callback_id: "resume_not_done",
        title: {
          type: "plain_text",
          text: "Upload Failed"
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "Please select a file to upload."
            }
          }
        ]
      }
    });
};
}

module.exports = { upload_resume_form };
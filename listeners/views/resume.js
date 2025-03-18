const { Blob } = require('buffer');

const resume = async ({ view, ack, client, body }) => {
  // Acknowledge immediately so Slack doesn’t timeout or auto-close
  await ack();

  console.log(body);

  const teamId = body.team_id || (body.team && body.team.id);
  const userId = body.user_id || (body.user && body.user.id);
  console.log("View form state:", view.state.values.input_block_id.file_input_action);

  const fileInput = view.state.values.input_block_id.file_input_action;
  
  if (fileInput && fileInput.files) {
    // Get the first file from the input
    const fileData = fileInput.files[0];
    const fileId = fileData.id;
    console.log(`File ID: ${fileId}`);

    try {
      // Retrieve file information from Slack
      const fileResponse = await client.files.info({ file: fileId });
      const fileUrl = fileResponse.file.url_private;

      // Download file content with authorization
      const resumeData = await fetch(fileUrl, {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
      });
      
      // Get file content as an ArrayBuffer (or from Slack's content property)
      let fileContent = await resumeData.arrayBuffer();
      if (fileResponse.file.content) {
        fileContent = Buffer.from(fileResponse.file.content, 'base64');
      }
      
      // Wrap content in a Blob for FormData
      const fileBlob = new Blob([fileContent], {
        type: fileResponse.file.mimetype || 'application/octet-stream'
      });
      
      // console.log('fileBlob:', fileBlob);
      
      // Prepare FormData for the upload API
      // console.log("file blob :",fileBlob );
      // console.log("file respnse :", fileResponse);
      
      
      const form = new FormData();
      if (fileResponse.file.name) {
        form.append('uploaded_file', fileBlob, fileResponse.file.name);
      } else {
        form.append('uploaded_file', fileBlob);
      }
      if (fileResponse.file.mimetype === 'application/pdf') {
        form.append('file_type', '1');
      } else if (fileResponse.file.mimetype === 'text/html') {
        form.append('file_type', '4');
      } else if (
        fileResponse.file.mimetype === 'text/plain' ||
        file.name.substr(file.name.indexOf('.') + 1) === 'rtf'
      ) {
        form.append('file_type', '3');
      } else {
        form.append('file_type', '2');
      }
      // form.append('file_type', '1');
      form.append('co_guid', ' ');

      // Upload to resume API
      const response = await fetch(
        `https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/${teamId}/${userId}/resume/upload`,
        {
          method: 'POST',
          body: form,
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`
            // Let FormData set the Content-Type automatically.
          }
        }
      );
      console.log("File upload response:", response);

      // Open a new modal with the result using the trigger_id from the original payload.
      // (trigger_id is valid for up to 30 seconds)
      await client.views.open({
        trigger_id: body.trigger_id,
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
    } catch (error) {
      console.error("Error during file upload or modal open:", error);
      // In case of error, open a modal with an error message.
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'resume_not_done',
          title: {
            type: 'plain_text',
            text: 'Upload Failed'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'plain_text',
                text: 'There was an error uploading your resume. Please try again.'
              }
            }
          ]
        }
      });
    }
  } else {
    // No file selected: inform the user via a new modal.
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'resume_not_done',
        title: {
          type: 'plain_text',
          text: 'Upload Failed'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Please select a file to upload.'
            }
          }
        ]
      }
    });
  }
};

module.exports = { resume };

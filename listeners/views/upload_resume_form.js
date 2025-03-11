

const upload_resume_form = async ({ view, ack, client, body }) => {
    await ack();
    const fileInput = view.state.values['file_input_block']['file_input_action'];
    const nameInput = view.state.values['name_input_block']['name_input_action'];
    const emailInput = view.state.values['email_input_block']['email_input_action'];
    if (fileInput && fileInput.files) {
      const files = fileInput.files;
      for (const file of files) {
        console.log(`File ID: ${file.id}, Name: ${file.name}`);
        // Download file content
        const fileResponse = await client.files.get({ file: file.id });
        let fileContent;
        if (fileResponse.file.content) {
          fileContent = Buffer.from(fileResponse.file.content, 'base64');
        } else {
          const url = fileResponse.file.url;
          const response = await fetch(url);
          fileContent = await response.arrayBuffer();
        }
        // Upload to resume API
        const form = new FormData();
        form.append('resume', fileContent, { filename: file.name });
       const response =  await fetch('https://uat-recruit-api-v5.unnanu.com/api/v1/profile/resume/upload', {
          method: 'POST',
          body: form
        });
  
        console.log("file upload response");
        
        // Submit additional information
        const infoData = {
          name: nameInput.value,
          email: emailInput.value,
          fileId: file.id // Example additional field
        };
        await fetch('https://uat-recruit-api-v5.unnanu.com/api/v1/profile/information', {
          method: 'POST',
          body: JSON.stringify(infoData),
          headers: { 'Content-Type': 'application/json' }
        });
        // Send confirmation
        await client.chat.postMessage({ channel: body.user.id, text: 'Resume received successfully.' });
      }
    }
  };

    module.exports = { upload_resume_form };
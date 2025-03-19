const { resume } = require('./resume');
const { Blob } = require('buffer');
const fetch = require('node-fetch');

// filepath: /Users/jamamacbook/Documents/unnanu/unnanu-talent/listeners/views/resume.test.js
jest.mock('node-fetch');

describe('resume', () => {
  let ack, client, body, view;

  beforeEach(() => {
    ack = jest.fn();
    client = {
      files: {
        info: jest.fn(),
      },
      views: {
        open: jest.fn(),
      },
    };
    body = {
      team_id: 'T123',
      user_id: 'U123',
      trigger_id: 'trigger123',
    };
    view = {
      state: {
        values: {
          input_block_id: {
            file_input_action: {
              files: [
                {
                  id: 'file123',
                },
              ],
            },
          },
        },
      },
    };
    process.env.SLACK_BOT_TOKEN = 'test_slack_bot_token';
    process.env.AUTH_TOKEN = 'test_auth_token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should acknowledge the view submission', async () => {
    await resume({ view, ack, client, body });
    expect(ack).toHaveBeenCalled();
  });

  it('should handle file upload and open success modal', async () => {
    client.files.info.mockResolvedValue({
      file: {
        url_private: 'https://test.url/file.pdf',
        mimetype: 'application/pdf',
        name: 'resume.pdf',
      },
    });
    fetch.mockResolvedValueOnce({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
    });
    fetch.mockResolvedValueOnce({
      status: 200,
    });

    await resume({ view, ack, client, body });

    expect(client.files.info).toHaveBeenCalledWith({ file: 'file123' });
    expect(fetch).toHaveBeenCalledWith('https://test.url/file.pdf', {
      headers: { Authorization: 'Bearer test_slack_bot_token' },
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/T123/U123/resume/upload',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test_auth_token' },
      })
    );
    expect(client.views.open).toHaveBeenCalledWith({
      trigger_id: 'trigger123',
      view: expect.objectContaining({
        callback_id: 'resume_done',
        title: expect.objectContaining({ text: 'Resume Uploaded' }),
      }),
    });
  });

  it('should handle file upload error and open error modal', async () => {
    client.files.info.mockResolvedValue({
      file: {
        url_private: 'https://test.url/file.pdf',
        mimetype: 'application/pdf',
        name: 'resume.pdf',
      },
    });
    fetch.mockResolvedValueOnce({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
    });
    fetch.mockRejectedValueOnce(new Error('Upload failed'));

    await resume({ view, ack, client, body });

    expect(client.files.info).toHaveBeenCalledWith({ file: 'file123' });
    expect(fetch).toHaveBeenCalledWith('https://test.url/file.pdf', {
      headers: { Authorization: 'Bearer test_slack_bot_token' },
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/T123/U123/resume/upload',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test_auth_token' },
      })
    );
    expect(client.views.open).toHaveBeenCalledWith({
      trigger_id: 'trigger123',
      view: expect.objectContaining({
        callback_id: 'resume_not_done',
        title: expect.objectContaining({ text: 'Upload Failed' }),
      }),
    });
  });

  it('should handle no file selected and open error modal', async () => {
    view.state.values.input_block_id.file_input_action.files = [];

    await resume({ view, ack, client, body });

    expect(client.views.open).toHaveBeenCalledWith({
      trigger_id: 'trigger123',
      view: expect.objectContaining({
        callback_id: 'resume_not_done',
        title: expect.objectContaining({ text: 'Upload Failed' }),
        blocks: expect.arrayContaining([
          expect.objectContaining({
            text: expect.objectContaining({
              text: 'Please select a file to upload.',
            }),
          }),
        ]),
      }),
    });
  });

  it('should handle file content from Slack and open success modal', async () => {
    client.files.info.mockResolvedValue({
      file: {
        url_private: 'https://test.url/file.pdf',
        mimetype: 'application/pdf',
        name: 'resume.pdf',
        content: 'base64encodedcontent',
      },
    });

    await resume({ view, ack, client, body });

    expect(client.files.info).toHaveBeenCalledWith({ file: 'file123' });
    expect(fetch).toHaveBeenCalledWith(
      'https://uat-talent-oth-v5.unnanu.com/api/v1/user/slack/T123/U123/resume/upload',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test_auth_token' },
      })
    );
    expect(client.views.open).toHaveBeenCalledWith({
      trigger_id: 'trigger123',
      view: expect.objectContaining({
        callback_id: 'resume_done',
        title: expect.objectContaining({ text: 'Resume Uploaded' }),
      }),
    });
  });
});
const saved_jobs = async ({ ack, body, client }) => {
    await ack();
    const jobId = body.actions[0].action_id.replace('save_job_', '');
    const userId = body.user.id;
  
    console.log(`User ${userId} saved job ${jobId} (test data)`);
  
    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: userId,
      text: `Job #${jobId} saved! (Test)`,
    });
  };

  module.exports = { saved_jobs };
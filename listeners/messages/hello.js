const hello = async ({ context, say }) => {
    try {
      console.log('Bot Token:', context.botToken);
      const greeting = context.matches[0];
      await say(`${greeting}, how are you?`);
    } catch (error) {
      console.error(error);
    }
  };
  
module.exports = { hello };
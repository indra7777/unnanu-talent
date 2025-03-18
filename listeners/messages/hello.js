const hello = async ({ context, say,body,client }) => {
    try {
      console.log(body);
   
      const greeting = context.matches[0];
      await say(`${greeting}, how are you?`);
    } catch (error) {
      console.error(error);
    }
  };
  
module.exports = { hello };
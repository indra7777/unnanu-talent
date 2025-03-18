
const axios = require('axios');

const residency_location_input = async ({ack, body}) => {
  console.log("residency_location_input body : ",body);
    const userInput = body.view.state.values.residency_location_block.residency_location_input.value;
    const apiKey = process.env.GOOGLE_API_KEY;
  
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
        params: {
          input: userInput,
          types: 'locality',
          key: apiKey,
          language: 'en-US'
        }
      });
      console.log("google places response data : ",response.data);
  
      const predictions = response.data.predictions;
      const options = predictions.map(prediction => ({
        text: {
          type: 'plain_text',
          text: prediction.description
        },
        value: prediction.place_id
      }));
  
      await ack({ options });
    } catch (error) {
      console.error(error);
      await ack({ options: [] });
    }
  };

  module.exports = {residency_location_input}
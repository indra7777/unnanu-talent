const { hello } = require('./hello');

module.exports.register = (app) => {
  app.message(/^(hi|hello|hey).*/, hello);
};
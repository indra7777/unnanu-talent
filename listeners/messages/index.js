const { hello } = require('./hello');

module.exports.register = (app) => {
  app.message(/^(hi|hey).*/, hello);
};
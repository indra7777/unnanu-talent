const { jobsForYou } = require('./sample-command');

module.exports.register = (app) => {
  app.command('/jobs', jobsForYou);
};
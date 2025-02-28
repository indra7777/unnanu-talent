const { jobsForYou } = require('./sample-command');
const {jobs} = require('./jobs');

module.exports.register = (app) => {
  app.command('/jobs', jobs);
  app.command('/jobs-x', jobs);
  app.command('/jobs-google', jobs);
  app.command('/jobs-indeed', jobs);
  app.command('/jobs-linkedin', jobs);
  app.command('/jobs-ziprecruiter', jobs);
  app.command('/jobs-unnanu', jobs);
  app.command('/jobs-glassdoor', jobs);
};
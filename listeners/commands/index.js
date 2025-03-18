const { jobsForYou } = require('./sample-command');
const {jobs} = require('./jobs');
const {upload_resume} = require('./upload_resume');
const {edit_profile} = require('./edit_profile');
const {get_profile} = require('./get_profile');
const {help} = require('./help')
module.exports.register = (app) => {
  // app.command('/jobs', jobs);
  // app.command('/jobs-x', jobs);
  // app.command('/jobs-google', jobs);
  // app.command('/jobs-indeed', jobs);
  // app.command('/jobs-linkedin', jobs);
  // app.command('/jobs-ziprecruiter', jobs);
  app.command('/jobs-unnanu', jobs);
  // app.command('/jobs-glassdoor', jobs);
  app.command('/upload-resume', upload_resume);
  app.command('/edit-profile', edit_profile);
  app.command('/get-profile', get_profile);
  app.command('/help',help);

  
};
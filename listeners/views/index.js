
const {upload_resume_form} = require('./upload_resume_form');
const {upload_profile} = require('./upload_profile')

module.exports.register = (app) => {
    app.view('upload_resume_form', upload_resume_form);
    app.view('upload_profile_form', upload_profile);
  };
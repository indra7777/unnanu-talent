
const {upload_resume_form} = require('./upload_resume_form');
const {upload_profile} = require('./upload_profile')
const {resume} = require('./resume')
module.exports.register = (app) => {
    app.view('upload_resume_form', resume);
    app.view('upload_profile_form', upload_profile);
  };
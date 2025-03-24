
const {upload_resume_form} = require('./upload_resume_form');
const {upload_profile} = require('./upload_profile')
const {resume} = require('./resume')
const {upload_skills} = require('./upload_skills')
module.exports.register = (app) => {
    app.view('upload_resume_form', resume);
    app.view('upload_profile_form', upload_profile);
    app.view('upload_skills', upload_skills);
  };
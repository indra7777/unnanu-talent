const {saved_jobs} = require ("./saved_jobs");
const {apply_jobs} = require ("./apply_job");
const {activate_account} = require ("./activate_account");

module.exports.register = (app) => {
  app.action('/save_job_(.*)', saved_jobs);
  app.action('/apply_job_(.*)', apply_jobs);
  app.action('/activate_account', activate_account);
};
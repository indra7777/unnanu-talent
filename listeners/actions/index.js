import saved_jobs from "./saved_jobs";
import apply_jobs from "./apply_jobs";

module.exports.register = (app) => {
  app.action('/save_job_(.*)', saved_jobs);
  app.action('/apply_job_(.*)', apply_jobs);
};
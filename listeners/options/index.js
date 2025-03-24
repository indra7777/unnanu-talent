const {pref_work_title} = require('./pref_work_title');
const {skills_auto} = require('./skills_auto');

module.exports.register = (app) => {
    app.options('preferred_work_title_input',pref_work_title );
    app.options('alternate_work_title_input',pref_work_title );
    app.options('other_work_title_input',pref_work_title );
    app.options('skill_input',skills_auto );
};
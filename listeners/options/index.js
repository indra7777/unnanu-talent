const {pref_work_title} = require('./pref_work_title');

module.exports.register = (app) => {
    app.options('preferred_work_title_input',pref_work_title );
    app.options('alternate_work_title_input',pref_work_title );
    app.options('other_work_title_input',pref_work_title );
};
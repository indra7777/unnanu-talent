const commands = require('./commands');
const messages = require('./messages');
const views = require('./views');
const actions = require('./actions');
const options = require('./options');
const events = require('./events');

module.exports.registerListeners = (app) => {
    commands.register(app);
    messages.register(app);
    views.register(app);
    actions.register(app);
    options.register(app);
    events.register(app);
}
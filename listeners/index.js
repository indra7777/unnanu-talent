const commands = require('./commands');
const messages = require('./messages');

module.exports.registerListeners = (app) => {
    commands.register(app);
    messages.register(app);
}
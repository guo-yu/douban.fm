var Fm = require('./fm'),
    commands = require('./commands');

exports = module.exports = function() {
    var command = process.argv[2],
        fm = new Fm();
    if (!command) return fm.init(commands.ready);
    if (!commands[command] || command === 'ready') return commands.help();
    return commands[command](fm, process.argv);
};

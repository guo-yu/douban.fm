var Fm = require('./fm');
var commands = require('./commands');

/**
*
* Command line interface main function
* @douban.fm ready
* @douban.fm config
* @douban.fm id3
* @douban.fm home
* @douban.fm help
*
**/
module.exports = function() {
  var fm = new Fm();
  var command = process.argv[2];
  if (!command) return fm.init(commands.ready);
  if (!commands[command] || command === 'ready') return commands.help();
  return commands[command](fm, process.argv);
}
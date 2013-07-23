/**
 *
 * douban.fm
 * @author: [turingou]
 * @created: [2013/07/20]
 *
 **/

var pkg = require('./pkg').fetch(),
    optimist = require('optimist'),
    argv = optimist.argv,
    color = require('colorful'),
    List = require('term-list'),
    player = require('player'),
    api = require('./api'),
    _ = require('underscore');

// 修改设置
exports.config = function(type, params) {
    var p = pkg;
    p[type] = params;
    require('./pkg').set(p);
    return p;
}

// cli interface
exports.cli = function() {

    console.log(argv);
    var argument = argv._;

    var list = new List({
        marker: '\033[36m› \033[0m',
        markerLength: 2
    });

    api.get('http://www.douban.com/j/app/radio/channels',null,function(chns){
        if (chns.channels && chns.channels.length) {

            _.each(chns.channels,function(item) {
                list.add(item.channel_id, item.name);
            });

            list.start();

            list.on('keypress', function(key, item) {
                switch (key.name) {
                    case 'return':
                        exec('open ' + item);
                        list.stop();
                        console.log('opening %s', item);
                        break;
                    case 'backspace':
                        list.remove(list.selected);
                        break;
                }
            });

            list.on('empty', function() {
                list.stop();
            });
        }
    });

}
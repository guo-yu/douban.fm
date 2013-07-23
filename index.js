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
    color = require('colorful');

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
    
}
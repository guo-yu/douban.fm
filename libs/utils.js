var exeq = require('exeq'),
    open = process.platform === 'win32' ? 'start' : 'open';

// 获取用户的家地址
exports.home = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// 跳转到相应页面，使用 open 或者 start
exports.go = function(link) {
    if (!link) return false;
    return exeq([ open + ' ' + link ]).run();
}

// 解析歌曲专辑页面可能出现的小站链接
exports.album = function(link) {
    if (!link) return false;
    return link.indexOf('http') === -1 ? 'http://music.douban.com' + link : link;
}

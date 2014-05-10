var fs = require('fsplus');
var open = require('open');

// 获取用户的家地址
exports.home = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// 跳转到相应页面，使用 open 或者 start
exports.go = function(link) {
  if (!link) return false;
  return open(link);
}

// 解析歌曲专辑页面可能出现的小站链接
exports.album = function(link) {
  if (!link) return false;
  return link.indexOf('http') === -1 ? 'http://music.douban.com' + link : link;
}

// 解析本地文件的sid
exports.sid = function(filename) {
  if (!filename) return false;
  var idstr = filename.substr(filename.indexOf('p') + 1, filename.lastIndexOf('.') - 1);
  if (idstr.indexOf('_') === -1) return idstr;
  return idstr.substr(0, idstr.lastIndexOf('_'))
}

// read json if err return blank object
exports.readJSON = function(file) {
  try {
    return fs.readJSON(file);
  } catch (err) {
    return {};
  }
}

exports.isFunction = function(func) {
  return func && typeof(func) === 'function';
}
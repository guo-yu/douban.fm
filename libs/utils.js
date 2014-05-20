var fs = require('fsplus');
var open = require('open');

// Return User' home path.
exports.home = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// Go to some uri.
exports.go = function(link) {
  if (!link) return false;
  return open(link);
}

// Escape a douban site uri from normal uri.
exports.album = function(link) {
  if (!link) return false;
  return link.indexOf('http') === -1 ? 'http://music.douban.com' + link : link;
}

// Split Sid from a song's title
exports.sid = function(filename) {
  if (!filename) return false;
  var idstr = filename.substr(filename.indexOf('p') + 1, filename.lastIndexOf('.') - 1);
  if (idstr.indexOf('_') === -1) return idstr;
  return idstr.substr(0, idstr.lastIndexOf('_'))
}

// Read JSON file 
// if Error return blank object
exports.readJSON = function(file) {
  try {
    return fs.readJSON(file);
  } catch (err) {
    return {};
  }
}

// Check if a object is Function Type.
exports.isFunction = function(func) {
  return func && typeof(func) === 'function';
}

// Check if a Error is a NoSuchFile Error
exports.noSuchFile = function(msg) {
  return msg && msg.indexOf('no such file or directory') > -1;
}
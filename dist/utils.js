'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

// Escape a douban site uri from normal URI
exports.album = album;

// Split Sid from a song's title
exports.sid = sid;

// Read JSON file, if Error return blank object
exports.readJSON = readJSON;

// Check if a object is Function Type
exports.isFunction = isFunction;

// Check if a Error is a NoSuchFile Error
exports.noSuchFile = noSuchFile;

var _fs = require('fsplus');

var _fs2 = _interopRequireWildcard(_fs);

function album(link) {
  if (!link) {
    return;
  }return link.indexOf('http') === -1 ? 'http://music.douban.com' + link : link;
}

function sid(filename) {
  if (!filename) {
    return;
  }var idstr = filename.substr(filename.indexOf('p') + 1, filename.lastIndexOf('.') - 1);

  if (idstr.indexOf('_') === -1) {
    return idstr;
  }return idstr.substr(0, idstr.lastIndexOf('_'));
}

function readJSON(file) {
  try {
    return _fs2['default'].readJSON(file);
  } catch (err) {
    return {};
  }
}

function isFunction(func) {
  return func && typeof func === 'function';
}

function noSuchFile(msg) {
  return msg && msg.indexOf('no such file or directory') > -1;
}
//# sourceMappingURL=utils.js.map
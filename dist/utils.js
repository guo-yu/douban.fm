'use strict';

var fs = require('fsplus');

exports.sid = sid;
exports.album = album;
exports.readJSON = readJSON;
exports.isFunction = isFunction;
exports.noSuchFile = noSuchFile;

/**
 * [Escape a douban site uri from normal uri.]
 * @param  {[type]} link [description]
 * @return {[type]}      [description]
 */
function album(link) {
  if (!link) {
    return false;
  }var str = link.indexOf('http') === -1 ? 'http://music.douban.com' + link : link;

  return str;
}

/**
 * [Split Sid from a song's title]
 * @param  {[type]} filename [description]
 * @return {[type]}          [description]
 */
function sid(filename) {
  if (!filename) {
    return false;
  }var idstr = filename.substr(filename.indexOf('p') + 1, filename.lastIndexOf('.') - 1);

  if (idstr.indexOf('_') === -1) {
    return idstr;
  }return idstr.substr(0, idstr.lastIndexOf('_'));
}

/**
 * [Read JSON file, if Error return blank object]
 * @param  {[type]} file [description]
 * @return {[type]}      [description]
 */
function readJSON(file) {
  try {
    return fs.readJSON(file);
  } catch (err) {
    return {};
  }
}

/**
 * [Check if a object is Function Type]
 * @param  {[type]}  func [description]
 * @return {Boolean}      [description]
 */
function isFunction(func) {
  return func && typeof func === 'function';
}

/**
 * [Check if a Error is a NoSuchFile Error]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
function noSuchFile(msg) {
  return msg && msg.indexOf('no such file or directory') > -1;
}
//# sourceMappingURL=utils.js.map
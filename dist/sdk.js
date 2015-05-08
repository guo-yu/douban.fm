'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.fm = fm;
exports.fetchSongs = fetchSongs;
exports.addToLove = addToLove;
exports.listLocalSongs = listLocalSongs;

var _path = require('path');

var _path2 = _interopRequireWildcard(_path);

var _fs = require('fsplus');

var _fs2 = _interopRequireWildcard(_fs);

var _douban = require('douban-sdk');

var _douban2 = _interopRequireWildcard(_douban);

var _utils = require('./utils');

var _utils2 = _interopRequireWildcard(_utils);

var _errors = require('./errors');

var _errors2 = _interopRequireWildcard(_errors);

var mhz = {
  localMhz: {
    seq_id: -99,
    abbr_en: 'localMhz',
    name: '本地电台',
    channel_id: -99,
    name_en: 'localMhz'
  },
  privateMhz: {
    seq_id: -3,
    abbr_en: '',
    name: '红心兆赫',
    channel_id: -3,
    name_en: '' } };

exports.mhz = mhz;

function fm() {
  return new _douban2['default']().fm;
}

function fetchSongs(params, callback) {
  var local = params && params.local && params.history;

  if (local) {
    return listLocalSongs(params.local, params.history, callback);
  }if (params.history) delete params.history;

  var query = {
    qs: params
  };

  return _douban2['default'].fm.songs(query, callback);
}

function addToLove(params, callback) {
  params.type = 'r';
  return fetchSongs(params, callback);
}

function listLocalSongs(dir, history, callback) {
  _fs2['default'].readdir(dir, readLocalDir);

  function readLocalDir(err, songs) {
    if (err) {
      return callback(err);
    }if (!songs) {
      return callback(new Error(_errors2['default'].localsongs_notfound));
    }var list = [];

    _fs2['default'].readJSON(history, function (err, history) {
      if (err) return callback(new Error(_errors2['default'].localsongs_notfound));

      songs.forEach(function (song) {
        if (song.lastIndexOf('.mp3') !== song.length - 4) return;

        var s = history[_utils2['default'].sid(song)] || {};
        s.url = _path2['default'].resolve(dir, song);

        list.push(s);
      });

      if (list.length === 0) return callback(new Error(_errors2['default'].localsongs_notfound));

      list.sort(function (a, b) {
        return Math.random() - 0.5;
      });

      return callback(null, list);
    });
  }
}
//# sourceMappingURL=sdk.js.map
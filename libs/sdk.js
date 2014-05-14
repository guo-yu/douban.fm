var fs = require('fsplus');
var path = require('path');
var Douban = require('douban-sdk');
var douban = new Douban();
var utils = require('./utils');

<<<<<<< HEAD
exports.songs = function(params, callback) {
=======
// 本地电台信息
exports.mhz = {
  localMhz: {
    seq_id: -99,
    abbr_en: 'localMhz',
    name: '本地电台',
    channel_id: -99,
    name_en: 'localMhz'
  },
  privateMhz: {
    seq_id: -3,
    abbr_en: "",
    name: "红心兆赫",
    channel_id: -3,
    name_en: ""
  }
}

// 模拟登录
exports.auth = function(account, callback) {
  api.post('http://www.douban.com/j/app/login', {
    form: {
      app_name: 'radio_desktop_win',
      version: 100,
      email: account.email.toString(),
      password: account.password.toString()
    },
    headers: {'User-Agent': 'douban.fm'}
  }, function(err, result) {
    if (err) return callback(err);
    var result = result.body;
    if (result.r == 0) return callback(null, result);
    return callback(errors[result.err]);
  });
};

// 获取频道曲目
exports.fetch = function(params, callback) {
>>>>>>> FETCH_HEAD
  var local = params && params.local && params.history;
  if (local) return exports.local(params.local, params.history, callback);
  if (params.history) delete params.history;
  var query = {};
  query.qs = params;
  return douban.fm.songs(query, callback);
}

exports.love = function(params, callback) {
  params.type = 'r';
  return exports.songs(params, callback);
}

exports.local = function(dir, history, callback) {
  fs.readdir(dir, function(err, songs) {
    if (err) return callback(err);
    if (!songs) return callback(new Error('没有找到本地音乐'));
    var list = [];
    fs.readJSON(history, function(err, history) {
      if (err) return callback(new Error('没有找到本地音乐'));
      songs.forEach(function(song) {
        if (song.lastIndexOf('.mp3') !== (song.length - 4)) return false;
        // if (!history[utils.sid(song)]) return false;
        var s = history[utils.sid(song)] || {};
        s.url = path.resolve(dir, song);
        list.push(s);
      });
      if (list.length === 0) return callback(new Error('没有找到本地音乐'));
      list.sort(function(a, b) {
        return Math.random() - 0.5;
      });
      return callback(null, list);
    });
  });
}

exports.mhz = {
  localMhz: {
    seq_id: -99,
    abbr_en: 'localMhz',
    name: '本地电台',
    channel_id: -99,
    name_en: 'localMhz'
  },
  privateMhz: {
    seq_id: -3,
    abbr_en: "",
    name: "红心兆赫",
    channel_id: -3,
    name_en: ""
  }
}

<<<<<<< HEAD
exports.fm = douban.fm;
=======
// 获取歌词
exports.lrc = function(title, artist, callback) {
  api.get('http://geci.me/api/lyric/' + title + '/' + artist, {}, function(err, result) {
    if (err) return callback(err);
    var songs = result.body;
    if (songs.count <= 0) return callback(songs.err);
    if (!songs.result) return callback(new Error('lrc not found'))
    if (!songs.result[0]) return callback(new Error('lrc not found'))
    if (!songs.result[0].lrc) return callback(new Error('lrc not found'))
    api.get(songs.result[0].lrc, {}, function(err, result) {
      if (err) return callback(err);
      return callback(null, result.body);
    });
  });
};
>>>>>>> FETCH_HEAD

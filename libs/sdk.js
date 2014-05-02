var fs = require('fsplus');
var path = require('path');
var _ = require('underscore');
var Douban = require('douban-sdk');
var utils = require('./utils');
var douban = new Douban();

exports.fetch = function(params, callback) {
  var local = params && params.local && params.history;
  if (local) return exports.local(params.local, params.history, callback);
  if (params.history) delete params.history;
  douban.fm.songs({
    qs: params
  }, callback);
}

exports.love = function(params, callback) {
  exports.fetch(_.extend({
    type: 'r'
  }, params), callback);
}

exports.local = function(dir, history, callback) {
  return fs.readdir(dir, function(err, songs) {
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

exports.fm = douban.fm;
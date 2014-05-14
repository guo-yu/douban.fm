var fs = require('fsplus');
var path = require('path');
var async = require('async');
var prompt = require('prompt');
var consoler = require('consoler');
var ffmetadata = require("ffmetadata");
var Fm = require('./fm');
var sdk = require('./sdk');
var utils = require('./utils');

var promptSchema = {
  properties: {
    email: {
      description: 'Douban Email',
      type: 'string',
      pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: '电子邮箱格式有错误',
      required: true
    },
    password: {
      description: 'Douban Password',
      hidden: true,
      required: true
    }
  }
}

/**
 *
 * Auth and save user's accounts infomation and token
 * @params [Object] the account object
 * @fm [Object] the fm object
 *
 **/
exports.config = function(fm) {
  prompt.start();
  prompt.get(promptSchema, function(err, result) {
    if (err) return consoler.error(err);
    sdk.fm.auth({
      form: result
    }, function(err, account) {
      if (err) return consoler.error(err);
      var configs = {};
      configs.account = account;
      try {
        fs.updateJSON(fm.rc.profile, configs);
        consoler.success('欢迎，' + account.user_name + '。您的豆瓣账户已经成功修改为：' + account.email);
        fm.init(exports.ready);
      } catch (err) {
        return consoler.error(err);
      }
    });
  });
}

exports.home = function(fm, argv) {
  try {
    var home = argv[3] || process.cwd();
    fs.updateJSON(fm.rc.profile, {
      home: home
    });
    consoler.success('下载目录已成功修改为 ' + home);
    var f = new Fm;
    return f.init(exports.ready);
  } catch (err) {
    return consoler.error(err);
  }
}

exports.id3 = function(fm, argv) {
  consoler.loading('正在从 ' + fm.home + ' 读取音乐列表');
  sdk.local(fm.home, fm.rc.history, function(err, list) {
    if (err) return consoler.error(err);
    var songs = list.filter(function(song) {
      var keys = Object.keys(song);
      if (keys.length === 1 && keys[0] === 'url') return false;
      return true;
    });
    if (songs.length === 0) return consoler.error('没有歌曲符合条件');
    consoler.success('找到 ' + songs.length + ' 首有效歌曲，正在添加 id3 信息');
    async.eachLimit(songs, 20, addid3, function(err) {
      if (err) return consoler.error(err);
      return consoler.success('添加歌曲 id3 信息完成');
    });
  });

  function addid3(song, callback) {
    if (!song.url) return callback(null);
    var id3 = {};
    id3.artist = song.artist;
    id3.title = song.title;
    id3.album = song.albumtitle;
    id3.date = song.public_time;
    id3.year = song.public_time;
    id3.publisher = song.company;
    ffmetadata.write(song.url, id3, function(err) {
      if (!err) consoler.success('√ ' + id3.title);
      if (err) consoler.error('X ' + id3.title);
      callback(null);
    });
  }

}

exports.help = function() {
  console.log('');
  consoler.info('豆瓣电台命令行版帮助文档');
  return console.log([
    "",
    "更新豆瓣电台命令行版：",
    "$ [sudo] npm install douban.fm -g",
    "",
    "配置豆瓣账户密码：",
    "$ douban.fm config",
    "",
    "菜单快捷键：",
    "[return]      ->     播放另一个频道，或者重新播放当前频道 (PLAY)",
    "[backspace]   ->     停止播放当前歌曲或频道 (DELETE)",
    "[n]           ->     本频道列表的下一首歌曲 (NEXT)",
    "[l]           ->     添加到红心列表或者删除红心 (LOVE)",
    "[s]           ->     分享当前歌曲到新浪微博 (SHARE)",
    "[r]           ->     开启或关闭歌词，默认关闭歌词显示 (LRC)",
    "[g]           ->     跳转到当前播放歌曲的专辑页面 (GOTO)",
    "[r]           ->     切换歌词显示 (LRC)",
    "[q]           ->     退出豆瓣电台 (QUIT)",
    ""
  ].join('\n'));
}

exports.ready = function() {
  return consoler.loading('正在加载...');
}
var fs = require('fsplus');
var path = require('path');
var async = require('async');
var inquirer = require("inquirer");
var consoler = require('consoler');
var ffmetadata = require("ffmetadata");
var Fm = require('./fm');
var sdk = require('./sdk');
var utils = require('./utils');

var questions = [{
    type: "input",
    name: "email",
    message: "豆瓣账户 (Email 地址)",
    validate: function(value) {
      var EmailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var pass = value.match(EmailRegex);
      if (pass) {
        return true;
      } else {
        return "请输入有效的 Email 地址";
      }
    }
  },{
    type: "password",
    name: "password",
    message: "豆瓣密码 (不会保留密码) ",
    validate: function(value) {
      if (value && value.length > 0) return true;
      return "请输入有效密码";
    }
  }
];

/**
 *
 * Auth and save user's accounts infomation and token
 * @params [Object] the account object
 * @fm [Object] the fm object
 *
 **/
exports.config = function(fm) {
  inquirer.prompt(questions, function(result) {
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
    "[q]           ->     退出豆瓣电台 (QUIT)",
    ""
  ].join('\n'));
}

exports.ready = function() {
  return consoler.loading('正在加载...');
}
var fs = require('fsplus');
var path = require('path');
var async = require('async');
var inquirer = require("inquirer");
var consoler = require('consoler');
var ffmetadata = require("ffmetadata");
var Fm = require('./fm');
var sdk = require('./sdk');
var utils = require('./utils');

/**
 *
 * Menu lists
 *
 **/
var menu = {
  main: [{
    type: "list",
    name: "type",
    message: "请选择需要更改的配置项: ",
    choices: [{
      value: "account",
      name: '配置豆瓣电台账户密码 / Update douban.fm account'
    }, {
      value: 'download',
      name: '更新下载文件夹路径 / Update download directory path'
    }, {
      value: 'id3',
      name: '更新本地曲库歌曲ID3 / Update ID3 for local songs'
    }, {
      value: 'help',
      name: '查看帮助文档 / Help'
    }, {
      value: 'quit',
      name: '退出配置向导 / Quit'
    }]
  }],
  account: [{
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
  }, {
    type: "password",
    name: "password",
    message: "豆瓣密码 (不会保留密码) ",
    validate: function(value) {
      if (value && value.length > 0) return true;
      return "请输入有效密码";
    }
  }],
  download: {
    main: function(dir) {
      return [{
        type: "confirm",
        name: "useWorkingPath",
        message: "将下载目录设置为当前目录 " + dir + "?",
        default: true
      }]
    },
    setting: [{
      type: "input",
      name: "download",
      message: "请输入一个有效的绝对路径作为新的曲库目录"
    }]
  }
}

/**
 *
 * Config UI
 *
 **/
exports.config = function(fm, argv) {
  inquirer.prompt(menu.main, function(result) {
    if (!exports[result.type]) return exports.help();
    exports[result.type](fm, argv);
  });
}

/**
 *
 * Auth and save user's accounts infomation and token
 * @params [Object] the account object
 * @fm [Object] the fm object
 *
 **/
exports.account = function(fm) {
  inquirer.prompt(menu.account, function(result) {
    sdk.fm.auth({
      form: result
    }, function(err, account) {
      if (err) return consoler.error(err);
      var configs = {};
      configs.account = account;
      try {
        fs.updateJSON(fm.rc.profile, configs);
      } catch (err) {
        if (!utils.noSuchFile(err.message)) return consoler.error(err);
        fs.writeJSON(fm.rc.profile, configs);
      }
      return ready(account);
    });
  });

  function ready(account) {
    consoler.success(
      '欢迎，' +
      account.user_name +
      '。您的豆瓣账户已经成功修改为：' +
      account.email
    );
    fm.init(exports.ready);
  }
}

/**
 *
 * Update download directory path
 *
 **/
exports.download = function(fm, argv) {
  var workingPath = process.cwd();
  var profile = {};
  inquirer.prompt(menu.download.main(workingPath), function(result) {
    if (!result.useWorkingPath) return inputNewPath();
    profile.home = workingPath;
    return updatePath(profile);
  });

  function inputNewPath() {
    inquirer.prompt(menu.download.setting, function(dir) {
      if (!fs.existsSync(dir.download)) {
        console.log(dir.download + ' 这个目录好像并不存在，请输入一个有效的路径');
        return inputNewPath();
      }
      profile.home = dir.download;
      return updatePath(profile);
    });
  }

  function updatePath(profile) {
    try {
      fs.updateJSON(fm.rc.profile, profile);
    } catch (err) {
      if (!utils.noSuchFile(err.message)) return consoler.error(err);
      fs.writeJSON(fm.rc.profile, profile);
    }
    consoler.success('下载目录已成功修改为 ' + profile.home);
    var f = new Fm;
    return f.init(exports.ready);
  }

}

/**
 *
 * Update ID3 for local songs
 *
 **/
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
    "更新或安装豆瓣电台命令行版：",
    "$ [sudo] npm install douban.fm -g",
    "",
    "豆瓣电台设置：",
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

exports.quit = function() {
  return process.exit();
}

exports.ready = function() {
  return consoler.loading('正在加载...');
}
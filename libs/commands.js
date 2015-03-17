var fs = require('fsplus');
var path = require('path');
var async = require('async');
var inquirer = require("inquirer");
var consoler = require('consoler');
var ffmetadata = require("ffmetadata");

require('colorful').toxic();

var Fm = require('./fm');
var sdk = require('./sdk');
var utils = require('./utils');
var menu = require('./menu');

exports.id3 = id3;
exports.help = help;
exports.quit = quit;
exports.ready = ready;
exports.config = config;
exports.account = account;
exports.download = download;
exports.http_proxy = http_proxy;

/**
 * [Show configs UI]
 * @param  {Object} fm   [a douban.fm instance]
 * @param  {Array}  argv [command line arguments]
 */
function config(fm, argv) {
  inquirer.prompt(menu.main, function(result) {
    if (!exports[result.type]) 
      return exports.help();

    exports[result.type](fm, argv);
  });
}

/**
 * [Auth and save user's account infomation and token]
 * @param  {Object} fm [a douban.fm instance]
 */
function account(fm) {
  inquirer.prompt(menu.account, function(result) {
    sdk.fm.auth({
      form: result
    }, function(err, account) {
      if (err) 
        return consoler.error(err);

      var configs = {};
      configs.account = account;

      try {
        fs.updateJSON(fm.path.profile, configs);
      } catch (err) {
        if (!utils.noSuchFile(err.message)) 
          return consoler.error(err);

        fs.writeJSON(fm.path.profile, configs);
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
 * [Update download directory path]
 * @param  {Object} fm   [a douban.fm instance]
 * @param  {Array}  argv [command line arguments]
 */
function download(fm, argv) {
  var workingPath = process.cwd();
  var profile = {};

  inquirer.prompt(menu.download.main(workingPath), function(result) {
    if (!result.useWorkingPath) 
      return inputNewPath();

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
      fs.updateJSON(fm.path.profile, profile);
    } catch (err) {
      if (!utils.noSuchFile(err.message)) 
        return consoler.error(err);

      fs.writeJSON(fm.path.profile, profile);
    }

    consoler.success('下载目录已成功修改为 ' + profile.home);

    var f = new Fm;
    return f.init(exports.ready);
  }
}

/**
 * [Update ID3 tags for local songs]
 * @param  {Object} fm   [a douban.fm instance]
 * @param  {Array}  argv [command line arguments]
 */
function id3(fm, argv) {
  consoler.loading('正在从 ' + fm.home + ' 读取音乐列表');

  sdk.local(fm.home, fm.path.history, function(err, list) {
    if (err) 
      return consoler.error(err);

    var songs = list.filter(function(song) {
      var keys = Object.keys(song);
      if (keys.length === 1 && keys[0] === 'url') return false;
      return true;
    });

    if (songs.length === 0) 
      return consoler.error('没有歌曲符合条件');

    consoler.success('找到 ' + songs.length + ' 首有效歌曲，正在添加 id3 信息');

    async.eachLimit(songs, 20, addid3, function(err) {
      if (err) 
        return consoler.error(err);

      return consoler.success('添加歌曲 id3 信息完成');
    });
  });

  /**
   * [Add ID3 to single song]
   * @param  {Object}   song     
   * @param  {Function} callback
   */
  function addid3(song, callback) {
    if (!song.url) 
      return callback(null);

    var id3 = {};
    id3.artist = song.artist;
    id3.title = song.title;
    id3.album = song.albumtitle;
    id3.date = song.public_time;
    id3.year = song.public_time;
    id3.publisher = song.company;

    ffmetadata.write(song.url, id3, function(err) {
      if (!err) 
        consoler.success('√ ' + id3.title);

      if (err) 
        consoler.error('X ' + id3.title);

      callback(null);
    });
  }
}

/**
 * [http_proxy]
 * @param  {[type]} fm   [description]
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
function http_proxy(fm, argv) {
  var profile = {};
  var defaultProxy = process.env.HTTP_PROXY || process.env.http_proxy || null;

  inquirer.prompt(menu.http_proxy.main(defaultProxy), function(result) {
    if (!result.useDefaultProxy)
      return inputNewProxy();

    if (defaultProxy === null || validate(defaultProxy)) {
      profile.http_proxy = defaultProxy;
      return updateProxy(profile);
    }

    console.log(defaultProxy + '格式不符合规范，请输入有效的HTTP_PROXY');

    return inputNewProxy();
  });

  function validate(value) {
    var proxyReg = /http:\/\/((?:\d{1,3}\.){3}\d{1,3}):(\d+)/;
    return proxyReg.test(value);
  }

  function inputNewProxy() {
    inquirer.prompt(menu.http_proxy.setting, function(result) {
      if (!validate(result.http_proxy)) {
        console.log(result.http_proxy + '格式不符合规范，请输入有效的HTTP PROXY');
        return inputNewProxy();
      }

      profile.http_proxy = result.http_proxy;

      return updateProxy(profile);
    });
  }

  function updateProxy(profile) {
    try {
      fs.updateJSON(fm.path.profile, profile);
    } catch (err) {
      if (!utils.noSuchFile(err.message)) return consoler.error(err);
      fs.writeJSON(fm.path.profile, profile);
    }

    consoler.success('HTTP PROXY已经成功修改为 ' + profile.http_proxy);

    var f = new Fm;
    return f.init(exports.ready);
  }
}

/**
 * [Show help messages]
 * @return {String} [a help manual]
 */
function help() {
  console.log([
    '',
    '安装/更新豆瓣电台命令行版：'.yellow,
    '$ [sudo] npm install douban.fm -g',
    '',
    '豆瓣电台设置：'.green,
    '$ douban.fm config',
    '',
    '菜单快捷键：'.yellow,
    '[   Return  ]  播放另一个频道，或者重新播放当前频道 (PLAY)',
    '[ Backspace ]  停止播放当前歌曲或频道 (DELETE)',
    '[     N     ]  本频道列表的下一首歌曲 (NEXT)',
    '[     L     ]  添加到红心列表或者删除红心 (LOVE)',
    '[     S     ]  分享当前歌曲到新浪微博 (SHARE)',
    '[     R     ]  开启或关闭歌词，默认关闭歌词显示 (LRC)',
    '[     G     ]  跳转到当前播放歌曲的专辑页面 (GOTO)',
    '[     Q     ]  退出豆瓣电台 (QUIT)',
    ""
  ].join('\n   '));
}

function quit() {
  return process.exit();
}

function ready() {
  return consoler.loading('正在加载...');
}

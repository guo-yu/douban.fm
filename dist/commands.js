'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

/**
 * [Show configs UI]
 * @param  {Object} fm   [a douban.fm instance]
 * @param  {Array}  argv [command line arguments]
 */
exports.config = config;

/**
 * [Auth and save user's account infomation and token]
 * @param  {Object} fm [a douban.fm instance]
 */
exports.account = account;

/**
 * [Update download directory path]
 * @param  {Object} fm   [a douban.fm instance]
 * @param  {Array}  argv [command line arguments]
 */
exports.download = download;

/**
 * [Update ID3 tags for local songs]
 * @param  {Object} fm   [a douban.fm instance]
 * @param  {Array}  argv [command line arguments]
 */
exports.id3 = id3;

/**
 * [http_proxy]
 * @param  {[type]} fm   [description]
 * @param  {[type]} argv [description]
 * @return {[type]}      [description]
 */
exports.http_proxy = http_proxy;

/**
 * [Show help messages]
 * @return {String} [a help manual]
 */
exports.help = help;
exports.quit = quit;
exports.ready = ready;

var _fs = require('fsplus');

var _fs2 = _interopRequireWildcard(_fs);

var _path = require('path');

var _path2 = _interopRequireWildcard(_path);

var _async = require('async');

var _async2 = _interopRequireWildcard(_async);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireWildcard(_inquirer);

var _consoler = require('consoler');

var _consoler2 = _interopRequireWildcard(_consoler);

var _Fm = require('./fm');

var _Fm2 = _interopRequireWildcard(_Fm);

var _sdk = require('./sdk');

var _sdk2 = _interopRequireWildcard(_sdk);

var _utils = require('./utils');

var _utils2 = _interopRequireWildcard(_utils);

var _menu = require('./menu');

var _menu2 = _interopRequireWildcard(_menu);

function config(fm, argv) {
  _inquirer2['default'].prompt(_menu2['default'].main, function (result) {
    var exports = module.exports;

    if (!exports[result.type]) return exports.help();

    exports[result.type](fm, argv);
  });
}

function account(fm) {
  _inquirer2['default'].prompt(_menu2['default'].account, function (result) {
    var form = {
      form: result
    };

    _sdk2['default'].fm.auth(form, function (err, account) {
      if (err) return _consoler2['default'].error(err);

      var configs = {
        account: account
      };

      try {
        _fs2['default'].updateJSON(fm.path.profile, configs);
      } catch (err) {
        if (!_utils2['default'].noSuchFile(err.message)) return _consoler2['default'].error(err);

        _fs2['default'].writeJSON(fm.path.profile, configs);
      }

      return getReady(account);
    });
  });

  function getReady(account) {
    _consoler2['default'].success('欢迎，' + account.user_name + '。您的豆瓣账户已经成功修改为：' + account.email);

    fm.init(ready);
  }
}

function download(fm, argv) {
  var workingPath = process.cwd();
  var profile = {};

  _inquirer2['default'].prompt(_menu2['default'].download.main(workingPath), function (result) {
    if (!result.useWorkingPath) return inputNewPath();

    profile.home = workingPath;

    return updatePath(profile);
  });

  function inputNewPath() {
    _inquirer2['default'].prompt(_menu2['default'].download.setting, function (dir) {
      if (!_fs2['default'].existsSync(dir.download)) {
        console.log(dir.download + ' 这个目录好像并不存在，请输入一个有效的路径');
        return inputNewPath();
      }

      profile.home = dir.download;

      return updatePath(profile);
    });
  }

  function updatePath(profile) {
    try {
      _fs2['default'].updateJSON(fm.path.profile, profile);
    } catch (err) {
      if (!_utils2['default'].noSuchFile(err.message)) {
        return _consoler2['default'].error(err);
      }_fs2['default'].writeJSON(fm.path.profile, profile);
    }

    _consoler2['default'].success('下载目录已成功修改为 ' + profile.home);

    return new _Fm2['default']().init(exports.ready);
  }
}

function id3(fm, argv) {
  _consoler2['default'].loading('正在从 ' + fm.home + ' 读取音乐列表');

  _sdk2['default'].local(fm.home, fm.path.history, function (err, list) {
    if (err) return _consoler2['default'].error(err);

    var songs = list.filter(function (song) {
      var keys = Object.keys(song);
      if (keys.length === 1 && keys[0] === 'url') return false;
      return true;
    });

    if (songs.length === 0) return _consoler2['default'].error('没有歌曲符合条件');

    _consoler2['default'].success('找到 ' + songs.length + ' 首有效歌曲，正在添加 id3 信息');

    _async2['default'].eachLimit(songs, 20, addid3, function (err) {
      if (err) return _consoler2['default'].error(err);

      return _consoler2['default'].success('添加歌曲 id3 信息完成');
    });
  });

  /**
   * [Add ID3 to single song]
   * @param  {Object}   song     
   * @param  {Function} callback
   */
  function addid3(song, callback) {
    if (!song.url) {
      return callback(null);
    }var id3 = {};
    id3.artist = song.artist;
    id3.title = song.title;
    id3.album = song.albumtitle;
    id3.date = song.public_time;
    id3.year = song.public_time;
    id3.publisher = song.company;

    ffmetadata.write(song.url, id3, function (err) {
      if (!err) _consoler2['default'].success('√ ' + id3.title);

      if (err) _consoler2['default'].error('X ' + id3.title);

      callback(null);
    });
  }
}

function http_proxy(fm, argv) {
  var profile = {};
  var defaultProxy = process.env.HTTP_PROXY || process.env.http_proxy || null;

  _inquirer2['default'].prompt(_menu2['default'].http_proxy.main(defaultProxy), function (result) {
    if (!result.useDefaultProxy) return inputNewProxy();

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
    _inquirer2['default'].prompt(_menu2['default'].http_proxy.setting, function (result) {
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
      _fs2['default'].updateJSON(fm.path.profile, profile);
    } catch (err) {
      if (!_utils2['default'].noSuchFile(err.message)) {
        return _consoler2['default'].error(err);
      }_fs2['default'].writeJSON(fm.path.profile, profile);
    }

    _consoler2['default'].success('HTTP PROXY已经成功修改为 ' + profile.http_proxy);

    var f = new _Fm2['default']();
    return f.init(exports.ready);
  }
}

function help() {
  _consoler2['default'].log('\n    ' + '安装/更新豆瓣电台命令行版：'.yellow + '\n    $ [sudo] npm install douban.fm -g\n\n    ' + '豆瓣电台设置：'.green + '\n    $ douban.fm config\n\n    ' + '菜单快捷键：'.yellow + '\n    [   Return  ]  播放另一个频道，或者重新播放当前频道 (PLAY)\n    [ Backspace ]  停止播放当前歌曲或频道 (DELETE)\n    [     N     ]  本频道列表的下一首歌曲 (NEXT)\n    [     L     ]  添加到红心列表或者删除红心 (LOVE)\n    [     S     ]  分享当前歌曲到新浪微博 (SHARE)\n    [     R     ]  开启或关闭歌词，默认关闭歌词显示 (LRC)\n    [     G     ]  跳转到当前播放歌曲的专辑页面 (GOTO)\n    [     Q     ]  退出豆瓣电台 (QUIT)\n  ');
}

function quit() {
  return process.exit();
}

function ready() {
  return _consoler2['default'].loading('正在加载...');
}
//# sourceMappingURL=commands.js.map
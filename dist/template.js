'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.logo = logo;
exports.notify = notify;
exports.updateTab = updateTab;
exports.title = title;
exports.listing = listing;
exports.loading = loading;
exports.pause = pause;
exports.song = song;
exports.share = share;

var _sys = require('sys');

var _sys2 = _interopRequireWildcard(_sys);

var _color = require('colorful');

var _color2 = _interopRequireWildcard(_color);

var _exec = require('child_process');

var _Notifier = require('node-notifier');

var _Notifier2 = _interopRequireWildcard(_Notifier);

var _utils = require('./utils');

var _utils2 = _interopRequireWildcard(_utils);

var _pkg = require('../package');

var _pkg2 = _interopRequireWildcard(_pkg);

function logo(account) {
  return '' + _color2['default'].yellow('Douban FM') + ' ' + _color2['default'].grey('v' + _pkg2['default'].version) + ' ' + (account ? _color2['default'].grey('/ ' + account.user_name) : '');
}

function notify(song) {
  var notifier = new _Notifier2['default']()();
  notifier.notify({
    title: song.notifyTitle || 'Douban FM',
    open: song.open || _pkg2['default'].repository.url,
    message: song.text || _pkg2['default'].name + ' v' + _pkg2['default'].version });
}

function updateTab(str) {
  // @bug: 只有一个 tab 的时候这个 func 会导致 tab 页面闪动
  _exec.exec('printf "\\e]1;' + str + '\\a"', function (error, stdout, stderr) {
    _sys2['default'].puts(stdout);
  });
}

function title(str, selectedColor) {
  if (!str) {
    return false;
  }return _color2['default'][selectedColor || 'grey'](str);
}

function listing() {
  return title('加载列表中，请稍等...');
}

function loading() {
  return title('歌曲缓冲中，请稍等..');
}

function pause() {
  title('Douban FM');
  return _color2['default'].yellow('||');
}

function song(s, selectText, silence) {
  var label = '♫ ';
  var song = s.title ? s : {};
  if (!song.title) {
    song.text = label + '未知曲目...';
    if (!silence) this.notify(song);

    return _color2['default'].grey(song.text);
  }

  song.text = label + song.title + ' - ' + song.artist;
  song.open = _utils2['default'].album(song.album);

  if (!silence) this.notify(song);

  return [song.like == 1 ? _color2['default'].red('♥') : _color2['default'].grey('♥'), _color2['default'].green(song.title), _color2['default'].grey(song.kbps + 'kbps'), _color2['default'].grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'), selectText || _color2['default'].yellow(song.albumtitle), selectText ? '' : _color2['default'].grey('•'), selectText ? '' : song.artist, selectText ? '' : _color2['default'].grey(song.public_time)].join(' ');
}

function share(song) {
  var text = '我正用豆瓣电台命令行版 v' + _pkg2['default'].version + ' 收听' + (song.title ? '「' + song.title + '」' : '本地电台频道') + '' + (song.kbps ? song.kbps + 'kbps' : '') + '' + (song.albumtitle ? song.albumtitle + ' • ' : '') + '' + (song.artist || '') + '' + (song.public_time || '') + '' + (song.album ? _utils2['default'].album(song.album) : '');
  var uri = 'http://service.weibo.com/share/share.php?&type=button\'&appkey=3374718187&ralateUid=1644105187\'&url=\'' + _pkg2['default'].repository.url + '&pic=' + (song.picture ? song.picture.replace('mpic', 'lpic') : '') + '%7C%7Chttp://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg&title=' + encodeURIComponent(text);

  // Windows 下终端 `&` 需要转义
  if (process.platform === 'win32') uri = uri.replace(/&/g, '^&');

  return uri;
}
//# sourceMappingURL=template.js.map
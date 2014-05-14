var sys = require('sys');
var color = require('colorful');
var printf = require('sprintf').sprintf;
var exec = require('child_process').exec;
var notifier = new require('node-notifier')();
var utils = require('./utils');
var pkg = require('../package');

exports.logo = function(account) {
  return printf(
    '%s %s %s',
    color.yellow('Douban FM'),
    color.grey('v' + pkg.version),
    account ? color.grey('/ ' + account.user_name) : ''
  );
}

exports.notify = function(song) {
  notifier.notify({
    title: song.notifyTitle || 'Douban FM',
    open: song.open || pkg.repository.url,
    message: song.text || pkg.name + ' v' + pkg.version
  });
}

// BUG: 只有一个 tab 的时候这个 func 会导致 tab 页面闪动
exports.updateTab = function(str) {
  exec('printf "\\e]1;' + str + '\\a"',
    function(error, stdout, stderr) {
      sys.puts(stdout);
    }
  );
}

exports.title = function(str, c) {
  if (!str) return false;
  // this.updateTab(str);
  return color[c || 'grey'](str);
}

exports.listing = function() {
  return this.title('加载列表中，请稍等...')
}

exports.loading = function() {
  return this.title('歌曲缓冲中，请稍等..')
}

exports.pause = function() {
  this.title('Douban FM');
  return color.yellow('||');
}

exports.song = function(s, selectText, silence) {
  var label = '♫ ';
  var song = s.title ? s : {};
  if (!song.title) {
    song.text = label + '未知曲目...';
    if (!silence) this.notify(song);
    return color.grey(song.text);
  }
  song.text = label + song.title + ' - ' + song.artist;
  song.open = utils.album(song.album);
  if (!silence) this.notify(song);
  return printf(
    '%s %s %s %s %s %s %s %s',
    song.like == 1 ? color.red('♥') : color.grey('♥'),
    color.green(song.title),
    color.grey(song.kbps + 'kbps'),
    color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
    selectText || color.yellow(song.albumtitle),
    selectText ? '' : color.grey('•'),
    selectText ? '' : song.artist,
    selectText ? '' : color.grey(song.public_time)
  )
}

exports.share = function(song) {
  var shareText = 
    'http://service.weibo.com/share/share.php?' +
    '&type=button' +
    '&appkey=3374718187' +
    '&ralateUid=1644105187' +
    '&url=' +
    pkg.repository.url +
    '&pic=' +
    (song.picture ? song.picture.replace('mpic', 'lpic') : '') +
    '%7C%7C' +
    'http://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg' +
    '&title=' +
    encodeURIComponent([
      '我正用豆瓣电台命令行版 v' + pkg.version + ' 收听 ',
      song.title ? '「' + song.title + '」' : '本地电台频道',
      song.kbps ? song.kbps + 'kbps' : '',
      song.albumtitle ? song.albumtitle + ' • ' : '',
      song.artist || '',
      song.public_time || '',
      song.album ? utils.album(song.album) : ''
    ].join(' '));
  // windows 下终端 & 需要转义
  if (process.platform === 'win32') shareText = shareText.replace(/&/g, '^&');
  return shareText;
}
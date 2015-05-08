import sys from 'sys'
import color from 'colorful'
import { exec } from 'child_process'
import Notifier from 'node-notifier'
import utils from './utils'
import pkg from '../package'

export function logo(account) {
  return `${ color.yellow('Douban FM') } ${color.grey('v' + pkg.version)} ${account ? color.grey('/ ' + account.user_name) : ''}`
}

export function notify(song) {
  var notifier = (new Notifier())()
  notifier.notify({
    title: song.notifyTitle || 'Douban FM',
    open: song.open || pkg.repository.url,
    message: song.text || pkg.name + ' v' + pkg.version,
  })
}

export function updateTab(str) {
  // @bug: 只有一个 tab 的时候这个 func 会导致 tab 页面闪动
  exec('printf "\\e]1;' + str + '\\a"', (error, stdout, stderr) => {
    sys.puts(stdout)
  })
}

export function title(str, selectedColor) {
  if (!str) 
    return false

  return color[selectedColor || 'grey'](str)
}

export function listing() {
  return title('加载列表中，请稍等...')
}

export function loading() {
  return title('歌曲缓冲中，请稍等..')
}

export function pause() {
  title('Douban FM');
  return color.yellow('||');
}

export function song(s, selectText, silence) {
  var label = '♫ ';
  var song = s.title ? s : {};
  if (!song.title) {
    song.text = label + '未知曲目...';
    if (!silence) 
      this.notify(song);

    return color.grey(song.text);
  }

  song.text = label + song.title + ' - ' + song.artist;
  song.open = utils.album(song.album);

  if (!silence) 
    this.notify(song);

  return [
    song.like == 1 ? color.red('♥') : color.grey('♥'),
    color.green(song.title),
    color.grey(song.kbps + 'kbps'),
    color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
    selectText || color.yellow(song.albumtitle),
    selectText ? '' : color.grey('•'),
    selectText ? '' : song.artist,
    selectText ? '' : color.grey(song.public_time)
  ].join(' ')
}

export function share(song) {
  var text = `我正用豆瓣电台命令行版 v${ pkg.version } 收听${song.title ? '「' + song.title + '」' : '本地电台频道'}${song.kbps ? song.kbps + 'kbps' : ''}${song.albumtitle ? song.albumtitle + ' • ' : ''}${song.artist || ''}${song.public_time || ''}${song.album ? utils.album(song.album) : ''}`
  var uri = `http://service.weibo.com/share/share.php?&type=button'&appkey=3374718187&ralateUid=1644105187'&url='${ pkg.repository.url }&pic=${ song.picture ? song.picture.replace('mpic', 'lpic') : '' }%7C%7Chttp://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg&title=${ encodeURIComponent(text) }`

  // Windows 下终端 `&` 需要转义
  if (process.platform === 'win32') 
    uri = uri.replace(/&/g, '^&');

  return uri;
}

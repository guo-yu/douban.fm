var color = require('colorful'),
    utils = require('./utils'),
    sys = require('../package'),
    printf = require('sprintf').sprintf,
    system = require('sys'),
    exec = require('child_process').exec,
    notifier = new require('node-notifier')();

exports.logo = function(user) {
    return printf(
        '%s %s %s',
        color.yellow('Douban FM'),
        color.grey('v' + sys.version),
        user && user.account && user.account.user_name ?
        color.grey('/ ' + user.account.user_name) :
        ''
    )
}

exports.notify = function(str) {
    notifier.notify({
        title: 'Douban FM',
        message: str
    });
}

exports.updateTab = function(str) {
    exec(
        'printf "\\e]1;' + str + '\\a"',
        function (error, stdout, stderr) { system.puts(stdout); }
    );
}

exports.listing = function() {
    var str = '加载列表中，请稍等...';
    this.updateTab(str);
    return color.grey(str);
}

exports.loading = function() {
    var str = '歌曲缓冲中，请稍等...';
    this.updateTab(str);
    return color.grey(str);
}

exports.song = function(song) {
    var strMusic  = '♫ ',
        strFailed = strMusic + '未知曲目...';
    if (!song.title) {
        this.notify(strFailed);
        this.updateTab(strFailed);
        return color.grey();
    }
    var strSong = strMusic + song.title + ' - ' + song.artist;
    this.notify(strSong);
    this.updateTab(strSong);
    return printf(
        '%s %s %s %s %s %s %s %s',
        song.like == 1 ? color.red('♥') : color.grey('♥'),
        color.green(song.title),
        color.grey(song.kbps + 'kbps'),
        color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
        color.yellow(song.albumtitle),
        color.grey('•'),
        song.artist,
        color.grey(song.public_time)
    )
}

exports.pause = function() {
    var str = '||';
    this.updateTab('Douban FM');
    return color.yellow(str);
}

exports.share = function(song) {
    var shareText = 'http://service.weibo.com/share/share.php?' +
        '&type=button' +
        '&style=number' +
        '&appkey=5rjNpN' +
        '&ralateUid=1644105187' +
        '&url=' +
        sys.repository.url +
        '&pic=' +
        (song.picture ? song.picture.replace('mpic', 'lpic') : '') +
        '%7C%7C' +
        'http://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg' +
        '&title=' +
        encodeURIComponent([
            '我正在用豆瓣电台命令行版 v' + sys.version + ' 收听 ',
            song.like ? '[心]' : '',
            song.title ? song.title: '本地电台频道',
            song.kbps ? song.kbps + 'kbps' : '',
            '... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...',
            song.albumtitle ? song.albumtitle + '•' : '',
            song.artist ? song.artist : '',
            song.public_time ? song.public_time : '',
            song.album ? utils.album(song.album) : ''
        ].join(' '));
    // windows 下终端 & 需要转义
    if (process.platform === 'win32') shareText = shareText.replace(/&/g, '^&');
    return shareText;
}

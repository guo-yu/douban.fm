var Lrc = require('lrc').Lrc,
    color = require('colorful'),
    printf = require('sprintf').sprintf,
    sdk = require('./sdk');

exports.print = function(self, lrc, song) {
    if (!self.menu) return false;
    if (!self.isShowLrc) return false;
    // TODO: 这里也有冗余代码
    self.menu.update(
        self.channel,
        printf(
            '%s %s %s %s %s',
            song.like == 1 ? color.red('♥') : color.grey('♥'),
            color.green(song.title),
            color.grey(song.kbps + 'kbps'),
            color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
            color.grey(lrc)
        )
    );
    return false;
}

exports.fetch = function(self, song) {
    if (self.lrc) self.lrc.stop();
    sdk.lrc(song.title, song.artist, function(err, lrc) {
        if (err) return self.menu.update(0, color.grey('抱歉, 没找到歌词'));
        if (!lrc) return self.menu.update(0, color.grey('抱歉, 没找到歌词'));
        self.lrc = new Lrc(lrc.toString(), function(line, extra) {
            exports.print(self, line, song);
        });
        self.lrc.play(0);
    });
}
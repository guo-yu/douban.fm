var Lrc = require('lrc').Lrc,
    color = require('colorful'),
    sdk = require('./sdk');

exports.print = function(self, lrc) {
    if (!self.menu) return false;
    if (!self.isShowLrc) return false;
    self.menu.update(self.channel, lrc);
    return false;
}

exports.fetch = function(self, song) {
    if (self.lrc) self.lrc.stop();
    sdk.lrc(song.title, song.artist, function(err, lrc) {
        if (err) return self.menu.update(0, color.grey('抱歉, 没找到歌词'));
        if (!lrc) return self.menu.update(0, color.grey('抱歉, 没找到歌词'));
        exports.print(self, color.grey('正在加载歌词....'));
        self.lrc = new Lrc(lrc.toString(), function(line, extra) {
            exports.print(self, line);
        });
        self.lrc.play(0);
    });
}

var Lrc = require('lrc').Lrc,
    sdk = require('./sdk');

exports.printLrc = function(self, lrc) {
    if (!self.menu) return false;
    if (!self.isShowLrc) return false;
    var currentMenu = self.currentMenu;
    self.menu.remove(self.menuIndex);
    self.menu.add(self.menuIndex, '歌词:   ' + lrc);
    if (currentMenu) self.menu.select(currentMenu);
    self.menu.draw();
}

exports.playLrc = function(self, song) {
    var title = song.title;
    var author = song.artist;
    if (self.lrc) self.lrc.stop();
    sdk.lrc(title, author, function(data) {
        if (!data) return exports.printLrc(self, '没找到歌词');
        exports.printLrc(self, '正在拼命加载歌词....');
        self.lrc = new Lrc(data.toString(), function(line, extra) {
            exports.printLrc(self, line);
        });
        self.lrc.play(0);
    });
}

exports.showLrc = function(self) {
    var currentMenu = self.currentMenu;
    if (self.isShowLrc) {
        self.menu.remove(self.menuIndex);
    } else {
        self.menu.add(self.menuIndex, '歌词开启');
    }
    self.isShowLrc = !!!self.isShowLrc;
    if (currentMenu) self.menu.select(currentMenu);
    self.menu.draw();
    return false;
}

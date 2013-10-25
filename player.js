var Player = require('player'),
    _ = require('underscore'),
    color = require('colorful');

// 播放器
var player = function(menu, channel, playList) {
    this.label = channel.label;
    this.channel = channel;
    this.playList = playList;
    this.menu = menu;
};

// 更新播放状态
player.prototype.update = function(info) {
    this.channel.label = this.label + ' ' + info;
    this.menu.draw();
};

// 播放
player.prototype.play = function(playList) {
    var list = [],
        self = this;

    _.each(playList, function(item) {
        list.push(item.url);
    });

    // 立即播放
    return Player.play(list, function(player) {
        // 当五首歌播放完成时
    }).on('playing', function(item) {

        var song = playList[item.sid - 1],
            love = (song.like == 1) ? color.yellow('[♥]') : color.grey('[♥]'),
            alert = love + '『 ' + color.green(song.title) + ' 』(' + song.kbps + 'kbps)' + color.grey(' ... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ... ') + ' [专辑：' + song.albumtitle + '] [歌手：' + song.artist + ']';
        self.update(alert);

    }).on('playend', function(item) {
        self.update('正在切换下一首...');
    }).on('error', function(err) {
        // 捕捉错误不成功。
        self.update('Error...');
    });

};

// 立即播放
player.prototype.start = function() {
    if (this.playList.length && this.playList.length > 0) {
        this.update('正在加载...');
        this._player = this.play(this.playList);
    }
};

module.exports = player;
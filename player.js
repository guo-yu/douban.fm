var Player = require('player'),
    _ = require('underscore');

// 播放器
var player = function(playList) {
    this.playList = playList;
};

// 播放
player.prototype.play = function(playList) {
    if (this.playList.length && this.playList.length > 0) {

        var list = [],
            self = this,
            playList = self.playList;

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
            // self.update(alert);

        }).on('playend', function(item) {
            // self.update('正在切换下一首...');
        }).on('error', function(err) {
            // 捕捉错误不成功。
            console.log(err);
            // self.update('Error...');
        });
    }
};

module.exports = player;
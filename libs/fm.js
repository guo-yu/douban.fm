var fs = require('fs'),
    path = require('path'),
    exeq = require('exeq'),
    mkdirp = require('mkdirp'),
    Player = require('player'),
    color = require('colorful'),
    printf = require('sprintf').sprintf,
    params = require('paramrule'),
    consoler = require('consoler'),
    sys = require('../package'),
    sdk = require('./sdk'),
    lrc = require('./lrc'),
    utils = require('./utils'),
    errors = require('./errors'),
    termList = require('./term-list');

// 快捷键列表
var shorthands = {
    'return': 'play',
    'backspace': 'stop',
    'g': 'go',
    'l': 'loving',
    'n': 'next',
    'q': 'quit',
    's': 'share',
    'r': 'showLrc'
};

var Fm = function(params) {
    this.home = params && params.home ? params.home : path.join(utils.home(), 'douban.fm');
    this.love = path.join(this.home, 'love');
    this.shorthands = shorthands;
    this.isShowLrc = false;
};

Fm.prototype.play = function(channel, user) {

    var self = this,
        menu = self.menu,
        account = user && user.account ? user.account : {},
        privateHz = (channel.channel_id == 0 || channel.channel_id == -3) && !account.token;

    // 检查是否是私人兆赫，如果没有设置账户直接返回
    if (privateHz) return menu.update(channel.index, color.yellow(errors.account_missing));
    if (self.status === 'fetching' || self.status === 'downloading') return false;
    if (self.status === 'playing') {
        if (typeof(self.channel) != undefined) menu.clear(self.channel);
        self.player.stop();
        self.player.status = 'stoped';
        self.player = null;
    }

    // 清除标志状态，加载标志
    menu.clear(0);
    self.channel = channel.index;
    self.status = 'fetching';
    menu.update(channel.index, color.grey('加载列表中，请稍等...'));

    // 获取相应频道的曲目
    sdk.fetch({
        channel: channel.channel_id,
        user_id: account.user_id,
        expire: account.expire,
        token: account.token,
        kbps: 192
    }, function(err, songs, result) {
        if (err) return menu.update(channel.index, color.red(err.toString()));
        // 标记 PRO 账户
        if (result && !result.warning) menu.update(0, color.inverse(' PRO '));
        self.status = 'ready';
        self.player = new Player(songs, {
            srckey: 'url',
            downloads: self.home
        });
        self.player.play();
        // 同步下载不太好，但是在解决 stream 的无法获取抛错之前没有好办法
        self.player.on('downloading', function(url) {
            self.status = 'downloading';
            menu.update(channel.index, color.grey('下载歌曲中，请稍等...'));
        });
        // 更新歌单
        self.player.on('playing', function(song) {
            self.status = 'playing';
            menu.update(0, color.yellow('>>'));
            // lrc.playLrc(self, song);
            menu.update(
                channel.index,
                printf(
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
            );
            if (song._id < self.player.list.length - 1) return false;
            self.status = 'switching';
            return sdk.fetch({
                channel: channel.channel_id,
                user_id: account.user_id,
                expire: account.expire,
                token: account.token,
                kbps: 192
            }, function(err, songs) {
                if (err) return false;
                // 没有对尝试获取列表失败进行处理，如果失败2次，则不会再播放任何歌曲
                if (!songs) return false;
                return songs.forEach(function(s, index) {
                    s._id = self.player.list.length;
                    self.player.add(s);
                });
            });
        });
    });
}

Fm.prototype.loving = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    if (!user || !user.account) return false;
    var self = this,
        menu = self.menu,
        account = user && user.account ? user.account : {},
        song = self.player.playing;
    var query = {
        sid: song.sid,
        channel: self.channel,
        user_id: account.user_id,
        expire: account.expire,
        token: account.token
    };
    if (song.like) query.type = 'u';
    menu.update(0, '正在加载...');
    sdk.love(query, function(err, result) {
        var tips = !(song.like) ? color.red('♥') : color.grey('♥');
        if (err) tips = color.red('x');
        if (!err) self.player.playing.like = !song.like;
        // TODO: 这里有冗余代码
        menu.clear(0);
        return menu.update(
            self.channel,
            printf(
                '%s %s %s %s %s %s %s %s',
                tips,
                color.green(song.title),
                color.grey(song.kbps + 'kbps'),
                color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
                color.yellow(song.albumtitle),
                color.grey('•'),
                song.artist,
                color.grey(song.public_time)
            )
        );
    });
}

Fm.prototype.next = function() {
    if (!this.player) return false;
    return this.player.next();
}

Fm.prototype.stop = function() {
    if (!this.player) return false;
    var menu = this.menu;
    menu.clear(0);
    menu.update(0, color.yellow('||'));
    return this.player.stop();
}

Fm.prototype.quit = function() {
    this.menu.stop();
    return process.exit();
}

Fm.prototype.go = function(channel, user, link) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    return utils.go(link ? link : utils.album(this.player.playing.album));
}

Fm.prototype.showLrc = function(channel, user) {
    return lrc.showLrc(this, channel, user);
}

Fm.prototype.share = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    var song = this.player.playing;
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
            song.title,
            song.kbps + 'kbps',
            '... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...',
            song.albumtitle,
            '•',
            song.artist,
            song.public_time,
            utils.album(song.album)
        ].join(' '));
    // windows 下终端 & 需要转义
    if (process.platform === 'win32') shareText = shareText.replace(/&/g, '^&');

    return utils.go(shareText);
}

Fm.prototype.createMenu = function(callback) {
    var self = this,
        shorthands = self.shorthands;
    // self.menuIndex = 0;
    sdk.channels(function(err, list) {
        if (err) return consoler.error('获取豆瓣电台频道出错，请稍后再试');
        self.configs(function(err, user) {
            self.menu = new termList();
            self.menu.adds(
                [
                printf(
                    '%s %s %s',
                    color.yellow('Douban FM'),
                    color.grey('v' + sys.version),
                    user && user.account && user.account.user_name ?
                    color.grey('/ ' + user.account.user_name) :
                    ''
                )].concat(list)
            )
            self.menu.on('keypress', function(key, index){
                if (!shorthands[key.name]) return false;
                if (index < 1 && key.name != 'q') return utils.go(sys.repository.url);
                // self.currentMenu = index;
                return self[shorthands[key.name]](self.menu.items[index], user);
            });
            self.menu.on('empty', function() {
                self.menu.stop();
            });
            self.menu.start(1);
        });
    });
    if (!callback || typeof(callback) !== 'function') return false;
    return callback();
};

Fm.prototype.auth = function(params, callback) {
    var self = this;
    sdk.auth(params, function(err, user) {
        if (err) return callback(err);
        self.configs({
            account: {
                email: user.email,
                token: user.token,
                expire: user.expire,
                user_name: user.user_name,
                user_id: user.user_id
            }
        }, callback);
    });
};

Fm.prototype.configs = function() {
    var self = this;
    params.parse(arguments, ['', '*'], function(params, callback) {
        if (!params) {
            fs.readFile(path.join(self.home, '.configs.json'), function(err, data) {
                if (err) return callback(err, null);
                try {
                    callback(err, JSON.parse(data));
                } catch (err) {
                    callback(err);
                }
            });
        } else {
            fs.writeFile(path.join(self.home, '.configs.json'), JSON.stringify(params), function(err) {
                callback(err, params);
            });
        }
    });
};

Fm.prototype.init = function(callback) {
    var self = this;
    fs.exists(self.home, function(exist) {
        if (exist) return self.createMenu(callback);
        mkdirp(self.love, function(err) {
            if (err) return consoler.error('创建歌曲文件夹出错，请检查权限');
            return self.createMenu(callback);
        });
    })
};

Fm.prototype.sdk = sdk;

exports = module.exports = Fm;

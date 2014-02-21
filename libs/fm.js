var fs = require('fs'),
    path = require('path'),
    exeq = require('exeq'),
    mkdirp = require('mkdirp'),
    Player = require('player'),
    color = require('colorful'),
    consoler = require('consoler'),
    sys = require('../package'),
    sdk = require('./sdk'),
    lrc = require('./lrc'),
    utils = require('./utils'),
    errors = require('./errors'),
    template = require('./template'),
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

var Fm = function() {
    this.userhome = utils.home();
    this.rc = {};
    this.rc.profile = path.join(this.userhome, '.douban.fm.profile.json');
    this.rc.history = path.join(this.userhome, '.douban.fm.history.json');
    this.home = utils.read(this.rc.profile) || path.join(this.userhome, 'douban.fm');
    this.love = path.join(this.home, 'love');
    this.shorthands = shorthands;
    this.isShowLrc = false;
    // ensure dir exists
    mkdirp.sync(this.love);
};

Fm.prototype.play = function(channel, user) {

    var self = this,
        menu = self.menu,
        account = user && user.account ? user.account : {},
        privateMhz = (channel.channel_id == 0 || channel.channel_id == -3) && !account.token;

    // 检查是否是私人兆赫，如果没有设置账户直接返回
    if (privateMhz) return menu.update(channel.index, color.yellow(errors.account_missing));
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
        local: (channel.channel_id == -99) ? self.home : false,
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
            if (song.title && song.sid) self.log(song);
            menu.update(0, color.yellow('>>'));
            if (self.isShowLrc) lrc.fetch(self, song);
            menu.update(
                channel.index,
                template.song(song)
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
    if (!this.player.playing.sid) return this.menu.update(0, '未知曲目无法加心');
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
        menu.clear(0);
        if (err) menu.update(0, '出错了, 请稍后再试...');
        if (!err) self.player.playing.like = !song.like;
        return menu.update(
            self.channel,
            template.song(self.player.playing)
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

Fm.prototype.go = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    if (channel.channel_id == -99) return false;
    return utils.go(utils.album(this.player.playing.album));
}

Fm.prototype.showLrc = function(channel, user) {
    if (channel.channel_id == -99) return false;
    this.isShowLrc = !!!this.isShowLrc;
    this.menu.clear(0);
    this.menu.update(0, this.isShowLrc ? '歌词开启' : '歌词关闭');
    return false;
}

Fm.prototype.share = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    return utils.go(template.share(this.player.playing));
}

Fm.prototype.createMenu = function(callback) {
    var self = this,
        shorthands = self.shorthands;
    sdk.channels(function(err, list) {
        if (err) consoler.error('获取豆瓣电台频道出错，切换为本地电台...');
        self.configs(function(err, user) {
            self.menu = new termList();
            var nav = [template.logo(user), sdk.mhz.localMhz];
            self.menu.adds(!err ? nav.concat(list) : nav);
            self.menu.on('keypress', function(key, index) {
                if (!shorthands[key.name]) return false;
                if (index < 1 && key.name != 'q') return utils.go(sys.repository.url);
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
    return utils.log(this.rc.profile, arguments);
};

Fm.prototype.history = function() {
    return utils.log(this.rc.history, arguments);
};

Fm.prototype.log = function(song) {
    var self = this;
    return self.history(function(err, songs) {
        var list = (err || !songs || songs.length === 0) ? {} : songs;
        list[song.sid] = song;
        self.history(list, function() {});
    });
}

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

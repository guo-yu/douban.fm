var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    mkdirp = require('mkdirp'),
    Player = require('player'),
    color = require('colorful'),
    List = require('term-list'),
    printf = require('sprintf').sprintf,
    params = require('paramrule'),
    exeq = require('exeq'),
    sys = require('../package'),
    sdk = require('./sdk'),
    utils = require('./utils'),
    errors = require('./errors');

var shorthands = {
    'return': 'play',
    'backspace': 'stop',
    'g': 'goto',
    'n': 'next',
    'q': 'quit'
};

var Fm = function(params) {
    this.home = params && params.home ? params.home : path.join(utils.home(), 'douban.fm');
    this.love = path.join(this.home, 'love');
    this.shorthands = shorthands;
};

Fm.prototype.play = function(channel, user) {
    var self = this;
    var account = user && user.account ? user.account : {};
    // 检查是否是私人兆赫，如果没有设置账户直接返回
    if (channel.channel_id == 0 && !account.token) return self.update(channel.index, color.yellow(errors.account_missing));
    // 如果正在播放，重置播放器，清除标签
    if (self.player && (self.player.status === 'playing' || self.player.status === 'downloading')) {
        if (typeof(self.channel) != undefined) self.update(self.channel, '');
        self.player.stop();
        self.player.status = 'stoped';
        self.player = null;
    }
    self.channel = channel.index;
    // 获取相应频道的曲目
    sdk.channel({
        id: channel.channel_id,
        type: 'n'
    }, account, function(err, songs) {
        if (err) return self.update(channel.index, color.red(err.toString()));
        self.player = new Player(songs, {
            srckey: 'url',
            downloads: self.home
        });
        self.player.play();
        // 同步下载模式
        // 同步下载不太好，但是在解决 steam 的无法 catch 到抛错之前没有办法。
        self.player.on('downloading', function(song) {
            self.update(channel.index, color.grey('正在下载...'));
        });
        // 更新歌单
        self.player.on('playing', function(song) {
            self.update(
                channel.index,
                printf(
                    '%s %s %s %s %s %s %s',
                    song.like == 1 ? color.red('♥') : color.grey('♥'),
                    color.green(song.title),
                    color.grey(song.kbps + 'kbps'),
                    color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
                    color.yellow(song.albumtitle),
                    color.grey('•'),
                    song.artist
                )
            );
        });
        // TODO: 在五首歌播放完成时，应当请求下一首歌
        self.player.on('playend', function(song) {

        });
    });
}

Fm.prototype.goto = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    return exeq(['open http://music.douban.com' + this.player.playing.album]).run();
}

Fm.prototype.next = function() {
    if (this.player) return this.player.next();
    return false;
}

Fm.prototype.stop = function() {
    if (this.player) return this.player.stop();
    return false;
}

Fm.prototype.quit = function() {
    return process.exit();
}

Fm.prototype.update = function(index, banner) {
    if (!this.menu) return false;
    this.menu.at(index + 2).label = this.channels[index].name + ' ' + banner;
    this.menu.draw();
    return false;
};

Fm.prototype.createMenu = function(callback) {
    var self = this;
    var shorthands = self.shorthands;
    sdk.list(function(err, list) {
        if (err) return console.log(err);
        self.configs(function(err, user) {
            if (err) return console.log(err);
            // init menu
            self.channels = {};
            self.menu = new List({
                marker: '\033[36m› \033[0m',
                markerLength: 2
            });
            // add padding-top
            self.menu.add(-2, '');
            // add logo
            self.menu.add(-1, printf(
                '%s %s',
                color.yellow('Douban FM'),
                color.grey('v' + sys.version)
            ));
            // add channels
            _.each(list, function(channel, index) {
                channel.index = index;
                self.menu.add(index, channel.name);
                self.channels[index] = channel;
            });
            // start menu
            self.menu.start();
            self.menu.select(-1);
            // bind events
            self.menu.on('keypress', function(key, index) {
                if (!shorthands[key.name]) return false;
                if (index < 0) return exeq(['open ' + sys.repository.url]).run();
                return self[shorthands[key.name]](self.channels[index], user);
            });
            self.menu.on('empty', function() {
                menu.stop();
            });
        });
    });
    if (callback && typeof(callback) === 'function') return callback();
};

Fm.prototype.auth = function(params, callback) {
    var self = this;
    sdk.auth(params, function(err, user) {
        if (err) return callback(err);
        self.configs({
            account: {
                email: user.email,
                password: params.password,
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
            // read configs
            fs.readFile(path.join(self.home, '.configs.json'), function(err, f) {
                if (err) return callback(err, null);
                try {
                    self.configs = JSON.parse(f);
                    callback(err, self.configs);
                } catch (err) {
                    callback(err);
                }
            });
        } else {
            // save params
            fs.writeFile(path.join(self.home, '.configs.json'), JSON.stringify(params), function(err) {
                callback(err, params);
            });
        }
    });
};

// init player
Fm.prototype.init = function(callback) {
    var self = this;
    fs.exists(self.home, function(exist) {
        if (exist) return self.createMenu(callback);
        mkdirp(self.love, function(err) {
            if (err) return console.log(err);
            return self.createMenu(callback);
        });
    })
};

Fm.prototype.sdk = sdk;

exports = module.exports = Fm;
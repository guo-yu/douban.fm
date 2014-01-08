var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    mkdirp = require('mkdirp'),
    Player = require('player'),
    color = require('colorful'),
    List = require('term-list'),
    utils = require('./utils'),
    sdk = require('./sdk');

var shorthands = {
    'return': 'play',
    'backspace': 'stop',
    'n': 'next',
    'q': 'quit'
};

var Fm = function(params) {
    this.home = params && params.home ? params.home : path.join(utils.home(), 'douban.fm');
    this.love = path.join(this.home, 'love');
    this.shorthands = shorthands;
};

Fm.prototype.play = function(item, user) {
    var self = this;
    var account = user && user.account ? user.account : {};
    // 检查是否是私人兆赫
    if (item.channel_id == 0 && !account.token) return self.update(item.index, color.yellow('请先设置豆瓣账户再收听私人兆赫哦~ $ douban.fm -m [account] [password]'));
    // 获取相应频道的曲目
    sdk.channel({
        id: item.channel_id,
        type: 'n'
    }, account, function(err, songs) {
        if (err) return self.update(item.index, color.red(err.toString()));
        self.player = new Player(songs, {
            srckey: 'url',
            downloads: self.home
        });
        self.player.play();
        self.player.on('downloading', function(song) {
            self.update(item.index, '正在下载...');
        });
        self.player.on('playing', function(song) {
            var love = (song.like == 1) ? color.yellow('[♥]') : color.grey('[♥]');
            var alert = love + '『 ' + color.green(song.title) + ' 』(' + song.kbps + 'kbps)' + color.grey(' ... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ... ') + ' [专辑：' + song.albumtitle + '] [歌手：' + song.artist + ']';
            self.update(item.index, alert);
        });
        self.player.on('playend', function(song) {

        });
    });
}

Fm.prototype.next = function() {
    if (this.player) this.player.next();
}

Fm.prototype.stop = function() {
    if (this.player) this.player.stop();
}

Fm.prototype.quit = function() {
    return process.exit();
}

Fm.prototype.update = function(index, banner) {
    if (!this.menu) return false;
    this.menu.at(index).label = this.navs[index] + ' ' + banner;
    this.menu.draw();
    return false;
};

Fm.prototype.createMenu = function(callback) {
    var self = this;
    var shorthands = self.shorthands;
    sdk.list(function(err, list) {
        if (err) return console.log(err);
        self.readConfigs(function(err, user) {
            if (err) return console.log(err);
            // init menu
            self.navs = [];
            self.menu = new List({
                marker: '\033[36m› \033[0m',
                markerLength: 2
            });
            _.each(list, function(item, index) {
                item['index'] = index;
                self.menu.add(item, item.name);
                self.navs.push(item.name);
            });
            // start menu
            self.menu.start();
            // bind events
            self.menu.on('keypress', function(key, item) {
                if (!shorthands[key.name]) return false;
                return self[shorthands[key.name]](item, user);
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
        self.saveConfigs({
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

Fm.prototype.readConfigs = function(callback) {
    var self = this;
    fs.readFile(path.join(this.home, '.configs.json'), function(err, f) {
        if (err) return callback(err, null);
        try {
            self.configs = JSON.parse(f);
            callback(err, self.configs);
        } catch (err) {
            callback(err);
        }
    });
};

Fm.prototype.saveConfigs = function(params, callback) {
    fs.writeFile(path.join(this.home, '.configs.json'), JSON.stringify(params), function(err) {
        callback(err, params);
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
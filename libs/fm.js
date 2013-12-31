var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    mkdirp = require('mkdirp'),
    Player = require('player'),
    color = require('colorful'),
    List = require('term-list'),
    consoler = require('consoler'),
    sdk = require('./sdk');

var getUserHome = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

var Fm = function(params) {
    this.home = params && params.home ? params.home : path.join(getUserHome(), 'douban.fm');
    this.love = path.join(this.home,'love');
};

Fm.prototype.actions = function(key, item, user) {
    var self = this;
    // 回车播放
    if (key.name == 'return') {
        var account = user && user.account ? user.account : {};
        // 检查是否是私人兆赫
        if (item.channel_id == 0 && !account.token) return self.updateMenu(item.index, color.yellow('请先设置豆瓣账户再收听私人兆赫哦~ $ douban.fm -m [account] [password]'));
        // 获取相应频道的曲目
        sdk.channel({
            id: item.channel_id,
            type: 'n'
        }, account, function(err, songs) {
            if (err) return self.updateMenu(item.index, color.red(err.toString()));
            self.player = new Player(songs, {
                srckey: 'url',
                downloads: self.home
            });
            self.player.play();
            self.player.on('downloading', function(song) {
                self.updateMenu(item.index, '正在下载...');
            });
            self.player.on('playing', function(song) {
                var love = (song.like == 1) ? color.yellow('[♥]') : color.grey('[♥]');
                var alert = love + '『 ' + color.green(song.title) + ' 』(' + song.kbps + 'kbps)' + color.grey(' ... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ... ') + ' [专辑：' + song.albumtitle + '] [歌手：' + song.artist + ']';
                self.updateMenu(item.index, alert);
            });
            self.player.on('playend', function(song) {
                
            });
        });

    } else if (key.name == 'backspace') {
        if (self.player) self.player.stop();
    } else if (key.name == 'n') {
        if (self.player) self.player.next();
    } else if (key.name == 'q') {
        return process.exit();
    } else {
        return false;
    }
}

Fm.prototype.initMenu = function(list, user) {
    var self = this;
    // config menu
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
        self.actions(key, item, user);
    });
    self.menu.on('empty', function() {
        menu.stop();
    });
}

Fm.prototype.updateMenu = function(index, banner) {
    if (!this.menu) return false;
    this.menu.at(index).label = this.navs[index] + ' ' + banner;
    this.menu.draw();
    return false;
};

Fm.prototype.createMenu = function() {
    var self = this;
    consoler.loading('正在加载...');
    sdk.list(function(err, list) {
        if (err) return consoler.error(err);
        self.readConfigs(function(err, user) {
            if (err) return consoler.error(err);
            self.initMenu(list, user);
        });
    });
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
    fs.writeFile(path.join(this.home, '.configs.json'), JSON.stringify(params), function(err){
        callback(err, params);
    });
};

Fm.prototype.check = function(dir, callback) {
    fs.exists(dir, callback);
};

// init player
Fm.prototype.init = function() {
    var self = this;
    self.check(self.home, function(exist) {
        if (exist) return self.createMenu();
        mkdirp(self.love, function(err) {
            if (err) return console.log(err);
            return self.createMenu();
        });
    })
};

Fm.prototype.sdk = sdk;

exports = module.exports = Fm;

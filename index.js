//        __            __                  ____        
//   ____/ /___  __  __/ /_  ____ _____    / __/___ ___ 
//  / __  / __ \/ / / / __ \/ __ `/ __ \  / /_/ __ `__ \
// / /_/ / /_/ / /_/ / /_/ / /_/ / / / / / __/ / / / / /
// \__,_/\____/\__,_/_.___/\__,_/_/ /_(_)_/ /_/ /_/ /_/ 
//
// @brief: Douban.fm command line interface based on Node.js
// @author: [turingou](http://guoyu.me)

var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    consoler = require('consoler'),
    Player = require('player'),
    color = require('colorful'),
    List = require('term-list'),
    _ = require('underscore'),
    sdk = require('./sdk');

var getUserHome = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

var Fm = function(params) {
    this.home = params && params.home ? params.home : path.join(getUserHome(), 'douban.fm');
}

Fm.prototype.actions = function(key, item, user) {
    var self = this;
    // 回车播放
    if (key.name == 'return') {
        var account = user && user.douban_account ? user.douban_account : {};
        // 检查是否是私人兆赫
        if (item.channel_id == 0 && !account.token) {
            self.updateMenu(item.index, color.yellow('请先设置豆瓣账户再收听私人兆赫哦~ $ sudo douban.fm -m [account] [password]'));
            return false;
        }
        // 获取相应频道的曲目
        sdk.channel({
            id: item.channel_id,
            type: 'n'
        }, account, function(err, songs) {
            if (!err) {
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
                    // setTimeout(function(){
                    //     console.log('it is gona stop !!!');
                    //     self.player.stop();
                    // },3000);
                });
                self.player.on('playend', function(song) {
                    console.log('begain switch...')
                });
            } else {
                self.updateMenu(item.index, color.red(err.toString()));
            }
        });

    } else if (key.name == 'backspace') {
        if (self.player) self.player.stop();
    } else if (key.name == 'l') {
        // 加红心
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
    if (this.menu) {
        this.menu.at(index).label = this.navs[index] + ' ' + banner;
        this.menu.draw();
    }
};

Fm.prototype.createMenu = function() {
    var self = this;
    consoler.loading('正在加载...');
    sdk.list(function(err, list) {
        if (!err) {
            self.readConfigs(function(err, user) {
                if (!err) {
                    self.initMenu(list, user);
                } else {
                    consoler.error(err);
                }
            });
        } else {
            consoler.error(err);
        }
    });
}

Fm.prototype.auth = function(params, callback) {
    var self = this;
    sdk.auth(params, function(err, user) {
        if (!err) {
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
        } else {
            callback(err);
        }
    });
}

Fm.prototype.readConfigs = function(callback) {
    var self = this;
    fs.readFile(path.join(this.home, '.configs.json'), function(err, f) {
        if (!err) {
            try {
                self.configs = JSON.parse(f);
                callback(err, self.configs);
            } catch (err) {
                callback(err);
            }
        } else {
            callback(null, null);
        }
    });
}

Fm.prototype.saveConfigs = function(params, callback) {
    fs.writeFile(path.join(this.home, '.configs.json'), JSON.stringify(params), callback);
}

Fm.prototype.check = function(dir, callback) {
    fs.exists(dir, function(exist) {
        if (exist) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

// init player
Fm.prototype.init = function() {
    var self = this;
    self.check(self.home, function(exist) {
        if (!exist) {
            mkdirp(self.home, function(err) {
                if (!err) {
                    self.createMenu();
                } else {
                    console.log('setup error');
                    console.log(err);
                }
            });
        } else {
            self.createMenu();
        }
    })
}

Fm.prototype.sdk = sdk;

module.exports = Fm;
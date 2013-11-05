var fs = require('fs'),
    consoler = require('consoler'),
    optimist = require('optimist'),
    argv = optimist.argv,
    color = require('colorful'),
    _ = require('underscore'),
    List = require('term-list'),
    api = require('./sdk'),
    Player = require('player');

var config = {
    read: function(callback) {
        fs.readFile(__dirname + '/config.json', function(err, f) {
            if (!err) {
                callback(null, JSON.parse(f));
            } else {
                callback(err);
            }
        })
    },
    save: function(params, callback) {
        fs.writeFile(__dirname + '/config.json', JSON.stringify(params), callback);
    }
};

var Menu = {
    update: function(index, banner) {
        if (this.menu) {
            this.menu.at(index).label = this.navs[index] + ' ' + banner;
            this.menu.draw();
        }
    },
    actions: function(key, item, user) {
        var self = this;
        var menu = self.menu;
        // 回车播放
        if (key.name == 'return') {
            var account = user && user.douban_account ? user.douban_account : {};
            // 检查是否是私人兆赫
            if (item.channel_id == 0 && !account.token) {
                self.update(item.index, color.yellow('请先设置豆瓣账户再收听私人兆赫哦~ $ sudo douban.fm -m [account] [password]'));
                return false;
            }
            // 获取相应频道的曲目
            api.channel({
                id: item.channel_id,
                type: 'n'
            }, account, function(err, songs) {
                if (!err) {
                    self.player = new Player(songs, {
                        srckey: 'url'
                    });
                    self.player.play();
                    self.player.on('downloading', function(song) {
                        self.update(item.index, '正在下载...');
                    });
                    self.player.on('playing', function(song) {
                        var love = (song.like == 1) ? color.yellow('[♥]') : color.grey('[♥]');
                        var alert = love + '『 ' + color.green(song.title) + ' 』(' + song.kbps + 'kbps)' + color.grey(' ... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ... ') + ' [专辑：' + song.albumtitle + '] [歌手：' + song.artist + ']';
                        self.update(item.index, alert);
                        // setTimeout(function(){
                        //     console.log('it is gona stop !!!');
                        //     self.player.stop();
                        // },3000);
                    });
                    self.player.on('playend', function(song) {
                        console.log('begain switch...')
                    });
                } else {
                    self.update(item.index, color.red(err.toString()));
                }
            });

        } else if (key.name == 'backspace') {
            if (self.player) self.player.stop();
        } else if (key.name == 'l') {
            // 加红心
        }
    },
    init: function(list) {
        var self = this;
        self.navs = [];
        config.read(function(err, user) {
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
        });
    }
}

var init = function() {
    consoler.loading('正在加载...');
    api.list(function(err, list) {
        if (!err) Menu.init(list);
    });
};

module.exports = function() {
    var argument = argv._;
    if (argv.m) {
        if (argument.length == 1) {
            // account auth
            api.auth({
                email: argv.m,
                password: argument[0]
            }, function(user) {
                config.save({
                    douban_account: {
                        email: user.email,
                        password: argument[0],
                        token: user.token,
                        expire: user.expire,
                        user_name: user.user_name,
                        user_id: user.user_id
                    }
                }, function(err) {
                    if (!err) {
                        consoler.success('欢迎你，' + user.user_name + '。您的豆瓣账户已经成功修改为：' + user.email);
                        init();
                    } else {
                        consoler.error(err);
                    }
                });
            })
        }
    } else {
        init();
    }
}
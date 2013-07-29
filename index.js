//        __            __                  ____        
//   ____/ /___  __  __/ /_  ____ _____    / __/___ ___ 
//  / __  / __ \/ / / / __ \/ __ `/ __ \  / /_/ __ `__ \
// / /_/ / /_/ / /_/ / /_/ / /_/ / / / / / __/ / / / / /
// \__,_/\____/\__,_/_.___/\__,_/_/ /_(_)_/ /_/ /_/ /_/ 

/**
 *
 * douban.fm
 * @author: [turingou]
 * @created: [2013/07/20]
 *
 **/

var optimist = require('optimist'),
    argv = optimist.argv,
    color = require('colorful'),
    List = require('term-list'),
    Player = require('player'),
    _ = require('underscore'),
    api = require('./api'),
    pkg = require('./pkg').fetch();

// 修改设置
exports.config = function(type, params) {
    var p = pkg;
    p[type] = params;
    require('./pkg').set(p);
    return p;
}

// 校验豆瓣账户是否正确
exports.auth = function(account, cb) {
    api.post('http://www.douban.com/j/app/login', {
        app_name: 'radio_desktop_win',
        version: 100,
        email: account.email.toString(),
        password: account.password.toString()
    }, function(result) {
        var result = JSON.parse(result);
        if (result.r == 0) {
            cb(result);
        } else {
            if (result.err == 'invalidate_email' || result.err == 'wrong_email') {
                console.log(color.red('抱歉，您的豆瓣帐号似乎出错了'));
                cb(result.err)
            } else if (result.err == 'wrong_password') {
                cb(result.err)
                console.log(color.red('抱歉，您的豆瓣密码似乎出错了'));
            }
        }
    });
};

// 获取频道曲目
exports.channel = function(channel, user, cb) {
    var params = {
        app_name: 'radio_desktop_win',
        version: 100,
        channel: channel.id,
        type: channel.type
    };
    if (user && typeof(user) == 'object' && user.token) {
        params['user_id'] = user.user_id;
        params['expire'] = user.expire;
        params['token'] = user.token;
    };
    api.get('http://www.douban.com/j/app/radio/people', params, function(result) {
        if (result.r == 0) {
            cb(result.song);
        } else {
            console.log(color.red(result.err));
        }
    });
}

// 获取频道列表
exports.list = function(cb) {
    api.get('http://www.douban.com/j/app/radio/channels', null, function(chns) {
        if (chns.channels && chns.channels.length) {
            cb(chns.channels);
        } else {
            console.log(chns);
        }
    });
}

// 操作
exports.action = function(type) {
    // 加红心
    // 垃圾桶
    // 下一首
}

// 播放器
exports.player = function(menu, channel, playList) {
    this.label = channel.label;
    this.channel = channel;
    this.playList = playList;
    this.menu = menu;
};

// 更新播放状态
exports.player.prototype.update = function(info) {
    this.channel.label = this.label + ' ' + info;
    this.menu.draw();
};

// 播放
exports.player.prototype.play = function(playList) {

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
exports.player.prototype.start = function() {
    if (this.playList.length && this.playList.length > 0) {
        this.update('正在加载...');
        this.player = this.play(this.playList);
    }
};

// 菜单
exports.menu = function(list) {

    if (list.length) {

        var menu = new List({
            marker: '\033[36m› \033[0m',
            markerLength: 2
        });

        _.each(list, function(item, index) {
            item['index'] = index;
            menu.add(item, item.name);
        });

        menu.start();
        menu.on('keypress', function(key, item) {

            if (key.name == 'return') {

                var pkg = require('./pkg').fetch(),
                    user = pkg.douban_account;

                // 检查是否是私人兆赫
                if (item.channel_id == 0 && !user.token) {
                    var current = menu.at(item.index);
                    if (!current.alerted) {
                        current.alerted = true;
                        current.label = current.label + color.yellow(' 请先设置豆瓣账户再收听私人兆赫哦~ $ sudo douban.fm -m [account] [password]');
                        menu.draw();
                    };
                    return false;
                };

                // 获取相应频道的曲目
                exports.channel({
                    id: item.channel_id,
                    type: 'n'
                }, user, function(songs) {
                    // 加入播放列表开始播放
                    var current = menu.at(item.index);
                    var player = new exports.player(menu, current, songs);
                    player.start();
                });

            }
        });

        menu.on('empty', function() {
            menu.stop();
        });

    } else {
        return false;
    }

}

// 命令行界面
exports.cli = function() {

    var argument = argv._;
    var init = function() {
        console.log(color.yellow('正在加载...'));
        exports.list(function(list) {
            exports.menu(list);
        });
    }

    if (argv.m) {
        if (argument.length == 1) {
            var douban_account = {
                email: argv.m,
                password: argument[0]
            };
            exports.auth(douban_account, function(user) {
                exports.config('douban_account', {
                    email: user.email,
                    password: argument[0],
                    token: user.token,
                    expire: user.expire,
                    user_name: user.user_name,
                    user_id: user.user_id
                });
                console.log(color.green('欢迎你，' + user.user_name + '。您的豆瓣账户已经成功修改为：' + user.email))
                init()
            })
        }
    } else {
        init()
    }

}
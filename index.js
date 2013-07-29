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
exports.player = function(playList, cb) {

    var _panel = function(song) {
        console.log('#####################################')
        console.log('##                                 ##')
        console.log('##     Douban.fm - Node.js cli     ##')
        console.log('##                                 ##')
        console.log('#####################################')
        console.log('正在播放：' + color.yellow(song.albumtitle));
        console.log(color.yellow(' -- by ' + song.artist));
        console.log('#####################################')
        console.log('## designed and code by turingou ####')
        console.log('##   http://github.com/turingou  ####')
        console.log('#####################################')
        return false;
    };

    var play = function(playList) {
        
        var list = [];
        _.each(playList, function(item) {
            list.push(item.url);
        });

        // 立即播放
        Player.play(list, function(player) {
            // 当五首歌播放完成时
        }).on('playing', function(item) {
            var song = playList[item.sid - 1];
            var love = (song.like == 1) ? color.yellow('[♥]') : color.grey('[♥]'); 
            console.log( love + '『' + color.green(song.title) + '』(' + song.kbps + 'kbps)' + color.grey(' ... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ... ') + ' [专辑：' + song.albumtitle + '] [歌手：' + song.artist + ']');
            // console.log(song);
        }).on('playend', function(item) {
            // 当一首歌播放完时
            // console.log('id:' + item.sid + ' play done, switching to next one ...');
        }).on('error', function(err) {
            // 当流媒体出现播放错误时
            console.log('Opps!!!');
            console.log(err);
        });
    }

    if (playList.length) {
        play(playList);
    };
};

// 菜单
exports.menu = function(list) {

    if (list.length) {

        var menu = new List({
            marker: '\033[36m› \033[0m',
            markerLength: 2
        });

        _.each(list, function(item) {
            menu.add(item, item.name);
        });

        menu.start();
        menu.on('keypress', function(key, item) {

            if (key.name == 'return') {

                var pkg = require('./pkg').fetch(),
                    user = pkg.douban_account;

                if (item.cid == 0 && !user.token) {
                    console.log(color.red('请先设置豆瓣账户才能收听私人电台哦~'))
                    return false;
                };

                // 获取相应频道的曲目
                exports.channel({
                    id: item.channel_id,
                    type: 'n'
                }, user, function(songs) {
                    // 加入播放列表开始播放
                    menu.stop();
                    console.log(color.green('正在播放『' + item.name + '』频道...'));
                    exports.player(songs);
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
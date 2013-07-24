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
    player = require('player'),
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
            } else if (result.err == 'wrong_password') {
                console.log(color.red('抱歉，您的豆瓣密码似乎出错了'));
            }
        }
    });
};

// 获取频道曲目
exports.channel = function(channel,user,cb) {
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
    api.get('http://www.douban.com/j/app/radio/people',params,function(result){
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

// 播放器
var _player = {};
exports.player = function(playList, cb) {
    if (_player.playing) {
        player.stop(_player['playing']);
    }
    if (playList.length) {
        var list = [];
        _.each(playList,function(item){
            list.push(player.add(item.url))
        });
        _player['playing'] = list[0];
        // 播放曲目列表
        var song = playList[0];
        console.log(color.yellow(song.albumtitle + ' ---- by ' + song.artist));
        player.play(_player['playing'],function(){
            console.log('第一首歌播放完了') 
        });
    }
};

// 菜单
exports.menu = function(list) {

    if (list.length) {

        var menu = new List({ marker: '\033[36m› \033[0m', markerLength: 2 });

        _.each(list, function(item) {
            menu.add(item.channel_id, item.name);
        });

        menu.start();

        menu.on('keypress', function(key, cid) {

            if (key.name == 'return') {

                var pkg = require('./pkg').fetch(),
                    user = pkg.douban_account;

                if (cid == 0 && !user.token) {
                    console.log(color.red('请先设置豆瓣账户才能收听私人电台哦~'))
                    return false;
                };

                // 获取相应频道的信息
                exports.channel({
                    id: cid,
                    type: 'n'
                },user,function(songs){
                    // 加入播放列表开始播放
                    menu.stop();
                    console.log(color.green('正在播放『' + list[cid].name + '』...'));
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
            })
        }
    } else {
        exports.list(function(list){
            exports.menu(list);
        });
    }

}
var path = require('path'),
    async = require('async'),
    prompt = require('prompt'),
    consoler = require('consoler'),
    ffmetadata = require("ffmetadata"),
    Fm = require('./fm'),
    sdk = require('./sdk'),
    utils = require('./utils');

var promptSchema = {
    properties: {
        email: {
            description: 'Douban Email',
            type: 'string',
            pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            message: '电子邮箱格式有错误',
            required: true
        },
        password: {
            description: 'Douban Password',
            hidden: true,
            required: true
        }
    }
};

exports.ready = function() {
    return consoler.loading('正在加载...');
};

exports.config = function(fm) {
    prompt.start();
    prompt.get(promptSchema, function(err, result) {
        if (err) return consoler.error(err);
        fm.auth({
            email: result.email,
            password: result.password
        }, function(err, configs) {
            if (err) return consoler.error(err);
            var user = configs.account;
            consoler.success('欢迎你，' + user.user_name + '。您的豆瓣账户已经成功修改为：' + user.email);
            fm.init(exports.ready);
        });
    });
};

exports.home = function(fm, argv) {
    fm.configs(function(err, profile) {
        if (err) return consoler.error(err);
        var selected = argv[3];
        profile.home = selected || process.cwd();
        fm.configs(profile, function(err, pro) {
            if (err) return consoler.error(err);
            consoler.success('下载目录已成功修改为' + pro.home);
            var f = new Fm;
            return f.init(exports.ready);
        });
    });
};

exports.id3 = function(fm, argv) {
    
    var addid3 = function(song, callback) {
        if (!song.url) return callback(null);
        var id3 = {};
        id3.artist = song.artist;
        id3.title = song.title;
        id3.album = song.albumtitle;
        id3.date = song.public_time;
        id3.year = song.public_time;
        id3.publisher = song.company;
        ffmetadata.write(song.url, id3, callback);
    };

    fm.configs(function(err, profile) {
        if (err) return consoler.error(err);
        var userhome = utils.home();
        var home = profile.home || userhome;
        var history = path.join(userhome, '.douban.fm.history.json');
        var songs = [];
        sdk.local(home, history, function(err, list) {
            if (err) return consoler.error(err);
            list.forEach(function(song) {
                var keys = Object.keys(song);
                if (keys.length === 1 && keys[0] === 'url') return false;
                songs.push(song);
            });
            if (songs.length === 0) return consoler.error('没有歌曲符合条件');
            async.each(songs, addid3, function(err) {
                if (err) return consoler.error(err);
                return consoler.success('添加歌曲id3成功');
            });
        });
    });
}

exports.help = function() {
    console.log('');
    consoler.align(4);
    consoler.info('豆瓣电台命令行版帮助文档');
    return console.log([
        "",
        "更新豆瓣电台命令行版：",
        "$ [sudo] npm install douban.fm -g",
        "",
        "配置豆瓣账户密码：",
        "$ douban.fm config",
        "",
        "菜单快捷键：",
        "[return]      ->     播放另一个频道，或者重新播放当前频道 (PLAY)",
        "[backspace]   ->     停止播放当前歌曲或频道 (DELETE)",
        "[n]           ->     本频道列表的下一首歌曲 (NEXT)",
        "[l]           ->     添加到红心列表或者删除红心 (LOVE)",
        "[s]           ->     分享当前歌曲到新浪微博 (SHARE)",
        "[r]           ->     开启或关闭歌词，默认关闭歌词显示 (LRC)",
        "[g]           ->     跳转到当前播放歌曲的专辑页面 (GOTO)",
        "[r]           ->     切换歌词显示 (LRC)",
        "[q]           ->     退出豆瓣电台 (QUIT)",
        ""
    ].join('\n'));
};
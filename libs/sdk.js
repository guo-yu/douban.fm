var fs = require('fs'),
    path = require('path'),
    api = require('beer'),
    _ = require('underscore'),
    utils = require('./utils'),
    errors = require('./errors');

var privateMhz = {
    seq_id: -3,
    abbr_en: "",
    name: "红心兆赫",
    channel_id: -3,
    name_en: ""
}

// 模拟登录
exports.auth = function(account, callback) {
    api.post('http://www.douban.com/j/app/login', {
        form: {
            app_name: 'radio_desktop_win',
            version: 100,
            email: account.email.toString(),
            password: account.password.toString()
        }
    }, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (result.r == 0) return callback(null, result);
        return callback(errors[result.err]);
    });
};

// 获取频道曲目
exports.fetch = function(params, callback) {
    if (params && params.local) return exports.local(params.local, callback);
    var configs = {
        app_name: 'radio_desktop_win',
        version: 100,
        type: 'n'
    };
    api.get('http://douban.fm/j/app/radio/people', {
        query: _.extend(configs, params)
    }, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (result.r == 0) return callback(null, result.song, result);
        return callback(result.err);
    });
};

// 获取本地音乐信息
exports.local = function(dir, callback) {
    return fs.readdir(dir, function(err, songs) {
        if (err) return callback(err);
        if (!songs) return callback(new Error('没有找到本地音乐'));
        var list = [];
        utils.json(path.join(dir, '.history.json'), function(err, history) {
            if (err) return callback(new Error('没有找到本地音乐'));
            songs.forEach(function(song) {
                if (song.lastIndexOf('.mp3') !== (song.length - 4)) return false;
                if (!history[utils.sid(song)]) return false;
                var s = history[utils.sid(song)];
                s.url = path.resolve(dir, song);
                list.push(s);
            });
            if (list.length === 0) return callback(new Error('没有找到本地音乐'));
            return callback(null, list);
        });
    });
}

// 切换设置红心曲目
exports.love = function(params, callback) {
    exports.fetch(_.extend({
        type: 'r'
    }, params), callback);
};

// 获取频道列表
exports.channels = function(callback) {
    api.get('http://douban.fm/j/app/radio/channels', {}, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (!result.channels) return callback(new Error(result.err));
        return callback(null, [privateMhz].concat(result.channels));
    });
};

// 获取歌词
exports.lrc = function(title, artist, callback) {
    api.get('http://geci.me/api/lyric/' + title + '/' + artist, {}, function(err, result) {
        if (err) return callback(err);
        var songs = result.body;
        if (songs.count <= 0) return callback(songs.err);
        if (!songs.result) return callback(new Error('lrc not found'))
        if (!songs.result[0]) return callback(new Error('lrc not found'))
        if (!songs.result[0].lrc) return callback(new Error('lrc not found'))
        api.get(songs.result[0].lrc, {}, function(err, result) {
            if (err) return callback(err);
            return callback(null, result.body);
        });
    });
};
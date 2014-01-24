var api = require('beer'),
    _ = require('underscore'),
    errors = require('./errors');

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

// 切换设置红心曲目
exports.love = function(params, callback) {
    exports.fetch(_.extend({ type: 'r' }, params), callback);
};

// 获取频道列表
exports.channels = function(callback) {
    var privateHz = {
        seq_id: -3,
        abbr_en: "",
        name: "红心兆赫",
        channel_id: -3,
        name_en: ""
    };
    api.get('http://douban.fm/j/app/radio/channels', {}, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (!result.channels) return callback(new Error(result.err));
        return callback(null, [privateHz].concat(result.channels));
    });
};

// 获取歌词
// 获取歌词的速度或许太慢...
exports.lrc = function(title, artist, callback) {
    api.get('http://geci.me/api/lyric/' + title + '/' + artist, {}, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (result.count <= 0) return callback(result.err);
        var lrc = result.result[0].lrc;
        api.get(lrc, {}, function(err, result) {
            if (err) return callback(err);
            var result = result.body;
            return callback(result);
        });
    });
}

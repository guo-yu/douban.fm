var api = require('beer'),
    consoler = require('consoler'),
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
exports.channel = function(channel, user, callback) {
    var params = {
        app_name: 'radio_desktop_win',
        version: 100,
        channel: channel.id,
        type: channel.type
    };
    api.get('http://www.douban.com/j/app/radio/people', {
        query: user && _.isObject(user) ? _.extend(user, params) : params
    }, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (result.r == 0) return callback(null, result.song);
        return callback(result.err);
    });
};

// 获取频道列表
exports.list = function(callback) {
    api.get('http://www.douban.com/j/app/radio/channels', {}, function(err, result) {
        if (err) return callback(err);
        var result = result.body;
        if (result.channels && result.channels.length) return callback(null, result.channels);            
        callback(new Error(result.err));
    });
};

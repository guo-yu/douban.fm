var consoler = require('consoler'),
    api = require('beer'),
    _ = require('underscore');

var errorMap = {
    "invalidate_email": "抱歉，您的豆瓣帐号似乎出错了",
    "wrong_email": "抱歉，您的豆瓣帐号似乎出错了",
    "wrong_password": "抱歉，您的豆瓣密码似乎出错了"
};

exports.auth = function(account, callback) {
    api.post('http://www.douban.com/j/app/login', {
        form: {
            app_name: 'radio_desktop_win',
            version: 100,
            email: account.email.toString(),
            password: account.password.toString()
        }
    }, function(err, result) {
        if (!err) {
            var result = result.body;
            if (result.r == 0) {
                callback(null, result);
            } else {
                consoler.error(errorMap(result.err));
                callback(result.err);
            }
        } else {
            callback(err);
        }
    });
}

// 获取频道曲目
exports.channel = function(channel, user, callback) {
    var params = {
        app_name: 'radio_desktop_win',
        version: 100,
        channel: channel.id,
        type: channel.type
    };
    api.get('http://www.douban.com/j/app/radio/people', {
        query: user && _.isObject(user) ? _.extend(user,params) : params
    }, function(err, result) {
        if (!err) {
            var result = result.body;
            if (result.r == 0) {
                callback(null, result.song);
            } else {
                callback(result.err);
            }
        } else {
            callback(err);
        }
    });
}

// 获取频道列表
exports.list = function(callback) {
    api.get('http://www.douban.com/j/app/radio/channels', {}, function(err, result) {
        if (!err) {
            // 这里没有判断错误
            var result = result.body;
            if (result.channels && result.channels.length) {
                callback(null, result.channels);
            } else {
                console.log(result);
                callback(result.err);
            }
        } else {
            callback(err);
        }
    });
}
var request = require('request'),
    _ = require('underscore');

// get
exports.get = function(url, params,cb) {
    if (params != null && typeof(params) == 'object') {
        var url = url + '?';
        _.each(params,function(value,key){
            url = url + '&' + key + '=' + value
        });
    }
    console.log(url);
    request.get({
        url: url,
        json:true
    },function(error, response, body){
        if (!error && response.statusCode == 200) {
            cb(body)
        }
    })
}

// post
exports.post = function(url, params) {
    request.post({
        url: url,
        form: params
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            cb(body)
        }
    })
}
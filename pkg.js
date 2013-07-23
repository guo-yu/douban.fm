var fs = require('fs');

exports.fetch = function() {
    return JSON.parse(fs.readFileSync(__dirname + '/config.json'))
}

exports.set = function(obj) {    
    if (obj && typeof(obj) == 'object') {
        fs.writeFileSync( __dirname + '/config.json',JSON.stringify(obj));
        return obj;
    } else {
        return false;
    }
}
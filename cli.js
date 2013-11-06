var consoler = require('consoler'),
    optimist = require('optimist'),
    argv = optimist.argv,
    Fm = require('./index');
    
module.exports = function() {
    var home = argv.h ? argv.h : null;
    var argument = argv._ , fm = new Fm(home);
    if (argv.m) {
        if (argument.length == 1) {
            // account auth
            fm.auth({
                email: argv.m,
                password: argument[0]
            }, function(err, configs) {
                if (!err) {
                    var user = configs.account;
                    consoler.success('欢迎你，' + user.user_name + '。您的豆瓣账户已经成功修改为：' + user.email);
                    init();
                } else {
                    consoler.error(err);
                }
            })
        }
    } else {
        fm.init();
    }
}
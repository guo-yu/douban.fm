var consoler = require('consoler'),
    optimist = require('optimist'),
    argv = optimist.argv,
    Fm = require('./fm');

exports = module.exports = function() {
    var home = argv.h ? argv.h : null;
    var argument = argv._,
        fm = new Fm(home);
    if (!argv.m) return fm.init();
    if (argument.length != 1) return consoler.error('请输入正确的豆瓣电台账户密码，以空格分割');
    fm.auth({
        email: argv.m,
        password: argument[0]
    }, function(err, configs) {
        if (err) return consoler.error(err);
        var user = configs.account;
        consoler.success('欢迎你，' + user.user_name + '。您的豆瓣账户已经成功修改为：' + user.email);
        fm.init();
    });
};

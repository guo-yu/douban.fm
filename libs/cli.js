var consoler = require('consoler'),
    prompt = require('prompt'),
    sys = require('../package'),
    Fm = require('./fm');

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

var actions = {
    ready: function() {
        consoler.loading('正在加载...');
    },
    config: function(fm) {
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
                fm.init(actions.ready);
            });
        });
    },
    help: function() {
        console.log('');
        consoler.align(4);
        consoler.info('欢迎使用豆瓣电台命令行版 v' + sys.version);
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
            "[g]           ->     跳转到当前播放歌曲的专辑页面 (GOTO)",
            "[q]           ->     退出豆瓣电台 (QUIT)",
            ""
            ].join('\n')
        );
    }
};

exports = module.exports = function() {
    var command = process.argv[2],
        fm = new Fm();
    if (!command) return fm.init(actions.ready);
    if (!actions[command] || command === 'ready') return actions.help();
    return actions[command](fm);
};

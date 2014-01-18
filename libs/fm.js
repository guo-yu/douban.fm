var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    mkdirp = require('mkdirp'),
    Player = require('player'),
    color = require('colorful'),
    List = require('term-list'),
    printf = require('sprintf').sprintf,
    params = require('paramrule'),
    consoler = require('consoler'),
    exeq = require('exeq'),
    sys = require('../package'),
    sdk = require('./sdk'),
    utils = require('./utils'),
    errors = require('./errors');

var shorthands = {
    'return': 'play',
    'backspace': 'stop',
    'g': 'go',
    'l': 'loving',
    'n': 'next',
    'q': 'quit',
    's': 'share'
};

var Fm = function(params) {
    this.home = params && params.home ? params.home : path.join(utils.home(), 'douban.fm');
    this.love = path.join(this.home, 'love');
    this.shorthands = shorthands;
};

Fm.prototype.play = function(channel, user) {
    
    var self = this,
        account = user && user.account ? user.account : {},
        privateHz = (channel.channel_id == 0 || channel.channel_id == -3) && !account.token;

    // 检查是否是私人兆赫，如果没有设置账户直接返回
    if (privateHz) return self.update(channel.index, color.yellow(errors.account_missing));
    if (self.status === 'fetching' || self.status === 'downloading') return false;
    if (self.status === 'playing') {
        if (typeof(self.channel) != undefined) self.update(self.channel, '');
        self.player.stop();
        self.player.status = 'stoped';
        self.player = null;
    }

    self.clear(-1, color.yellow('||'));
    self.clear(-1, color.yellow('>>'));
    self.channel = channel.index;
    self.status = 'fetching';
    self.update(channel.index, color.grey('加载列表中，请稍等...'));

    // 获取相应频道的曲目
    sdk.fetch({
        channel: channel.channel_id,
        user_id: account.user_id,
        expire: account.expire,
        token: account.token,
        kbps: 192
    }, function(err, songs, result) {
        if (err) return self.update(channel.index, color.red(err.toString()));
        if (result && !result.warning) self.label(-1, color.inverse(' PRO '));
        self.status = 'ready';
        self.player = new Player(songs, {
            srckey: 'url',
            downloads: self.home
        });
        self.player.play();
        // 同步下载不太好，但是在解决 stream 的无法获取抛错之前没有好办法
        self.player.on('downloading', function(url) {
            self.status = 'downloading';
            self.update(channel.index, color.grey('下载歌曲中，请稍等...'));
        });
        // 更新歌单
        self.player.on('playing', function(song) {
            self.status = 'playing';
            self.label(-1, color.yellow('>>'));
            self.update(
                channel.index,
                printf(
                    '%s %s %s %s %s %s %s %s',
                    song.like == 1 ? color.red('♥') : color.grey('♥'),
                    color.green(song.title),
                    color.grey(song.kbps + 'kbps'),
                    color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
                    color.yellow(song.albumtitle),
                    color.grey('•'),
                    song.artist,
                    color.grey(song.public_time)
                )
            );
            if (song._id < self.player.list.length - 1) return false;
            self.status = 'switching';
            return sdk.fetch({
                channel: channel.channel_id,
                user_id: account.user_id,
                expire: account.expire,
                token: account.token,
                kbps: 192
            }, function(err, songs) {
                if (err) return false;
                // 没有对尝试获取列表失败进行处理，如果失败2次，则不会再播放任何歌曲
                if (!songs) return false;
                return songs.forEach(function(s, index) {
                    s._id = self.player.list.length;
                    self.player.add(s);
                });
            });
        });
    });
}

Fm.prototype.loving = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    if (!user || !user.account) return false;
    var self = this;
    var account = user && user.account ? user.account : {};
    var song = self.player.playing;
    var query = {
        sid: song.sid,
        channel: self.channel,
        user_id: account.user_id,
        expire: account.expire,
        token: account.token
    };
    if (song.like) query.type = 'u';
    self.label(-1, '正在加载...');
    sdk.love(query, function(err, result) {
        var tips = !(song.like) ? color.red('♥') : color.grey('♥');
        if (err) tips = color.red('x');
        if (!err) self.player.playing.like = !song.like;
        // TODO: 这里有冗余代码
        self.clear(-1, '正在加载...');
        return self.update(
            self.channel,
            printf(
                '%s %s %s %s %s %s %s %s',
                tips,
                color.green(song.title),
                color.grey(song.kbps + 'kbps'),
                color.grey('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'),
                color.yellow(song.albumtitle),
                color.grey('•'),
                song.artist,
                color.grey(song.public_time)
            )
        );
    });
}

Fm.prototype.next = function() {
    if (!this.player) return false;
    return this.player.next();
}

Fm.prototype.stop = function() {
    if (!this.player) return false;
    this.clear(-1, color.yellow('>>'));
    this.label(-1, color.yellow('||'));
    return this.player.stop();
}

Fm.prototype.quit = function() {
    return process.exit();
}

Fm.prototype.label = function(index, banner) {
    if (!this.menu) return false;
    var original = this.menu.at(index + 2).label;
    if (original.indexOf(banner) > -1) return false;
    this.menu.at(index + 2).label = original + ' ' + banner;
    return this.redraw();
}

Fm.prototype.update = function(index, banner) {
    if (!this.menu) return false;
    if (!this.channels[index]) return this.label(index, banner);
    this.menu.at(index + 2).label = this.channels[index].name + ' ' + banner;
    return this.redraw();
}

Fm.prototype.clear = function(index, banner) {
    if (!this.menu) return false;
    var item = this.menu.at(index + 2);
    if (item.label.indexOf(banner) === -1) return false;
    item.label = item.label.substr(0, item.label.indexOf(' ' + banner));
    return this.redraw();
}

Fm.prototype.redraw = function() {
    if (!this.menu) return false;
    this.menu.draw();
    return false;
}

Fm.prototype.album = function(link) {
    if (!link) return false;
    return link.indexOf('http') === -1 ? 'http://music.douban.com' + link : link;
}

Fm.prototype.go = function(channel, user, link) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    return exeq(['open ' + (link ? link : this.album(this.player.playing.album))]).run();
}

Fm.prototype.share = function(channel, user) {
    if (!this.player) return false;
    if (!this.player.playing) return false;
    var self = this;
    var song = self.player.playing;
    return self.go(null, null,
        'http://service.weibo.com/share/share.php?' +
        '&type=button' +
        '&style=number' +
        '&appkey=5rjNpN' + // api key guoyu.me: [1kf7C9] douban.fm: [5rjNpN]
        '&ralateUid=1644105187' + // related uid @guoyu
        '&url=' +
        sys.repository.url +
        '&pic=' +
        (song.picture ? song.picture.replace('mpic','lpic') : '') +
        '%7C%7C' +
        'http://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg' +
        '&title=' +
        encodeURIComponent(
            [
                user && user.account ? user.account.user_name : '',
                '正在使用豆瓣电台命令行版 v' + sys.version + ' 收听 ',
                song.like ? '[心]' : '',
                song.title,
                song.kbps + 'kbps',
                '... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...',
                song.albumtitle,
                '•',
                song.artist,
                song.public_time,
                self.album(song.album)
            ].join(' ')
        )
    );
}

Fm.prototype.createMenu = function(callback) {
    var self = this;
    var shorthands = self.shorthands;
    sdk.channels(function(err, list) {
        if (err) return consoler.error('获取豆瓣电台频道出错，请稍后再试');
        self.configs(function(err, user) {
            // init menu
            self.channels = {};
            self.menu = new List({
                marker: '\033[36m› \033[0m',
                markerLength: 2
            });
            // add padding-top
            self.menu.add(-2, '');
            // add logo
            self.menu.add(-1, printf(
                '%s %s %s',
                color.yellow('Douban FM'),
                color.grey('v' + sys.version),
                user && user.account && user.account.user_name ?
                color.grey('/ ' + user.account.user_name) :
                ''
            ));
            // add channels
            _.each(list, function(channel, index) {
                if (index > 15) return false; // 屏幕里放不下那么多电台的 -,-||
                channel.index = index;
                self.menu.add(index, channel.name);
                self.channels[index] = channel;
            });
            // start menu
            self.menu.start();
            self.menu.select(-1);
            // bind events
            self.menu.on('keypress', function(key, index) {
                if (!shorthands[key.name]) return false;
                if (index < 0 && key.name != 'q') return exeq(['open ' + sys.repository.url]).run();
                return self[shorthands[key.name]](self.channels[index], user);
            });
            self.menu.on('empty', function() {
                menu.stop();
            });
        });
    });
    if (callback && typeof(callback) === 'function') return callback();
};

Fm.prototype.auth = function(params, callback) {
    var self = this;
    sdk.auth(params, function(err, user) {
        if (err) return callback(err);
        self.configs({
            account: {
                email: user.email,
                token: user.token,
                expire: user.expire,
                user_name: user.user_name,
                user_id: user.user_id
            }
        }, callback);
    });
};

Fm.prototype.configs = function() {
    var self = this;
    params.parse(arguments, ['', '*'], function(params, callback) {
        if (!params) {
            // read configs
            fs.readFile(path.join(self.home, '.configs.json'), function(err, data) {
                if (err) return callback(err, null);
                try {
                    callback(err, JSON.parse(data));
                } catch (err) {
                    callback(err);
                }
            });
        } else {
            // save params
            fs.writeFile(path.join(self.home, '.configs.json'), JSON.stringify(params), function(err) {
                callback(err, params);
            });
        }
    });
};

// init player
Fm.prototype.init = function(callback) {
    var self = this;
    fs.exists(self.home, function(exist) {
        if (exist) return self.createMenu(callback);
        mkdirp(self.love, function(err) {
            if (err) return consoler.error('创建歌曲文件夹出错，请检查权限');
            return self.createMenu(callback);
        });
    })
};

Fm.prototype.sdk = sdk;

exports = module.exports = Fm;

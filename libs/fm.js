var fs = require('fsplus');
var path = require('path');
var geci = require('geci');
var mkdirp = require('mkdirp');
var Player = require('player');
var color = require('colorful');
var consoler = require('consoler');
var termList = require('term-list-enhanced');
var sdk = require('./sdk');
var utils = require('./utils');
var pkg = require('../package');
var template = require('./template');

// the keypress shortcut list
var shorthands = {
  'return': 'play',
  'backspace': 'stop',
  'g': 'go',
  'l': 'loving',
  'n': 'next',
  'q': 'quit',
  's': 'share',
  'r': 'showLrc'
};

var errors = {
  'account_missing': '请先设置豆瓣账户再收听私人/红心兆赫: $ douban.fm config'
};

module.exports = Fm;

function Fm() {
  this.rc = {};
  this.syshome = utils.home();
  this.rc.profile = path.join(this.syshome, '.douban.fm.profile.json');
  this.rc.history = path.join(this.syshome, '.douban.fm.history.json');
  this.home = utils.readJSON(this.rc.profile).home || path.join(this.syshome, 'douban.fm');
  this.love = path.join(this.home, 'love');
  this.isShowLrc = false;
  mkdirp.sync(this.love); // ensure dir exists
  template.updateTab('Douban FM');
};

/**
*
* Fetch songs and add them to playlist
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.fetch = function(channel, account, callback) {
  var self = this;
  return sdk.songs({
    kbps: 192,
    token: account.token,
    history: self.rc.history,
    channel: channel.channel_id,
    user_id: account.user_id,
    expire: account.expire,
    local: (channel.channel_id == -99) ? self.home : false
  }, utils.isFunction(callback) ? callback : cb);

  function cb(err, songs, result) {
    if (err) return;
    if (!songs || songs.length === 0) return;
    if (!self.player) return;
    songs.forEach(function(song) {
      self.player.add(song);
    });
  }
}

/**
*
* Playing songs when everything is ready
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.play = function(channel, account) {
  var self = this;
  var menu = self.menu;
  var privateMhz = (channel.channel_id == 0 || channel.channel_id == -3) && !account.token;

  // Check if this kind of mHz is private
  if (privateMhz) return menu.update(channel.index, color.yellow(errors.account_missing));
  if (self.status === 'fetching' || self.status === 'downloading') return false;
  if (self.status === 'playing') {
    if (typeof(self.channel) != undefined) menu.clear(self.channel);
    self.player.stop();
    delete self.player;
  }

  // clear label status
  menu.clear(0);
  self.channel = channel.index;
  self.status = 'fetching';
  menu.update(channel.index, template.listing());

  // start fetching songs
  self.fetch(channel, account, function(err, songs, result) {
    if (err) return menu.update(channel.index, color.red(err.toString()));
    // mark PRO account on logo
    if (result && !result.warning) menu.update(0, color.inverse(' PRO '));
    self.status = 'ready';
    self.player = new Player(songs, {
      src: 'url',
      cache: true,
      downloads: self.home
    });
    self.player.play();
    self.player.on('downloading', function(url) {
      self.status = 'downloading';
      menu.update(channel.index, template.loading());
    });
    // update template
    self.player.on('playing', function(song) {
      var isValidSong = song.title && song.sid;
      self.status = 'playing';
      // update playing label
      menu.update(0, color.yellow('>>'));
      // update song infomation
      menu.update(channel.index, template.song(song));
      // logging songs history
      if (isValidSong) {
        var updates = {};
        updates[song.sid] = song;
        try {
          fs.updateJSON(this.rc.history, updates);
        } catch (err) {
          // error must be logged in a private place.
        }
      }
      // print LRC if needed.
      if (self.isShowLrc) {
        if (self.lrc) self.lrc.stop();
        geci.fetch(song, function(err, lrc) {
          if (err) return menu.update(0, color.grey('抱歉, 没找到歌词'));
          if (!lrc) return menu.update(0, color.grey('抱歉, 没找到歌词'));
          self.lrc = geci.print(lrc, function(line, extra) {
            menu.update( channel.index, template.song(song, line));
          });
        });
      }
      // 没有对尝试获取列表失败进行处理，如果失败2次，则不会再播放任何歌曲
      if (song._id < self.player.list.length - 1) return false;
      return self.fetch(channel, account);
    });
  });
}

/**
*
* Add current song to lovelist when pressing `L`
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.loving = function(channel, account) {
  if (!this.player) return false;
  if (!this.player.playing) return false;
  if (!this.player.playing.sid) return this.menu.update(0, '未知曲目无法加心');
  if (!account) return false;
  var self = this;
  var menu = self.menu;
  var song = self.player.playing;
  var query = {
    sid: song.sid,
    channel: self.channel,
    user_id: account.user_id,
    expire: account.expire,
    token: account.token
  };
  if (song.like) query.type = 'u';
  menu.update(0, '正在加载...');
  sdk.love(query, function(err, result) {
    menu.clear(0);
    if (err) menu.update(0, '出错了, 请稍后再试...');
    if (!err) self.player.playing.like = !song.like;
    return menu.update(
      self.channel,
      template.song(self.player.playing)
    );
  });
}

/**
*
* Play the next song in the playlist
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.next = function(channel, account) {
  if (!this.player) return false;
  return this.player.next(function(err, song) {
    if (err) menu.update(0, color.yellow('这是最后一首了哦，回车以加载最新列表'));
    return false;
  });
}

/**
*
* Stop playing
* and show the stopped status on logo.
*
**/
Fm.prototype.stop = function() {
  if (!this.player) return false;
  var menu = this.menu;
  menu.clear(0);
  menu.update(0, template.pause());
  return this.player.stop();
}

/**
*
* Quit the Fm
* and kill the process when pressing `Q`
*
**/
Fm.prototype.quit = function() {
  this.menu.stop();
  return process.exit();
}

/**
*
* Goto the music album page when pressing `G`
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.go = function(channel, account) {
  if (!this.player) return false;
  if (!this.player.playing) return false;
  if (channel.channel_id == -99) return false;
  return utils.go(utils.album(this.player.playing.album));
}

/**
*
* Show lrc when when pressing `R`.
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.showLrc = function(channel, account) {
  if (channel.channel_id == -99) return false;
  this.isShowLrc = !!!this.isShowLrc;
  this.menu.clear(0);
  this.menu.update(0, this.isShowLrc ? '歌词开启' : '歌词关闭');
  return false;
}

/**
*
* Share the current playing songs to Weibo when pressing `S`.
* @channel[Object]
* @account[Object]
*
**/
Fm.prototype.share = function(channel, account) {
  if (!this.player || !this.player.playing) return false;
  return utils.go(template.share(this.player.playing));
}

/**
*
* Create command line interface menu
* using term-list-enhanced module
* @callback[Function]: the callback function when set down.
*
**/
Fm.prototype.createMenu = function(callback) {
  var self = this;
  // fetch channels
  sdk.fm.channels({}, function(err, list) {
    if (err) consoler.error('获取豆瓣电台频道出错，切换为本地电台...');
    // fetch configs, show user's infomations
    fs.readJSON(self.rc.profile, function(e, user) {
      var vaildAccount = user && user.account && user.account.user_name;
      var account = vaildAccount ? user.account : null;
      // init menu
      self.menu = new termList();
      var nav = [template.logo(account), sdk.mhz.localMhz, sdk.mhz.privateMhz];
      self.menu.adds(nav.concat(!err ? list : []));
      // bind keypress events
      self.menu.on('keypress', function(key, index) {
        if (!shorthands[key.name]) return false;
        if (index < 1 && key.name != 'q') return utils.go(pkg.repository.url);
        return self[shorthands[key.name]](self.menu.items[index], account);
      });
      self.menu.on('empty', function() {
        self.menu.stop();
      });
      // start menu at line 2 (below the logo text)
      self.menu.start(1);
    });
  });
  // callback if necessary.
  return callback && callback();
}

/**
*
* Init douban.fm command line interface.
* @callback [Function]: the callback function when all set done
*
**/
Fm.prototype.init = function(callback) {
  var self = this;
  fs.exists(self.home, function(exist) {
    if (exist) return self.createMenu(callback);
    mkdirp(self.love, function(err) {
      if (err) return consoler.error('创建歌曲文件夹出错，请检查权限');
      return self.createMenu(callback);
    });
  });
}
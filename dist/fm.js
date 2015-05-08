'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _fs = require('fsplus');

var _fs2 = _interopRequireWildcard(_fs);

var _path = require('path');

var _path2 = _interopRequireWildcard(_path);

var _open = require('open');

var _open2 = _interopRequireWildcard(_open);

var _home = require('home');

var _home2 = _interopRequireWildcard(_home);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireWildcard(_mkdirp);

var _Player = require('player');

var _Player2 = _interopRequireWildcard(_Player);

var _color = require('colorful');

var _color2 = _interopRequireWildcard(_color);

var _consoler = require('consoler');

var _consoler2 = _interopRequireWildcard(_consoler);

var _termList = require('term-list-enhanced');

var _termList2 = _interopRequireWildcard(_termList);

var _sdk = require('./sdk');

var _sdk2 = _interopRequireWildcard(_sdk);

var _utils = require('./utils');

var _utils2 = _interopRequireWildcard(_utils);

var _pkg = require('../package');

var _pkg2 = _interopRequireWildcard(_pkg);

var _errors = require('./errors');

var _errors2 = _interopRequireWildcard(_errors);

var _template = require('./template');

var _template2 = _interopRequireWildcard(_template);

// Keypress shortcut list
var shorthands = {
  'return': 'play',
  backspace: 'stop',
  g: 'go',
  l: 'loving',
  n: 'next',
  q: 'quit',
  s: 'share',
  r: 'showLrc'
};

// Class Douban.fm

var FM = (function () {
  function FM() {
    _classCallCheck(this, FM);

    // Fetch user's home
    this.USERHOME = _home2['default']();

    // Resolve config files' path
    this.path = {};
    this.path.profile = _home2['default'].resolve('~/.douban.fm.profile.json');
    this.path.history = _home2['default'].resolve('~/.douban.fm.history.json');

    // Read configs from JSON files
    try {
      this.profile = _fs2['default'].readJSON(this.path.profile);
    } catch (err) {}

    // Get music download folder as `this.home`
    this.home = this.profile && this.profile.home ? this.profile.home : _home2['default'].resolve('~/douban.fm');

    // Get favourite music download folder
    this.love = _path2['default'].join(this.home, 'love');

    // Get `http_proxy` options
    this.http_proxy = this.profile ? this.profile.http_proxy : null;

    // Disable Lrc by default
    this.isShowLrc = false;

    // Update UI
    _template2['default'].updateTab('Douban FM');

    // Ensure music download folder exists,
    // If not, Mkdir of it.
    try {
      _mkdirp2['default'].sync(this.love);
    } catch (err) {
      _consoler2['default'].error(_errors2['default'].setup_fail);
      throw err;
    }
  }

  _createClass(FM, [{
    key: 'init',

    /**
    *
    * Init douban.fm command line interface.
    * @param {Function} callback [The callback function when all set done]
    *
    **/
    value: function init(callback) {
      var _this = this;

      _fs2['default'].exists(self.home, function (exist) {
        if (exist) return _this.createMenu(callback);

        _mkdirp2['default'](_this.love, function (err) {
          if (err) return _consoler2['default'].error(_errors2['default'].mkdir_fail);

          return _this.createMenu(callback);
        });
      });
    }
  }, {
    key: 'fetch',

    /**
     * [Fetch songs and add them to playlist]
     * @param  {Object}   channel 
     * @param  {Object}   account 
     * @param  {Function}   callback
     * @return {Object}           
     */
    value: function fetch(channel, account, callback) {
      var self = this;

      var query = {
        kbps: 192,
        history: self.path.history,
        channel: channel.channel_id,
        local: isChannel('local', channel.channel_id) ? self.home : false };

      // Replce this block with fn.merge()
      if (account) {
        query.token = account.token;
        query.user_id = account.user_id;
        query.expire = account.expire;
      }

      return _sdk2['default'].songs(query, _utils2['default'].isFunction(callback) ? callback : cb);

      function cb(err, songs, result) {
        if (err) {
          return;
        }if (!songs || songs.length === 0) {
          return;
        }if (!self.player) {
          return;
        }songs.forEach(self.player.add);
      }
    }
  }, {
    key: 'createMenu',

    /**
    *
    * [Create command line interface menu]
    * [Using term-list-enhanced module]
    * @param {Function} callback [The callback function when all set done]
    *
    **/
    value: function createMenu(callback) {
      var _this2 = this;

      // Fetch channels
      _sdk2['default'].fm.channels(function (err, list) {
        if (err) _consoler2['default'].error(_errors2['default'].turn_to_local_mode);

        // Fetch configs, Show user's infomation
        _fs2['default'].readJSON(_this2.path.profile, function (e, user) {
          var vaildAccount = user && user.account && user.account.user_name;
          var account = vaildAccount ? user.account : null;

          // Init menu
          _this2.menu = new _termList2['default']();
          _this2.menu.header(_template2['default'].logo(account));
          _this2.menu.adds([_sdk2['default'].mhz.localMhz].concat(!err ? [_sdk2['default'].mhz.privateMhz].concat(list) : []));

          // Bind keypress events
          _this2.menu.on('keypress', function (key, index) {
            if (!shorthands[key.name]) return false;

            return _this2[shorthands[key.name]](_this2.menu.items[index], account);
          });

          _this2.menu.on('empty', function () {
            _this2.menu.stop();
          });

          // Check last played channel,
          // If it existed, play this channel instantly.
          if (user && user.lastChannel) {
            _this2.play(user.lastChannel, account);
            _this2.menu.start(user.lastChannel.index);
            return false;
          }

          // Start menu at line 2,
          // Which below the logo.
          _this2.menu.start(1);
        });
      });

      // Trigger callback if necessary.
      return callback && callback();
    }
  }, {
    key: 'play',

    /**
     * [Playing songs when everything is ready]
     * @param  {Object} channel 
     * @param  {Object} account 
     * @return {}         
     */
    value: function play(channel, account) {
      var _this3 = this;

      var self = this;
      var menu = this.menu;
      var isVaildAccount = account && account.token;
      var privateMhz = isChannel('private', channel.channel_id) && !isVaildAccount;

      // Check if this kind of mHz is private
      if (privateMhz) {
        return menu.update('header', _errors2['default'].account_missing);
      } // Clear last label
      if (this.status === 'fetching' || this.status === 'downloading') {
        return;
      }if (this.status === 'playing' || this.status === 'error') {
        if (typeof this.channel != undefined) menu.clear(this.channel);

        if (this.player) {
          this.player.stop();
          delete this.player;
        }
      }

      // Clear label status
      menu.clear('header');
      this.channel = channel.index;
      this.status = 'fetching';
      menu.update(channel.index, _template2['default'].listing());

      try {
        _fs2['default'].updateJSON(this.path.profile, { lastChannel: channel });
      } catch (err) {};

      // Start fetching songs
      this.fetch(channel, account, function (err, songs, result) {
        if (err) {
          _this3.status = 'error';
          return menu.update(channel.index, _color2['default'].red(err.toString()));
        }

        // Mark a `PRO` label on logo
        if (result && !result.warning) menu.update('header', _color2['default'].inverse(' PRO '));

        _this3.status = 'ready';
        _this3.player = new _Player2['default'](songs, {
          src: 'url',
          cache: true,
          downloads: _this3.home,
          http_proxy: _this3.http_proxy
        });

        _this3.player.play();
        _this3.player.on('downloading', onDownloading);
        _this3.player.on('playing', onPlaying);

        function onDownloading(url) {
          self.status = 'downloading';
          menu.update(channel.index, _template2['default'].loading());
        }

        function onPlaying(song) {
          var isValidSong = song.title && song.sid;
          self.status = 'playing';
          // Update playing label
          menu.update('header', _color2['default'].green('>'));
          // Update song infomation
          menu.update(channel.index, _template2['default'].song(song));
          // Logging songs history
          if (isValidSong) {
            var updates = {};
            updates[song.sid] = song;
            try {
              _fs2['default'].updateJSON(self.path.history, updates);
            } catch (err) {}
          }

          // Print LRC if needed.
          if (self.isShowLrc) {
            var printLrc = function (err, lrc) {
              if (err) return menu.update('header', _color2['default'].grey(_errors2['default'].lrc_notfound + err.toString()));
              if (!lrc) return menu.update('header', _color2['default'].grey(_errors2['default'].lrc_notfound));

              self.lrc = geci.print(lrc, function (line, extra) {
                menu.update(channel.index, _template2['default'].song(song, line));
              });
            };

            if (self.lrc) self.lrc.stop();

            geci.fetch(song, printLrc);
          }

          // TODO: Still trying after failed two times.
          if (song._id < self.player.list.length - 1) {
            return false;
          }return self.fetch(channel, account);
        }
      });
    }
  }, {
    key: 'next',

    /**
    *
    * Play the next song in the playlist
    * @param channel {Object}
    * @param account {Object}
    *
    **/
    value: function next(channel, account) {
      var _this4 = this;

      if (!this.player) {
        return;
      }this.player.next(function (err, song) {
        if (err) _this4.menu.update('header', _errors2['default'].last_song);

        return;
      });
    }
  }, {
    key: 'stop',

    /**
    *
    * [Stop playing]
    * [And show the stopped status on logo.]
    * @param channel {Object}
    * @param account {Object}
    *
    **/
    value: function stop(channel, account) {
      if (!this.player) {
        return;
      }if (this.status === 'stopped') {
        return this.play(channel, account);
      }var menu = this.menu;
      menu.clear('header');
      menu.update('header', _template2['default'].pause());
      this.status = 'stopped';

      return this.player.stop();
    }
  }, {
    key: 'loving',

    /**
    *
    * [Add current song to lovelist when pressing `L`]
    * @param channel {Object}
    * @param account {Object}
    *
    **/
    value: function loving(channel, account) {
      if (!this.player) {
        return;
      }if (!this.player.playing) {
        return;
      }if (!this.player.playing.sid) {
        return this.menu.update('header', _errors2['default'].love_fail);
      }if (!account) {
        return this.menu.update('header', _errors2['default'].account_missing);
      }var self = this;
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

      menu.update('header', '正在加载...');

      _sdk2['default'].love(query, function (err, result) {
        menu.clear('header');

        if (err) menu.update('header', _errors2['default'].normal);
        if (!err) self.player.playing.like = !song.like;

        return menu.update(self.channel,
        // keep silence, do not notify
        _template2['default'].song(self.player.playing, null, true));
      });
    }
  }, {
    key: 'showLrc',

    /**
    *
    * [Show lrc when when pressing `R`]
    * @param channel {Object}
    * @param account {Object}
    *
    **/
    value: function showLrc(channel, account) {
      if (channel.channel_id == -99) {
        return;
      }this.isShowLrc = !!!this.isShowLrc;
      this.menu.clear('header');
      this.menu.update('header', this.isShowLrc ? '歌词开启' : '歌词关闭');

      return false;
    }
  }, {
    key: 'go',

    /**
    *
    * [Goto the music album page when pressing `G`]
    * @param {Object} channel
    * @param {Object} account
    *
    **/
    value: function go(channel, account) {
      if (!this.player || !this.player.playing) {
        return;
      }if (channel.channel_id == -99) {
        return;
      }return _open2['default'](_utils2['default'].album(this.player.playing.album));
    }
  }, {
    key: 'share',

    /**
    *
    * [Share the current playing songs to Weibo when pressing `S`]
    * @param channel {Object}
    * @param account {Object}
    *
    **/
    value: function share(channel, account) {
      if (!this.player || !this.player.playing) {
        return false;
      }return _open2['default'](_template2['default'].share(this.player.playing));
    }
  }, {
    key: 'quit',

    /**
    *
    * [Quit the FM]
    * [And kill the process when pressing `Q`]
    *
    **/
    value: function quit() {
      this.menu.stop();
      return process.exit();
    }
  }]);

  return FM;
})();

exports['default'] = FM;

/**
 * [Check if a object is channel object]
 * @param  {String}  alias [The channel type]
 * @param  {Int}     id    [The channel ID]
 * @return {Boolean}
 */
function isChannel(alias, id) {
  if (alias === 'local' && id == -99) {
    return true;
  }if (alias === 'private' && (id == 0 || id == -3)) {
    return true;
  }return false;
}
module.exports = exports['default'];

// Ingore missing profile

// Errors must be logged in a private place.
//# sourceMappingURL=fm.js.map
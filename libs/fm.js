import fs from 'fsplus'
import path from 'path'
import geci from 'geci'
import open from 'open'
import home from 'home'
import mkdirp from 'mkdirp'
import Player from 'player'
import color from 'colorful'
import consoler from 'consoler'
import termList from 'term-list-enhanced'

import sdk from './sdk'
import utils from './utils'
import pkg from '../package'
import errors from './errors'
import template from './template'

// Keypress shortcut list
var shorthands = {
  'return': 'play',
  'backspace': 'stop',
  'g': 'go',
  'l': 'loving',
  'n': 'next',
  'q': 'quit',
  's': 'share',
  'r': 'showLrc'
}

// Class Douban.fm
exports default class FM {
  constructor() {
    // Fetch user's home
    this.USERHOME = home();

    // Resolve config files' path
    this.path = {};
    this.path.profile = home.resolve('~/.douban.fm.profile.json');
    this.path.history = home.resolve('~/.douban.fm.history.json');

    // Read configs from JSON files
    try {
      this.profile = fs.readJSON(this.path.profile);
    } catch (err) {
      // Ingore missing profile
    }

    // Get music download folder as `this.home`
    this.home = this.profile && this.profile.home ?
      this.profile.home :
      home.resolve('~/douban.fm');

    // Get favourite music download folder
    this.love = path.join(this.home, 'love');

    // Get `http_proxy` options
    this.http_proxy = this.profile ?
      this.profile.http_proxy :
      null;

    // Disable Lrc by default
    this.isShowLrc = false;

    // Update UI
    template.updateTab('Douban FM');

    // Ensure music download folder exists,
    // If not, Mkdir of it.
    try {
      mkdirp.sync(this.love);
    } catch (err) {
      consoler.error(errors.setup_fail);
      throw err;
    }
  }

  /**
  *
  * Init douban.fm command line interface.
  * @param {Function} callback [The callback function when all set done]
  *
  **/
  init(callback) {
    fs.exists(self.home, (exist) => {
      if (exist)
        return this.createMenu(callback)

      mkdirp(this.love, (err) => {
        if (err)
          return consoler.error(errors.mkdir_fail);

        return this.createMenu(callback)
      })
    })
  }

  /**
   * [Fetch songs and add them to playlist]
   * @param  {Object}   channel 
   * @param  {Object}   account 
   * @param  {Function}   callback
   * @return {Object}           
   */
  fetch(channel, account, callback) {
    var self = this;

    var query = {
      kbps: 192,
      history: self.path.history,
      channel: channel.channel_id,
      local: isChannel('local', channel.channel_id) ? self.home : false,
    }

    // Replce this block with fn.merge()
    if (account) {
      query.token = account.token
      query.user_id = account.user_id
      query.expire = account.expire
    }

    return sdk.songs(
      query, 
      utils.isFunction(callback) ? callback : cb
    )

    function cb(err, songs, result) {
      if (err) 
        return
      if (!songs || songs.length === 0) 
        return
      if (!self.player) 
        return

      songs.forEach(self.player.add)
    }
  }

  /**
  *
  * [Create command line interface menu]
  * [Using term-list-enhanced module]
  * @param {Function} callback [The callback function when all set done]
  *
  **/
  createMenu(callback) {
    // Fetch channels
    sdk.fm.channels((err, list) => {
      if (err)
        consoler.error(errors.turn_to_local_mode)

      // Fetch configs, Show user's infomation
      fs.readJSON(this.path.profile, (e, user) => {
        var vaildAccount = user && user.account && user.account.user_name
        var account = vaildAccount ? user.account : null

        // Init menu
        this.menu = new termList()
        this.menu.header(template.logo(account))
        this.menu.adds(
          [sdk.mhz.localMhz].concat(!err ? [sdk.mhz.privateMhz].concat(list) : [])
        )

        // Bind keypress events
        this.menu.on('keypress', (key, index) => {
          if (!shorthands[key.name]) 
            return false;

          return this[shorthands[key.name]](this.menu.items[index], account)
        })

        this.menu.on('empty', () => {
          this.menu.stop()
        })

        // Check last played channel,
        // If it existed, play this channel instantly.
        if (user && user.lastChannel) {
          this.play(user.lastChannel, account)
          this.menu.start(user.lastChannel.index)
          return false
        }

        // Start menu at line 2,
        // Which below the logo.
        this.menu.start(1)
      })
    })

    // Trigger callback if necessary.
    return callback && callback();
  }

  /**
   * [Playing songs when everything is ready]
   * @param  {Object} channel 
   * @param  {Object} account 
   * @return {}         
   */
  play(channel, account) {
    var self = this
    var menu = this.menu
    var isVaildAccount = account && account.token
    var privateMhz = isChannel('private', channel.channel_id) && !isVaildAccount

    // Check if this kind of mHz is private
    if (privateMhz)
      return menu.update('header', errors.account_missing)

    // Clear last label
    if (this.status === 'fetching' || this.status === 'downloading')
      return

    if (this.status === 'playing' || this.status === 'error') {
      if (typeof(this.channel) != undefined) 
        menu.clear(this.channel)

      if (this.player) {
        this.player.stop()
        delete this.player
      }
    }

    // Clear label status
    menu.clear('header')
    this.channel = channel.index
    this.status = 'fetching'
    menu.update(channel.index, template.listing())

    try {
      fs.updateJSON(this.path.profile, { lastChannel: channel })
    } catch (err) {};

    // Start fetching songs
    this.fetch(channel, account, (err, songs, result) => {
      if (err) {
        this.status = 'error';
        return menu.update(channel.index, color.red(err.toString()));
      }

      // Mark a `PRO` label on logo
      if (result && !result.warning) 
        menu.update('header', color.inverse(' PRO '));

      this.status = 'ready';
      this.player = new Player(songs, {
        src: 'url',
        cache: true,
        downloads: this.home,
        http_proxy: this.http_proxy
      });

      this.player.play();
      this.player.on('downloading', onDownloading);
      this.player.on('playing', onPlaying);

      function onDownloading(url) {
        self.status = 'downloading';
        menu.update(channel.index, template.loading());
      }

      function onPlaying(song) {
        var isValidSong = song.title && song.sid;
        self.status = 'playing';
        // Update playing label
        menu.update('header', color.green('>'));
        // Update song infomation
        menu.update(channel.index, template.song(song));
        // Logging songs history
        if (isValidSong) {
          var updates = {};
          updates[song.sid] = song;
          try {
            fs.updateJSON(self.path.history, updates);
          } catch (err) {
            // Errors must be logged in a private place.
          }
        }

        // Print LRC if needed.
        if (self.isShowLrc) {
          if (self.lrc) 
            self.lrc.stop();

          geci.fetch(song, printLrc);

          function printLrc(err, lrc) {
            if (err)
              return menu.update('header', color.grey(errors.lrc_notfound + err.toString()));
            if (!lrc)
              return menu.update('header', color.grey(errors.lrc_notfound));

            self.lrc = geci.print(lrc, (line, extra) => {
              menu.update(channel.index, template.song(song, line));
            });
          }
        }

        // TODO: Still trying after failed two times.
        if (song._id < self.player.list.length - 1)
          return false;

        return self.fetch(channel, account);
      }
    })
  }

  /**
  *
  * Play the next song in the playlist
  * @param channel {Object}
  * @param account {Object}
  *
  **/
  next(channel, account) {
    if (!this.player)
      return

    this.player.next((err, song) => {
      if (err) 
        this.menu.update('header', errors.last_song)

      return
    })
  }

  /**
  *
  * [Stop playing]
  * [And show the stopped status on logo.]
  * @param channel {Object}
  * @param account {Object}
  *
  **/
  stop(channel, account) {
    if (!this.player)
      return
    if (this.status === 'stopped')
      return this.play(channel, account)

    var menu = this.menu
    menu.clear('header')
    menu.update('header', template.pause())
    this.status = 'stopped'

    return this.player.stop()
  }

  /**
  *
  * [Add current song to lovelist when pressing `L`]
  * @param channel {Object}
  * @param account {Object}
  *
  **/
  loving(channel, account) {
    if (!this.player)
      return
    if (!this.player.playing)
      return
    if (!this.player.playing.sid)
      return this.menu.update('header', errors.love_fail)
    if (!account)
      return this.menu.update('header', errors.account_missing)

    var self = this
    var menu = self.menu
    var song = self.player.playing
    var query = {
      sid: song.sid,
      channel: self.channel,
      user_id: account.user_id,
      expire: account.expire,
      token: account.token
    }

    if (song.like)
      query.type = 'u'

    menu.update('header', '正在加载...')

    sdk.love(query, (err, result) => {
      menu.clear('header')

      if (err)
        menu.update('header', errors.normal)
      if (!err)
        self.player.playing.like = !song.like

      return menu.update(
        self.channel,
        // keep silence, do not notify
        template.song(self.player.playing, null, true) 
      )
    })
  }

  /**
  *
  * [Show lrc when when pressing `R`]
  * @param channel {Object}
  * @param account {Object}
  *
  **/
  showLrc(channel, account) {
    if (channel.channel_id == -99)
      return

    this.isShowLrc = !!!this.isShowLrc
    this.menu.clear('header')
    this.menu.update('header', this.isShowLrc ? '歌词开启' : '歌词关闭')

    return false
  }

  /**
  *
  * [Goto the music album page when pressing `G`]
  * @param {Object} channel
  * @param {Object} account
  *
  **/
  go(channel, account) {
    if (!this.player || !this.player.playing)
      return
    if (channel.channel_id == -99)
      return

    return open(
      utils.album(this.player.playing.album)
    )
  }

  /**
  *
  * [Share the current playing songs to Weibo when pressing `S`]
  * @param channel {Object}
  * @param account {Object}
  *
  **/
  share(channel, account) {
    if (!this.player || !this.player.playing)
      return false

    return open(
      template.share(this.player.playing)
    )
  }

  /**
  *
  * [Quit the FM]
  * [And kill the process when pressing `Q`]
  *
  **/
  quit() {
    this.menu.stop()
    return process.exit()
  }
}

/**
 * [Check if a object is channel object]
 * @param  {String}  alias [The channel type]
 * @param  {Int}     id    [The channel ID]
 * @return {Boolean}
 */
function isChannel(alias, id) {
  if (alias === 'local' && id == -99)
    return true
  if (alias === 'private' && (id == 0 || id == -3))
    return true

  return false
}

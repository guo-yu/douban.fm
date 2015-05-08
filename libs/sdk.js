import path from 'path'
import fs from 'fsplus'
import douban from 'douban-sdk'
import utils from './utils'
import errors from './errors'

export const mhz = {
  'localMhz': {
    'seq_id': -99,
    'abbr_en': 'localMhz',
    'name': '本地电台',
    'channel_id': -99,
    'name_en': 'localMhz'
  },
  'privateMhz': {
    'seq_id': -3,
    'abbr_en': '',
    'name': '红心兆赫',
    'channel_id': -3,
    'name_en': '',
  },
}

export function fm() {
  return (new douban).fm
}

export function fetchSongs(params, callback) {
  var local = params && params.local && params.history

  if (local) 
    return listLocalSongs(params.local, params.history, callback)

  if (params.history) 
    delete params.history

  var query = {
    'qs': params
  }

  return douban.fm.songs(query, callback)
}

export function addToLove(params, callback) {
  params.type = 'r'
  return fetchSongs(params, callback)
}

export function listLocalSongs(dir, history, callback) {
  fs.readdir(dir, readLocalDir);

  function readLocalDir(err, songs) {
    if (err) 
      return callback(err)
    if (!songs) 
      return callback(new Error(errors.localsongs_notfound))

    var list = []

    fs.readJSON(history, (err, history) => {
      if (err) 
        return callback(new Error(errors.localsongs_notfound))

      songs.forEach((song) => {
        if (song.lastIndexOf('.mp3') !== (song.length - 4)) 
          return

        var s = history[utils.sid(song)] || {}
        s.url = path.resolve(dir, song)

        list.push(s)
      })

      if (list.length === 0) 
        return callback(new Error(errors.localsongs_notfound))

      list.sort((a, b) => {
        return Math.random() - 0.5
      })

      return callback(null, list)
    })
  }
}

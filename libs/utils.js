import path from 'path'
import fsplus from 'fsplus'
import Promise from 'bluebird'
import errors from './errors'

const fs = Promise.promisifyAll(fsplus)

export function locals({ localPath, historyPath }) {
  return fs.readdirAsync(localPath)
    .then(songs => {
      if (!songs) 
        return Promise.reject(new Error(errors.localsongs_notfound))

      return fs.readJSONAsync(historyPath)
    })
    .then(history => {
      var list = []

      // Songs filter
      songs.forEach(song => {
        if (song.lastIndexOf('.mp3') !== (song.length - 4)) 
          return

        var s = history[utils.sid(song)] || {}
        s.url = path.resolve(localPath, song)

        list.push(s)
      })

      if (list.length === 0) 
        return Promise.reject(new Error(errors.localsongs_notfound))

      // Sort songs in random order
      list.sort((a, b) =>
        return Math.random() - 0.5)

      return Promise.resolve(list)
    })
}

// Escape a douban site uri from normal URI
export function album(link) {
  if (!link) 
    return

  return link.indexOf('http') === -1 ? 
    'http://music.douban.com' + link : 
    link
}

// Split Sid from a song's title
export function sid(filename) {
  if (!filename) 
    return

  var idstr = filename.substr(
    filename.indexOf('p') + 1, 
    filename.lastIndexOf('.') - 1
  )

  if (idstr.indexOf('_') === -1) 
    return idstr

  return idstr.substr(0, idstr.lastIndexOf('_'))
}

// Check if a Error is a NoSuchFile Error
export function noSuchFile(msg) {
  return msg && msg.indexOf('no such file or directory') > -1
}

export function readJSON(file) {
  try {
    return fs.readJSON(file)
  } catch (err) {
    return {}
  }
}

/**
 * [Check if a object is channel object]
 * @param  {String}  alias [The channel type]
 * @param  {Int}     id    [The channel ID]
 * @return {Boolean}
 */
export function isLocalChannel(alias, id) {
  if (alias === 'local' && id == -99)
    return true
  if (alias === 'private' && (id == 0 || id == -3))
    return true

  return false
}

import fs from 'fsplus'

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

// Read JSON file, if Error return blank object
export function readJSON(file) {
  try {
    return fs.readJSON(file)
  } catch (err) {
    return {}
  }
}

// Check if a object is Function Type
export function isFunction(func) {
  return func && typeof(func) === 'function'
}

// Check if a Error is a NoSuchFile Error
export function noSuchFile(msg) {
  return msg && msg.indexOf('no such file or directory') > -1
}

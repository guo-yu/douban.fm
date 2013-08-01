![](http://ww3.sinaimg.cn/large/61ff0de3gw1e77q7mth9dj200z00z3ya.jpg) douban.fm ![](https://badge.fury.io/js/douban.fm.png)
---
a cli wrapper of douban.fm based on node

![screenshot](http://ww1.sinaimg.cn/large/61ff0de3jw1e77q9b6ra9j20p00gkjsf.jpg)

### How to install

````
$ sudo npm install douban.fm -g
````

### Usaage

#### Use CLI

##### Start douban.fm
````
$ douban.fm
````

##### Set your passport for Privite Hz
````
$ sudo doubanfm -m email@domain.com password // 
````

#### Hotkey

working on global hotkey.

### Sample code

````javascript
var doubanfm = require('douban.fm');

// passport auth
doubanfm.auth({
    email: 'xxx',
    password: 'xxx'
},function(result){
    // do sth.
    // 授权成功会返回token
});

// fetch channels
doubanfm.list(function(list){
    console.log(list)
});

// fetch songs
doubanfm.channel({
    id: channel.id,
    type: 'n' // check this guide http://zonyitoo.github.io/blog/2013/01/22/doubanfmbo-fang-qi-kai-fa-shou-ji/
},user,function(songs){
    console.log(songs)
});
````

## Run unit-test (Mocha)

````
$ git clone https://github.com/turingou/douban.fm.git
$ cd douban.fm
$ npm install 
$ npm test
````

## Changelog

- `0.0.5` cli supported
Douban.fm Node cli ![](https://badge.fury.io/js/douban.fm.png)
---
豆瓣电台命令行工具与api包装集

### 如何安装

`$ sudo npm install douban.fm -g`

### 如何使用

#### 命令行操作

````
$ douban.fm // 开启电台，使用方向键操作选择收听哪个电台

$ sudo douban.fm -m yourEmail@domain.com password // 设置豆瓣账户密码（私人电台使用）
````

#### 快捷键操作

douban.fm cli 正在设计全局快捷键操作

### 在node程序中使用

````javascript
var fm = require('douban.fm');

// 账户验权
fm.auth({
    email: 'xxx',
    password: 'xxx'
},function(result){
    // do sth.
    // 授权成功会返回token
});

// 获取频道列表
fm.list(function(list){
    console.log(list)
});

// 获取某个频道的歌曲列表
var user = {
    token: 'xxx'
};

fm.channel({
    id: channel.id,
    type: 'n' // 这个type请参考 http://zonyitoo.github.io/blog/2013/01/22/doubanfmbo-fang-qi-kai-fa-shou-ji/
},user,function(songs){
    console.log(songs)
});
````
![](http://ww3.sinaimg.cn/large/61ff0de3gw1e77q7mth9dj200z00z3ya.jpg) douban.fm ![](https://badge.fury.io/js/douban.fm.png)
---
a cli wrapper of douban.fm based on Node.js

![screenshot](http://ww1.sinaimg.cn/large/61ff0de3jw1e77q9b6ra9j20p00gkjsf.jpg)

### 如何安装
````
$ [sudo] npm install douban.fm -g
````
### 使用方法

#### 使用命令行操作
开启你的命令行豆瓣电台
````
$ douban.fm
````
设置私人频道的账户密码，配置文件和歌曲将会保存在 `~/douban.fm` 目录
````
$ douban.fm -m [email@domain.com] [password] 
````
如果你不想保存在这里，可以这样自定义保存的位置，比如：
````
$ douban.fm -h /Users/[USERNAME]/Music/douban.fm
````
#### 快捷键列表
在相应的命令行菜单中，按下以下快捷键：
````
n           - >     本频道列表的下一首歌曲
backspace   - >     停止播放
return      - >     播放相应频道
````

#### 范例代码
````javascript
var Fm = require('douban.fm');

// 授权
Fm.auth({
    email: 'xxx',
    password: 'xxx'
},function(result){
    // do sth with result token.
});

// 获取频道
Fm.sdk.list(function(list){
    console.log(list)
});

// 或者歌曲列表
Fm.sdk.channel({
    id: channel.id,
    type: 'n' // check this guide http://zonyitoo.github.io/blog/2013/01/22/doubanfmbo-fang-qi-kai-fa-shou-ji/
},user,function(songs){
    console.log(songs)
});
````

### 单元测试 (Mocha)
````
$ git clone https://github.com/turingou/douban.fm.git
$ cd douban.fm
$ npm install 
$ npm test
````

### Changelog
- `0.0.8` 修复bugs
- `0.0.7` 支持播放下一首，暂停播放，下载歌曲到本地播放
- `0.0.5` 支持命令行界面

### MIT license
Copyright (c) 2013 turing <i@guoyu.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
![](http://ww3.sinaimg.cn/large/61ff0de3gw1e77q7mth9dj200z00z3ya.jpg) douban.fm ![](https://badge.fury.io/js/douban.fm.png)
---
简洁优雅的豆瓣电台命令行版，基于 Node.js

![screenshot](http://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg)

### 如何安装
````
$ [sudo] npm install douban.fm -g
````

### 使用方法

这样开启你的命令行豆瓣电台：
````
$ douban.fm
````
收听私人频道需要设置账户信息。账户信息、配置文件与歌曲将会保存在 `~/douban.fm` 目录
````
$ douban.fm -m email@domain.com mypassword
````

### 快捷键列表

在相应的命令行菜单中，按下以下快捷键，可以在收听豆瓣电台的过程中，标注自己喜欢的红心歌曲，
跳转到专辑的介绍页面，或者分享这首歌曲到你的新浪微博。

````
[return]      - >     播放另一个频道，或者重新播放当前频道 (PLAY)
[backspace]   - >     停止播放当前歌曲或频道 (DELETE)
[n]           - >     本频道列表的下一首歌曲 (NEXT)
[l]           - >     添加到红心列表或者删除红心 (LOVE)
[s]           - >     分享当前歌曲到新浪微博 (SHARE)
[g]           - >     跳转到当前播放歌曲的专辑页面 (GOTO)
[q]           - >     退出豆瓣电台 (QUIT)
````

### Pro 用户
支持 pro 用户收听高码率 mp3，pro 用户默认会先寻找 192kbps 的歌曲播放，非 pro 用户不受影响。
在同样的网络情况下，收听高码率的电台可能意味着加载资源的速度更慢，但是目前豆瓣电台命令行版还不支持随时自定义码率。

### 范例代码

这样在你的项目中引用 douban.fm 的 SDK。
这些范例可能和最终的结果不一致，在使用前，最好参考 `./libs/sdk.js` 这个文件，以防出现意想不到的错误

````javascript
var Fm = require('douban.fm');

// 授权
Fm.sdk.auth({
    email: 'xxx',
    password: 'xxx'
},function(err, result){
    // do sth with result token.
});

// 获取频道
Fm.sdk.list(function(err, list){
    console.log(list)
});

// 或者歌曲列表
// 这里有一份指导博客:
// http://zonyitoo.github.io/blog/2013/01/22/doubanfmbo-fang-qi-kai-fa-shou-ji/
Fm.sdk.channel({
    id: channel.id,
    type: 'n'
},user,function(err, songs){
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

详见 [History.md](./History.md)

### MIT license
Copyright (c) 2013 turing &lt;i@guoyu.me&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---
![docor](https://cdn1.iconfinder.com/data/icons/windows8_icons_iconpharm/26/doctor.png)
built upon love by [docor](https://github.com/turingou/docor.git) v0.1.2

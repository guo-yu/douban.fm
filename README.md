![](http://ww3.sinaimg.cn/large/61ff0de3gw1e77q7mth9dj200z00z3ya.jpg) douban.fm ![](https://badge.fury.io/js/douban.fm.png)
---
简洁优雅的豆瓣电台命令行版，基于 Node.js

![screenshot](http://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg)

### 如何安装
从 NPM 中安装稳定的版本
````
$ [sudo] npm install douban.fm -g
````
从 Git 仓库中安装最新的开发版本：
````
$ [sudo] npm install -g https://github.com/turingou/douban.fm.git
````

### 模块依赖

由于需要使用到 speaker 等模块，安装时需要编译文件，对安装环境有一定要求。
推荐在 Mac OSX 下使用，在安装之前或安装遇到问题时，确保以下依赖状态正常：

* 安装了 python 2.x 并配置好环境变量
* 安装了 node-gyp 编译工具
* 安装了 xcode，或已安装 xcodebuild 工具和 command line tools 工具集
* 曾经安装过 xcode 并已同意用户协议，确保更新 xcode 版本后同意过用户协议
* 非 Mac OSX 用户需要检查 `node-speaker` 模块的外部依赖情况，详见 [node-speaker 文档](https://github.com/TooTallNate/node-speaker/#audio-backend-selection)，按照你使用的操作系统安装相应外部依赖
* 确保权限一致。如果没有使用 sudo 则尝试使用 sudo 安装
* 各种 linux 发行版外部依赖问题，先确认是否安装了 libasound2，如果没有，尝试 `sudo apt-get install libasound2-dev`，fedora 下 `yum install alsa-lib-devel`

如果遇到无法解决的问题，请到 [issue](https://github.com/turingou/douban.fm/issues) 板块先检索是否有人遇到相同的错误，或者直接发帖求助。

### 使用方法

这样开启你的命令行豆瓣电台：
````
$ douban.fm
````
收听私人频道需要设置账户信息。账户信息、配置文件与歌曲将会保存在 `~/douban.fm` 目录
````
$ douban.fm config
$ prompt: Douban Email: 输入豆瓣账户邮箱
$ prompt: Douban Password: 输入豆瓣账户密码
````
如果你忘了快捷键设置，可以打开帮助菜单：
````
$ douban.fm help
````

### 菜单快捷键列表

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

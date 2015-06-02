![](http://ww3.sinaimg.cn/large/61ff0de3gw1e77q7mth9dj200z00z3ya.jpg) douban.fm ![](https://badge.fury.io/js/douban.fm.png)
---
简洁优雅的豆瓣电台命令行版，基于 Node.js。

[WIP] 目前 `master` 分支正在使用 ES6 重写，处于不稳定状态，新用户请使用 npm 中的最后一个稳定版本.

![screenshot](http://ww1.sinaimg.cn/large/61ff0de3tw1ecij3dq80bj20m40ez75u.jpg)

### 功能特性

- 支持歌曲加心
- 支持私人电台、红心电台
- 支持离线播放本地电台
- 支持 PRO 用户高码率歌曲
- 支持滚动歌词显示
- 支持部分 ID3 信息补全
- 支持HTTP代理

### 如何安装

从 NPM 中安装稳定的版本：
```bash
$ [sudo] npm install douban.fm -g
```
更推荐使用 [cnpm](http://cnpmjs.org/) 镜像源加速安装
```bash
$ [sudo] npm install douban.fm -g \
         --disturl=http://dist.u.qiniudn.com \
         --registry=http://r.cnpmjs.org
```

从 Git 仓库中安装最新的开发版本：
```bash
$ [sudo] npm install git://github.com/turingou/douban.fm.git -g \
         --disturl=http://dist.u.qiniudn.com \
         --registry=http://r.cnpmjs.org
```

### 模块依赖

由于需要使用到 speaker 等模块，安装时需要编译文件，对安装环境有一定要求。
推荐在 Mac OSX 下使用，在安装之前或安装遇到问题时，确保以下依赖状态正常：

#### Linux & Mac OSX

* 安装了 `Python` 2.x 并配置好环境变量
* 安装了 `Node-gyp` 编译工具
* 安装了 `xcode`，或已安装 `xcodebuild` 工具和 `command line tools` 工具集
* 曾经安装过 `xcode` 并已同意用户协议，确保更新 `xcode` 版本后同意过用户协议
* 非 Mac OSX 用户需要检查 `node-speaker` 模块的外部依赖情况，详见 [node-speaker 文档](https://github.com/TooTallNate/node-speaker/#audio-backend-selection)，按照你使用的操作系统安装相应外部依赖
* 确保权限一致。如果没有使用 sudo 则尝试使用 sudo 安装
* 各种 Linux 发行版外部依赖问题，先确认是否安装了 `libasound2`，如果没有，尝试 `sudo apt-get install libasound2-dev`，fedora 下 `yum install alsa-lib-devel`

#### Windows

* 此项目的部分依赖模块在 Windows 下支持状况不是很好，因此不建议在 Windows 环境下安装。
* 最新版本的 *x86*  [Node.js for Windows](http://nodejs.org/download/), 注意不要安装 *x64* 版本。
* 安装 [Visual C++ 2010 Express](http://www.microsoft.com/visualstudio/eng/downloads#d-2010-express)。
* 安装 [Python 2.7](http://www.python.org/download/), installed in the default location of `C:\Python27`。

安装的时候都用默认的下一步吧，保险起见再重启一下电脑。现在，你的 Windows 系统就可以安装带有 c++ addons 的 Node.js 模块了。

如果遇到无法解决的问题，请到 [issue](https://github.com/turingou/douban.fm/issues) 板块先检索是否有人遇到相同的错误，或者直接发帖求助。

### 使用方法

开启命令行豆瓣电台：
```bash
$ douban.fm
```

收听私人频道需要设置账户信息。账户信息、配置文件将会保存在 `~/.douban.fm.profile.json`（ >= 0.1.2 版本后）
歌曲将会默认保存在 `~/douban.fm` 目录下，当然你也可以通过配置自定义歌曲保存的目录。

使用配置向导，配置豆瓣电台账户信息、下载目录路径以及使用更多特性功能：

```bash
$ douban.fm config
```

### 菜单快捷键列表

在相应的命令行菜单中，按下以下快捷键，可以在收听豆瓣电台的过程中，标注自己喜欢的红心歌曲，
跳转到专辑的介绍页面，或者分享这首歌曲到你的新浪微博。
```
[return]      - >     播放另一个频道，或者重新播放当前频道 (PLAY)
[backspace]   - >     停止播放当前歌曲或频道 (DELETE)
[n]           - >     本频道列表的下一首歌曲 (NEXT)
[l]           - >     添加到红心列表或者删除红心 (LOVE)
[s]           - >     分享当前歌曲到新浪微博 (SHARE)
[r]           - >     开启或关闭歌词，默认关闭歌词显示 (LRC)
[g]           - >     跳转到当前播放歌曲的专辑页面 (GOTO)
[q]           - >     退出豆瓣电台 (QUIT)
```
如果你忘了快捷键设置，可以打开配置向导，查看帮助菜单，或者：

```bash
$ douban.fm help
```

### 支持 Pro 用户高码率音乐
支持 pro 用户收听高码率 mp3，pro 用户默认会先寻找 192kbps 的歌曲播放，非 pro 用户不受影响。
在同样的网络情况下，收听高码率的电台可能意味着加载资源的速度更慢，但是目前豆瓣电台命令行版还不支持随时自定义码率。

### 歌词显示
豆瓣电台命令行版 `>= 0.1.2` 版本支持显示歌词功能，这个功能尚在调试中，歌词可能无法与音乐精确匹配，歌词显示默认关闭，可以使用快捷键 `R` 开启，开启后在下一首歌曲播放时将会加载歌词。

### 本地电台
豆瓣电台命令行版 `>= 0.1.2` 版本支持本地电台功能，这意味着在离线情况下，或者网络不佳，通信失败的情况下，豆瓣电台命令行版会自动切换到本地电台进行播放，方便您在旅行时使用豆瓣电台。

### ID3 信息补全
豆瓣电台命令行版 `>= 0.1.2` 版本支持本地 ID3 信息补全，方便用户同步到 iTunes 等播放软件。目前暂不支持为歌曲添加封面。此功能需要外部依赖 `ffmpeg` 使用前确保已经安装 [ffmpeg command-line tool](http://www.ffmpeg.org/) 或 [libav fork](http://www.libav.org/avconv.html) 

### HTTP代理
支持HTTP代理设置，代理格式为`http://IP_ADDRESS:PORT`。

### 范例代码

豆瓣电台 SDK 已迁移到 `douban-sdk` 模块，请参考此[模块接口文档](https://github.com/turingou/douban-sdk)使用，如需更多使用范例，可以参考本项目下的 `./libs/sdk.js` 文件。

### 致谢

豆瓣电台命令行版作为一款开源命令行播放器，有你们的参与才能日趋完善：

- 感谢 [ZoomQuiet](https://github.com/ZoomQuiet) 不遗余力地试用和建议。
- 感谢 [zhuangya](https://github.com/zhuangya) 改良了配置账户的操作 [#32](https://github.com/turingou/douban.fm/pull/32)
- 感谢 [anson0370](https://github.com/anson0370) 解决了退出后光标消失的 bug [#53](https://github.com/turingou/douban.fm/pull/53)
- 感谢 [youxiachai](https://github.com/youxiachai) 增加了对 windows 的分享支持 [#54](https://github.com/turingou/douban.fm/pull/54)
- 感谢 [buhe](https://github.com/buhe) 增加显示歌词的功能 [#58](https://github.com/turingou/douban.fm/pull/58)
- 感谢 [JacksonTian](https://github.com/JacksonTian) 改善了 `player` 模块 [#2](https://github.com/turingou/player/pull/2)
- 感谢 [stormluke](https://github.com/stormluke) 为 `term-list-enhanced` 模块[添加了滚动功能](https://github.com/turingou/term-list-enhanced/commit/b45779ece29232164d1e72d00cf9715e727589dd)

### 单元测试 (Mocha)
```bash
$ git clone https://github.com/turingou/douban.fm.git
$ cd douban.fm
$ npm install --disturl=http://dist.u.qiniudn.com --registry=http://r.cnpmjs.org
$ npm test
```

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

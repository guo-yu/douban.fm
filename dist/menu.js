"use strict";

module.exports = {
  main: [{
    type: "list",
    name: "type",
    message: "请选择需要更改的配置项: ",
    choices: [{
      value: "account",
      name: "配置豆瓣电台账户密码 / Update douban.fm account"
    }, {
      value: "download",
      name: "更新下载文件夹路径 / Update download directory path"
    }, {
      value: "http_proxy",
      name: "设置HTTP代理 / Set http proxy"
    }, {
      value: "id3",
      name: "更新本地曲库歌曲ID3 / Update ID3 for local songs"
    }, {
      value: "help",
      name: "查看帮助文档 / Help"
    }, {
      value: "quit",
      name: "退出配置向导 / Quit"
    }]
  }],
  account: [{
    type: "input",
    name: "email",
    message: "豆瓣账户 (Email 地址)",
    validate: function validate(value) {
      var EmailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var pass = value.match(EmailRegex);
      if (pass) {
        return true;
      } else {
        return "请输入有效的 Email 地址";
      }
    }
  }, {
    type: "password",
    name: "password",
    message: "豆瓣密码 (不会保留密码) ",
    validate: function validate(value) {
      if (value && value.length > 0) {
        return true;
      }return "请输入有效密码";
    }
  }],
  download: {
    main: function main(dir) {
      return [{
        type: "confirm",
        name: "useWorkingPath",
        message: "将下载目录设置为当前目录 " + dir + "?",
        "default": true
      }];
    },
    setting: [{
      type: "input",
      name: "download",
      message: "请输入一个有效的绝对路径作为新的曲库目录"
    }]
  },
  http_proxy: {
    main: function main(http_proxy) {
      return [{
        type: "confirm",
        name: "useDefaultProxy",
        message: (http_proxy ? "设置HTTP代理为 " + http_proxy : "直接连接") + "?",
        "default": true
      }];
    },
    setting: [{
      type: "input",
      name: "http_proxy",
      message: "HTTP代理格式为 (http://IP_ADDRESS:PORT)"
    }]
  } };
//# sourceMappingURL=menu.js.map
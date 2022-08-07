# Lyric Finder

---

## Overview 总览

此软件免费并开源

This is a free and open-source software by [castle](https://rogerchen2005.github.io).

## Functions 功能

1、**从网易音乐下载歌曲，封面，歌词**

**Download songs,covers,lyrics from NCM (Main Function)**\

2、登陆并查看个人歌单

Login and view personal songlist

3、搜索并添加歌曲进入下载列表

search and add songs to download list

## Usage 使用

1、准备网易云Api的副本，修改main.js中的Api路径

Prepare a copy of NeteaseCloudMusicApi and then change the path in main.js

```JavaScript
require("./path/to/api/server").serveNcmApi({
    checkVersion: true,
})
```

2、npm安装依赖

Install modules through npm

```Bash
npm install
```

3、启动项目

```bash
electron .
```

## Based on 基于

1、[Electron](https://www.electronjs.org/)

2、[Element-UI](https://element.eleme.io/#/zh-CN)

3、[NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

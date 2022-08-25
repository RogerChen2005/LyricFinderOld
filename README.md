# Lyric Finder

---

## Update 近期更新

### 8.25 1.01 build 22802

1、修复若干Bug

Fixed several bugs

2、新增匹配歌词功能

New function:match lyrics to local files

3、新增匹配封面功能

New function:match covers to local files

### 8.24 1.01 build 22801

1、下载歌曲将自动写入歌曲元数据

Metadata will automatically apply to downloaded songs.

2、新增下载进度

Add download progress.

3、优化批量操作

Better bulk operations.

## Overview 总览

此软件免费并开源

This is a free and open-source software by [castle](https://rogerchen2005.github.io).

## Functions 功能

1、**从网易音乐下载歌曲，封面，歌词**

**Download songs,covers,lyrics from NCM (Main Function)**

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

2、[Vue](https://vuejs.org/)

3、[Element-UI](https://element.eleme.io/#/zh-CN)

4、[NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

5、[Node-Taglib-Sharp](https://github.com/benrr101/node-taglib-sharp)

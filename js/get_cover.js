const {
    song_detail,
    album
} = require("../NeteaseCloudMusicApi-master/main")
const request = require("request")
const fs = require("fs");
const { callbackify } = require("util");

async function get_cover_from_songs(ids){
    var result = await song_detail({
        ids:"" + ids
    });
    result.body.songs.map((item)=>{
        let url = item.al.picUrl;
        let filename = item.ar[0].name + " - " + item.name
        let stream = fs.createWriteStream(filename+".jpg");
        request(url).pipe(stream);
    });
}

async function get_cover_from_album(id){
    let result = await album({
        id:id
    })
    let url = result.body.album.picUrl;
    let filename = result.bodu.album.name;
    let stream = fs.createWriteStream(filename+".jpg");
        request(url).pipe(stream);
}

function parse_id_from_url(url){
    pos1 = url.indexOf('=');
    pos2 = url.indexOf('&');
    return url.substring(pos1+1,pos2);
}

// var urls = ["https://music.163.com/song?id=35090540&userid=568667480",
// "https://music.163.com/song?id=27588384&userid=568667480",
// "https://music.163.com/song?id=470573537&userid=568667480",
// "https://music.163.com/song?id=37240628&userid=568667480"];
// get_cover_from_songs(urls.map((id)=>parse_id_from_url(id)))
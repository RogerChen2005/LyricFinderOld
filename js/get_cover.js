const {
    song_detail,
    album
} = require("../NeteaseCloudMusicApi-master/main")
const request = require("request")
const fs = require("fs");

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
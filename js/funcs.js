const {
    song_url,
    song_detail,
    login_cellphone,
    captcha_sent
} = require("../NeteaseCloudMusicApi-master/main")
const cacache = require("cacache")
const path = require("path")

const data_path = path.join(__dirname,"/usr_data");

function parse_id_from_url(url){
    pos1 = url.indexOf('=');
    pos2 = url.indexOf('&');
    return url.substring(pos1+1,pos2);
}
async function try_listen(item,callback){
    var data = {};
    var result2 = await song_detail({
        ids:""+item.id
    });
    data.album_img = result2.body.songs[0].al.picUrl;
    console.log(item);
    var result1 = await song_url({
        id:item.id
    }) 
    console.log(result1);
    let resBlob = new Blob([result1.body])
    let reader = new FileReader()
    reader.readAsText(resBlob, "utf-8")
    reader.onload = () => {
        let result = JSON.parse(reader.result)
        console.log(result);
        data.music_url = result.data[0].url;
        data.title = item.title;
        data.artist = item.artists;
        data.album = item.album;
        return callback(data);
    }
}

async function user_login(phone_number,password,callback){
    var result = await login_cellphone({
        phone:phone_number,
        captcha:password
    });
    return callback(result.body);
}

async function get_cover_from_song(id,callback){
    var result = await song_detail({
        ids: "" + id
    });
    callback(result.body.songs[0].al.picUrl);
}

function save_profile(profile){
    cacache.put(data_path,"profile",JSON.stringify(profile))
}

function read_profile(callback){
    cacache.get(data_path,"profile").then((data)=>callback(JSON.stringify(data)));
}
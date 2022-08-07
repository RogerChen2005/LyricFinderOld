const cacache = require("cacache");
const path = require("path");
const request = require("request");
const fs = require("fs")
const axios = require("axios");
const marked = require("marked")

const data_path = path.join(__dirname, "../../usr_data");
const host = "http://localhost:3000/"

function parse_id_from_url(url) {
    pos1 = url.indexOf('=');
    pos2 = url.indexOf('&');
    return url.substring(pos1 + 1, pos2);
}
module.exports.parse_id_from_url = parse_id_from_url;

function create_file_name(str){
    var filename = str.replace(/\//g,"_");
    filename = filename.replace(/\*/g,"＊");
    filename = filename.replace(/:/g,"：");
    return filename;
}

async function try_listen(item, callback) {
    var data = {};
    data.title = item.title;
    data.artist = item.artists;
    data.album = item.album;
    var result2;
    await axios.get(host + "song/detail?ids=" + item.id)
        .then(result => {
            result2 = result;
        })
        .catch(error => console.log(error));
    data.album_img = result2.data.songs[0].al.picUrl;
    axios.get(host + "song/url?id=" + item.id)
        .then(result => {
            data.music_url = result.data.data[0].url;
            return callback(data);
        })
        .catch(error => console.log(error));
}
module.exports.try_listen = try_listen;

function user_login(phone_number, password, captcha, callback) {
    if (password == "") {
        axios.get(host + "login/cellphone?phone=" + phone_number + "&captcha=" + captcha)
            .then(result => callback(result.data))
            .catch(error => console.log(error));
    } else {
        axios.get(host + "login/cellphone?phone=" + phone_number + "&password=" + password)
            .then(result => callback(result.data))
            .catch(error => console.log(error));
    }
}
module.exports.user_login = user_login;

function get_cover_from_song(id, callback) {
    axios.get(host + "song/detail?ids=" + id)
        .then(result => callback(result.data.songs[0].al.picUrl))
        .catch(error => console.log(error));
}
module.exports.get_cover_from_song = get_cover_from_song;

function save_profile(key, profile) {
    cacache.put(data_path, key, JSON.stringify(profile))
}
module.exports.save_profile = save_profile;

function read_profile(key, callback) {
    cacache.get(data_path, key).then((data) => {
        callback(JSON.parse(data.data));
    });
}
module.exports.read_profile = read_profile;

async function get_userlist(uid, callback) {
    await axios.get(host + "user/playlist?uid=" + uid)
        .then(result => {
            var user_list = []
            result.data.playlist.map((data) => {
                user_list.push({
                    img_url: data.coverImgUrl,
                    list_name: data.name,
                    id: data.id,
                    total: data.trackCount
                })
            });
            return callback(user_list);
        })
        .catch(error => console.log(error));
}
module.exports.get_userlist = get_userlist;

async function get_list_song(id, offset, cookie, callback) {
    var result = await axios.get(host + "playlist/track/all?id=" + id + "&limit=30&offset=" + offset + "&cookie=" + cookie)
        .catch(error => console.log(error));
    var return_list = [];
    result.data.songs.map((item) => {
        return_list.push({
            id: item.id,
            title: item.name,
            artists: "" + item.ar.map((item) => item.name),
            album: item.al.name,
            img_url: item.al.picUrl
        })
    })
    return callback(return_list);
}
module.exports.get_list_song = get_list_song;

async function get_result(keywords, offset, callback) {
    axios.get(host + "search?keywords=" + keywords + "&limit=15&offset=" + offset)
        .then(result => {
            var list = [];
            for (var i of result.data.result.songs) {
                list.push({
                    id: i.id,
                    title: i.name,
                    artists: "" + i.artists.map((item) => item.name),
                    album: i.album.name
                });
            }
            return callback(list);
        })

}

module.exports.get_result = get_result;

var download_path = "";

function set_download_path(d_path){
    if (!fs.existsSync(path.join(d_path,"download"))) {
        fs.mkdirSync(path.join(d_path,"download"),{recursive:true});
        fs.mkdirSync(path.join(d_path,"download","song"));
        fs.mkdirSync(path.join(d_path,"download","cover"));
        fs.mkdirSync(path.join(d_path,"download","lyric"));
    }
    download_path = d_path;
}
module.exports.set_download_path = set_download_path;

async function download_lyric(item) {
    try {
        let output = item.artists + " - " + item.title;
        var result = await axios.get(host + "lyric?id=" + item.id);
        var body = result.data;
        if (body.tlyric) {
            if (body.tlyric.version != 0) {
                lyric_org = body.lrc.lyric.split("\n");
                lyric_trans = body.tlyric.lyric.split("\n");
                let right = lyric_org[0].indexOf("]");
                var str = "";
                for (let i = 0, j = 1; ; i++) {
                    str += lyric_org[i] + "\n";
                    if (!lyric_org[i] | !lyric_trans[j]) {
                        break;
                    }
                    if (lyric_org[i].substring(0, right) == lyric_trans[j].substring(0, right)) {
                        str += lyric_trans[j] + "\n";
                        j++;
                    }
                }
                fs.writeFileSync(path.join(download_path,"download","lyric",create_file_name(output + ".lrc")), str);
                return;
            }
        }
        fs.writeFileSync(path.join(download_path,"download","lyric",create_file_name(output + ".lrc")),body.lrc.lyric);
    } catch (error) {
        console.log(error);
    }
}

module.exports.download_lyric = download_lyric;

function download_cover(item) {
    let stream = fs.createWriteStream(path.join(download_path,"download","cover",create_file_name(item.artists+" - "+item.title+".jpg")));
    request(item.img_url).pipe(stream);
}
module.exports.download_cover = download_cover

async function download_song(item,br,cookie) {
    var result =  await axios.get(host+"song/url?id="+item.id+"&br="+br+"&cookie="+cookie);
    var body = result.data.data[0];
    let stream = fs.createWriteStream(path.join(download_path,"download","song",create_file_name(item.artists+" - "+item.title+"."+body.type)));
    request(body.url).pipe(stream);
}
module.exports.download_song = download_song;

function send_captcha(phone_number){
    axios.get(host + "captcha/sent?phone=" + phone_number)
        .catch(error => console.log(error));
}
module.exports.send_captcha = send_captcha

function  generate_markdown(m_path,callback){
    var temp = path.join(__dirname,m_path);
    fs.readFile(temp,(err,data)=>{
        callback(marked.marked(data.toString()));
    });
}
module.exports.generate_markdown = generate_markdown;
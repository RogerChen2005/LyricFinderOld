const cacache = require("cacache");
const path = require("path");
const request = require("request");
const fs = require("fs")
const axios = require("axios");
const marked = require("marked")
const taglib = require("node-taglib-sharp")

const data_path = path.join(__dirname, "../../usr_data");
const host = "http://localhost:3000/"

function parse_id_from_url(url) {
    pos1 = url.indexOf('=');
    pos2 = url.indexOf('&');
    return url.substring(pos1 + 1, pos2);
}
module.exports.parse_id_from_url = parse_id_from_url;

function create_file_name(str) {
    var filename = str.replace(/\//g, "_");
    filename = filename.replace(/\*/g, "＊");
    filename = filename.replace(/:/g, "：");
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

function set_download_path(d_path, classify) {
    if (!fs.existsSync(path.join(d_path, "download"))) {
        fs.mkdirSync(path.join(d_path, "download"), { recursive: true });
    }
    if (classify) {
        if (!fs.existsSync(path.join(d_path, "download", "song"))) {
            fs.mkdirSync(path.join(d_path, "download", "song"));
        }
        if (!fs.existsSync(path.join(d_path, "download", "cover"))) {
            fs.mkdirSync(path.join(d_path, "download", "cover"));
        }
        if (!fs.existsSync(path.join(d_path, "download", "lyric"))) {
            fs.mkdirSync(path.join(d_path, "download", "lyric"));
        }
    }
    download_path = d_path;
}
module.exports.set_download_path = set_download_path;

async function download_lyric(item, classify, callback) {
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
                var save_path = classify ? path.join(download_path, "download", "lyric", create_file_name(output + ".lrc")) : path.join(download_path, "download", create_file_name(output + ".lrc"));
                fs.writeFileSync(save_path, str);
                callback();
                return;
            }
        }
        var save_path = classify ? path.join(download_path, "download", "lyric", create_file_name(output + ".lrc")) : path.join(download_path, "download", create_file_name(output + ".lrc"));
        fs.writeFileSync(save_path, body.lrc.lyric);
        callback();
    } catch (error) {
        console.log(error);
    }
}

module.exports.download_lyric = download_lyric;

function download_cover(item, classify, callback) {
    let output = item.artists + " - " + item.title;
    var save_path = classify ? path.join(download_path, "download", "cover", create_file_name(output + ".jpg")) : path.join(download_path, "download", create_file_name(output + ".jpg"));
    let stream = fs.createWriteStream(save_path);
    request(item.img_url).pipe(stream);
    stream.on("finish", callback());
}
module.exports.download_cover = download_cover

async function download_song(item, br, cookie, classify, save_img, callback) {
    let output = item.artists + " - " + item.title;
    var result = await axios.get(host + "song/url?id=" + item.id + "&br=" + br + "&cookie=" + cookie);
    var body = result.data.data[0];
    var save_path = classify ? path.join(download_path, "download", "song", create_file_name(output + "." + body.type)) : path.join(download_path, "download", create_file_name(output + "." + body.type));
    let stream = fs.createWriteStream(save_path);
    request(body.url).pipe(stream);
    stream.on("finish", () => {
        axios({
            url: item.img_url,
            method: 'GET',
            responseType: 'arraybuffer'
        }).then((body) => {
            data = taglib.ByteVector.fromByteArray(Buffer.from(body.data, "utf-8"));
            if (save_img) {
                fs.writeFileSync(classify ? path.join(download_path, "download", "cover", create_file_name(output + ".jpg")) : path.join(download_path, "download", create_file_name(output + ".jpg")), Buffer.from(body.data));
                callback();
            }
            var i = taglib.Picture.fromFullData(data, taglib.PictureType.FrontCover, "image/jpeg", "generate by lyric-finder");
            var dest = taglib.File.createFromPath(save_path)
            dest.tag.pictures = [i];
            dest.tag.title = item.title;
            dest.tag.album = item.album;
            dest.tag.performers = item.artists.split(",");
            dest.save();
            dest.dispose();
            callback();
        })
    })
}
module.exports.download_song = download_song;

function send_captcha(phone_number) {
    axios.get(host + "captcha/sent?phone=" + phone_number)
        .catch(error => console.log(error));
}
module.exports.send_captcha = send_captcha

function generate_markdown(m_path, callback) {
    var temp = path.join(__dirname, m_path);
    fs.readFile(temp, (err, data) => {
        callback(marked.marked(data.toString()));
    });
}
module.exports.generate_markdown = generate_markdown;

function fileDisplay(filePath, callback) {
    var file_list = [];
    fs.readdir(filePath, function (err, files) {
        if (err) { console.warn(err, "读取文件夹错误！") }
        else {
            for (let filename of files) {
                let filedir = path.join(filePath, filename);
                stats = fs.statSync(filedir);
                var isFile = stats.isFile(); //是文件
                // var isDir = stats.isDirectory(); //是文件夹
                if (isFile) {
                    let ext = filename.substring(filename.lastIndexOf(".") + 1, filename.length);
                    if (ext === "flac" || ext === "mp3" || ext == "wav") {
                        file_list.push(filename);
                    }
                }
                // if (isDir) {
                //     fileDisplay(filedir); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
                //}
            }
        }
        callback(file_list);
    }
    );
}

var nameofdir = "";

function core_lyric_without_trans(lbody, name, callback) {
    var lyric_org = lbody.lrc.lyric.split("\n");
    if (!lyric_org) {
        callback();
        return;
    }
    let right = lyric_org[lyric_org.length - 2].indexOf("]");
    if (right >= 10) {
        lyric_org = lyric_org.map((item) => {
            return item.substring(0, 9) + item.substring(10, item.length);
        })
        let str = "";
        for (let i = 0; ; i++) {
            if (!lyric_org[i]) {
                break;
            }
            str += lyric_org[i] + "\n";
        }
        fs.writeFileSync(nameofdir + "\\" + name + ".lrc", str);
    }
    else fs.writeFileSync(nameofdir + "\\" + name + ".lrc", lbody.lrc.lyric);
    callback()
}

function core_lyric_with_trans(lbody, name, callback) {
    var lyric_org = lbody.lrc.lyric.split("\n");
    var lyric_trans = lbody.tlyric.lyric.split("\n");
    if (!lyric_org && !lyric_trans) {
        callback();
        return;
    }
    let right = lyric_org[lyric_org.length - 2].indexOf("]");
    if (right >= 10) {
        lyric_org = lyric_org.map((item) => {
            return item.substring(0, 9) + item.substring(10, item.length);
        })
        lyric_trans = lyric_trans.map((item) => {
            return item.substring(0, 9) + item.substring(10, item.length);
        })
    }
    var str = "";
    //j=1可能会丢歌词
    var pos = 0;
    if (lyric_trans[0].substring(0, 3) === "[by") {
        pos += 1;
    }
    for (let i = 0, j = pos; ; i++) {
        if (!lyric_org[i] | !lyric_trans[j]) {
            break;
        }
        str += lyric_org[i] + "\n";
        if (lyric_org[i].substring(0, right) == lyric_trans[j].substring(0, right)) {
            str += lyric_trans[j] + "\n";
            j++;
        }
    }
    fs.writeFileSync(nameofdir + "\\" + name + ".lrc", str);
    callback();
}

function lyric_finder(filePath, callback, init) {
    nameofdir = filePath;
    fileDisplay(filePath, (data) => {
        init(data.length);
        data.forEach(async filedir => {
            try {
                var output = filedir.substring(0, filedir.lastIndexOf("."));
                var metadata = taglib.File.createFromPath(nameofdir + "\\" + filedir);
                var result = await axios.get(host + "search?keywords=" + metadata.tag.performers[0] + " " + metadata.tag.title
                    + "&limit=5");
                var sid = result.data.result.songs[0].id;
                for (var j of result.data.result.songs) {
                    if (j.name == metadata.tag.title && j.artists[0].name == metadata.tag.performers[0]) {
                        sid = j.id;
                        break;
                    }
                }
                var lyric_result = await axios.get(host + "lyric?id=" + sid);
                if (lyric_result.data.tlyric) {
                    if (lyric_result.data.tlyric.version != 0) {
                        core_lyric_with_trans(lyric_result.data, output, callback);
                        return;
                    }
                }
                core_lyric_without_trans(lyric_result.data, output, callback);
            }
            catch (err) {
                console.log(err);
                callback();
                return
            }
        });
    })
}

module.exports.lyric_finder = lyric_finder;

function cover_finder(filePath, callback, init) {
    nameofdir = filePath;
    fileDisplay(filePath, (data) => {
        init(data.length);
        data.forEach(async filename => {
            try {
                var metadata = taglib.File.createFromPath(nameofdir + "\\" + filename);
                if (metadata.tag.pictures.length != 0) {
                    callback();
                    return;
                }
                else {
                    var result = await axios.get(host + "search?keywords=" + metadata.tag.performers[0] + " " + metadata.tag.title
                        + "&limit=5");
                    var sid = result.data.result.songs[0].id;
                    for (var j of result.data.result.songs) {
                        if (j.name == metadata.tag.title && j.artists[0].name == metadata.tag.performers[0]) {
                            sid = j.id;
                            break;
                        }
                    }
                    var url = await axios.get(host + "song/detail?ids=" + sid)
                    axios({
                        url: url.data.songs[0].al.picUrl,
                        method: 'GET',
                        responseType: 'arraybuffer'
                    }).then((body) => {
                        let data = taglib.ByteVector.fromByteArray(Buffer.from(body.data, "utf-8"));
                        var i = taglib.Picture.fromFullData(data, taglib.PictureType.FrontCover, "image/jpeg", "generate by lyric-finder");
                        metadata.tag.pictures = [i];
                        metadata.save();
                        metadata.dispose();
                        callback();
                    })
                }
            }
            catch (err) {
                console.log(err);
                callback();
                return;
            }
        })
    })
}
module.exports.cover_finder = cover_finder;
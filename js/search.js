/*This is the search module which returns an object contains song's information*/

const {
    search
} = require("../NeteaseCloudMusicApi-master/main")

async function get_result(keywords,offset,callback){
    try{
        var result = await search({
            keywords:keywords,
            offset:offset ,
            limit:15  
        })
        var list = [];
        for(var i of result.body.result.songs){
            list.push({
                id:i.id,
                title:i.name,
                artists:""+i.artists.map((item)=>item.name),
                album:i.album.name
            });
        }
        return callback(list);
    }
    catch(error){
        console.log(error);
    }
}
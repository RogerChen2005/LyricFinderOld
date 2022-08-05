const {
  get_list_song,
  get_userlist,
  read_profile,
  save_profile,
  get_cover_from_song,
  user_login,
  try_listen,
  parse_id_from_url,
  get_result,
  download_cover,
  download_lyric,
  set_download_path,
  download_song,
  send_captcha,
  select_folder
} = require("../js/funcs.js")

const path = require("path")
const { ipcRenderer } = require('electron')

var player = new Vue({
  el: "#player",
  data: {
    player_icon_display: "el-icon-video-play",
    hovered: false,
    data: { album_img: "", artist: "", album: "", title: "", music_url: "#" },
    current: 0,
    duration: 100,
    is_stop: true
  },
  methods: {
    toTime(sec) { //秒数转化为mm:ss形式
      let s = sec % 60 < 10 ? ('0' + sec % 60) : sec % 60
      let min = Math.floor(sec / 60) < 10 ? ('0' + Math.floor(sec / 60)) : Math.floor(sec / 60)
      return min + ':' + s
    },
    getCurr() { //音频进度改变时触发
      this.current = parseInt(this.$refs.audio.currentTime);
    },
    showLong() { //音频加载成功后获取时长
      this.duration = parseInt(this.$refs.audio.duration);
    },
    changeLong() { //改变进度
      let ct = this.current;
      if (!isNaN(ct)) {
        this.$refs.audio.currentTime = ct;
      }
    },
    plays() { //播放暂停控制
      if (this.is_stop) {
        this.$refs.audio.play();
        this.player_icon_display = "el-icon-video-pause";
        this.is_stop = false;
      } else {
        this.$refs.audio.pause()
        this.player_icon_display = "el-icon-video-play";
        this.is_stop = true;
      }
    },
    reset(data) {
      this.data = data
      this.player_icon_display = "el-icon-video-pause";
      this.is_stop = false;
    }
  }
});


var songlistids = [];

var mainv = new Vue({
  el: '#app',
  data: function () {
    return {
      current: 1,
      loading: true,
      // visible: false ,
      activeIndex: '1',
      activeIndex2: '1',
      song_list: [],
      bitrate:[],
      checkList: [],
      checkAll: false,
      checked: [],
      isIndeterminate: false,
      d_song: true,
      d_lyric: true,
      d_cover: true,
      search_loading: true,
      options: [{value: "128000",label: '128kbps MP3'}, {
            value: '320000',label: '320kbps MP3'}, {
            value: '999000',label: '无损'}],

      /* search*/
      searchlist: [],
      searching: false,
      search: "",
      page_number: 1,
      search_offset: 0,

      /*login*/
      login: {
        phone_number: "",
        password: "",
        captcha: ""
      },
      dialogVisible: false,
      login_rule: {
        phone_number: [
          { required: true, message: '请输入手机号码', trigger: 'blur' }
        ],
      },
      cookie: "",
      avatar_img: "",
      user_id: "",
      qrimg:"",

      /*User List*/
      user_list:[],
      has_get_user_list:false,

      /*Song List Drawer*/
      drawer: {
        visible:false,
        list:[],
        list_name:"",
        current_count:0,
        total_count:0,
        id:""
      },
      drawer_loading:false,

      /*settings*/
      settings:{
        save_to_origin:false,
        download_path:path.join(__dirname,"../../download")
      }
    }
  },
  methods: {
    tosearch(page_number) {
      this.searching = true;
      get_result(this.search, page_number * 15, (data) => {
        this.searchlist = data;
        this.search_loading = false;
      });
    },
    error_msg(msg) {
      this.$message.error({
        showClose: true,
        message: msg,
        type: 'error'
      });
    },
    success_nf(msg) {
      this.$notify({
        title: '成功',
        message: msg,
        type: 'success'
      });
    },
    handleCheckAllChange(val) {
      this.checkList = val?Array.from({length: this.song_list.length}, (v, i) => i):[]; 
      this.isIndeterminate = false;
    },
    handleCheckedChange(value) {
      let checkedCount = value.length;
      this.checkAll = checkedCount === this.song_list.length;
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.song_list.length;
    },
    onLogin() {
      user_login(this.login.phone_number, this.login.password,this.login.captcha,(result) => {
        if (result.code == 502) {
          this.error_msg("用户名或者密码错误");
        }
        else if (result.code == 200) {
          this.cookie = result.cookie;
          this.avatar_img = result.profile.avatarUrl;
          this.user_id = result.profile.userId;
          this.dialogVisible = false;
          save_profile("user", {
            avatar_img: result.profile.avatarUrl,
            user_id: result.profile.userId,
            phone_number: this.login.phone_number,
            password: this.login.password,
            cookie: result.cookie
          });
          this.success_nf("登陆成功");
        }
      })
    },
    listen_temporary(args) {
      try_listen(args, (data) => {
        player.reset(data);
      });
    },
    next_page() {
      this.search_offset++;
      return this.tosearch(this.search_offset);
    },
    page_jump_to() {
      this.search_offset = this.page_number;
      return this.tosearch(this.search_offset);
    },
    delete_item(index) {
      this.song_list.splice(index, 1);
      songlistids.splice(index, 1);
    },
    add_item(item) {
      if(songlistids.indexOf(item.id) != -1){
        this.error_msg("不能重复添加同一首歌曲");
        return;
      }
      if (item.img_url){
        this.song_list.push(item);
        songlistids.push(item.id);
      }
      else get_cover_from_song(item.id, (img_url) => {
        item.img_url = img_url;
        this.song_list.push(item);
        songlistids.push(item.id);
      })
    },
    onSendcaptcha() {
      send_captcha(this.login.phone_number);
      this.success_nf("发送成功");
    },
    songlist_save() {
      save_profile("songlist", this.song_list);
      save_profile("settings", this.settings);
      this.success_nf("已保存");
    },
    get_user_list(){
      if(this.has_get_user_list){
        return;
      }
      else if(this.user_id == ""){
        error_msg("请先登录");
      }
      else{
        get_userlist(this.user_id,(data)=>{
          this.has_get_user_list = true;
          this.user_list = data;
        })
      }
    },
    open_drawer(item){
      this.drawer.visible = true;
      this.drawer_loading = true;
      this.drawer.current_count = 0;
      this.drawer.id = item.id;
      this.drawer.list_name = item.list_name;
      this.drawer.total_count = item.total;
      get_list_song(item.id,this.drawer.current_count,this.cookie,(data)=>{
        console.log(data);
        this.drawer.list = data;
        this.drawer.current_count = 30;
        this.drawer_loading = false;
      });
    },
    drawer_load(){
      this.drawer_loading = true;
      get_list_song(this.drawer.id,this.drawer.current_count,this.cookie,(data)=>{
        this.drawer.list = this.drawer.list.concat(data);
        this.drawer.visible = true;
        this.drawer.current_count += 30;
        this.drawer_loading = false;
      });
    },
    download(){
      set_download_path(this.settings.download_path);
      if(this.d_cover){
        this.checkList.map( (index) =>{
          download_cover(this.song_list[index]);
        })
      }
      if(this.d_lyric){
        this.checkList.map( (index)=>{
          download_lyric(this.song_list[index]);
        })
      }
      if(this.d_song){
        for(var br of this.bitrate){
          this.checkList.map( (index)=>{
            download_song(this.song_list[index],br,this.cookie)
          })
        }
      }
      this.success_nf("下载成功");
    },
    select_folder(){
      ipcRenderer.send('open-dialog', 'ping');
    }
  },
  computed: {
    NoMore(){
      return this.drawer.current_count >= this.drawer.total_count;
    },
    load_disabled() {
      return this.drawer_loading || this.NoMore;
    }
  },
});

ipcRenderer.on('path-reply', (event, arg) => {
  mainv.settings.download_path = arg;
});

read_profile("songlist",(data)=>{
    mainv.song_list = data;
    data.map((item)=>{
      songlistids.push(item.id);
    })
    mainv.loading = false;
})

read_profile("user",(data)=>{
  mainv.cookie = data.cookie;
  mainv.login.phone_number = data.phone_number
  mainv.login.password = data.password
  mainv.avatar_img = data.avatar_img;
  mainv.user_id = data.user_id
})

read_profile("settings",(data)=>{
  mainv.settings = data;
})

async function showW() {
  // var result = await login_qr_key()
  // var result2 = await login_qr_create({
  //   key:result.body.data.unikey,
  //   qrimg:true
  // })
  // mainv.qrimg = result2.body.data.qrimg;
  mainv.dialogVisible = true;
}
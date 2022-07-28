var player = new Vue({
      el:"#player",
      data:{
          player_icon_display:"el-icon-video-play",
          hovered:false,
          // data:{
          //   album_img:"https://p2.music.126.net/njCU7D_y3hRqQQSQmIW1lg==/109951163695044017.jpg",
          //   artist:"ODESZA",
          //   album:"A Moment Apart(Deluxe Edition)",
          //   title: "A Moment Apart" ,
          //   music_url:"http://m7.music.126.net/20220719224319/3630a8d8107d6af6e7deed283d6089d7/ymusic/obj/w5zDlMODwrDDiGjCn8Ky/14032009606/366c/59c1/f9a9/851a3034504833e71fa0e7a52716eade.mp3"
          // },
          data:{album_img:"",artist:"",album:"",title: "",music_url:"#"},
          current:0,
          duration:100,
          is_stop:true
        },
      methods:{
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
            console.log(this.progress);
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
        reset(data){
          this.data = data
          this.player_icon_display = "el-icon-video-pause";
          this.is_stop = false;
        }
      }
    });
var songlist = 
    [{
                title:"A Moment Apart",
                artists:"ODESZA",
                album:"A Moment Apart(Deluxe Edition)",
                img_url:"https://p2.music.126.net/njCU7D_y3hRqQQSQmIW1lg==/109951163695044017.jpg",
                id:1329665666
              },{
                title:"Slow Motion",
                artists:"Charlotte Lawrence",
                album:"Charlotte",
                img_url:"https://p2.music.126.net/ZUIb4dtFQYZLu0_UJWo0Yw==/109951165772941310.jpg",
                id:1824268662
              },{
                title:"Love Deserved",
                artists:"Ember Island",
                album:"Love Deserved",
                img_url:"https://p1.music.126.net/d5llkPf3NHKdHqUwoMA-jA==/109951163043879349.jpg",
                id:512358519
              }
            ];
var songlistids = [];
for(let items of songlist){
  songlistids.push(items.id);
}

var mainv = new Vue({
      el: '#app',
      data: function() {
        return { 
            current:1,
            loading:true,
            // visible: false ,
            activeIndex: '1',
            activeIndex2: '1',
            song_list:songlist,
            value: "",
            checkList: [],
            checkAll:false,
            checked:[],
            isIndeterminate:false,
            d_song:false,
            d_lyric:false,
            d_cover:false,
            search_loading:true,
            options: [{
                value: '标准',
                label: '128kbps MP3'
                }, {
                value: '基础',
                label: '256kbps MP3'
                }, {
                value: '高品质',
                label: '320kbps MP3'
                }, {
                value: 'Lossless',
                label: '无损'
                }, {
                value: 'Hi-res',
                label: 'Hi-res'
            }],

            /* search*/
            searchlist:[],
            searching:false,
            search:"",
            page_number:1,
            search_offset:0,

            /*login*/
            login:{
              phone_number:"",
              password:"",
              captcha:""
            },
            dialogVisible: false,
            login_rule:{
              phone_number:[
                 { required: true, message: '请输入手机号码', trigger: 'blur'}
              ],
              // password:[
              //   { required: true, message: '请输入密码', trigger: 'blur'}
              // ]
            },
            user_data:{
              cookie:"",
              avatar_img:"",
              user_id:""
            }
        }
      },
      methods:{
        tosearch(page_number){
          this.searching = true;
          get_result(this.search,page_number*15,(data)=>{
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
          this.checkList = val ? songlistids : [];
          this.isIndeterminate = false;
        },
        handleCheckedChange(value) {
          let checkedCount = value.length;
          this.checkAll = checkedCount === this.song_list.length;
          this.isIndeterminate = checkedCount > 0 && checkedCount < this.song_list.length;
        },
        onLogin(){
          user_login(this.login.phone_number,this.login.captcha,(result) =>{
            console.log(result);
            if(result.code == 502){
              this.error_msg("用户名或者密码错误");
            }
            else if(result.code == 200){
              this.cookie = result.cookie;
              this.avatar_img = result.profile.avatarUrl;
              this.user_id = result.profile.userId;
              this.dialogVisible = false;
              save_profile({
                avatar_img:result.profile.avatarUrl,
                user_id:result.profile.userId,
                phone_number:this.login.phone_number,
                password:this.login.password
              },{cookie:result.cookie});
              this.success_nf("登陆成功");
            }
          })
        },
        listen_temporary(args){
          try_listen(args,(data)=>{
            player.reset(data);
          });
        },
        next_page(){
          this.search_offset ++;
          return this.tosearch(this.search_offset);
        },
        page_jump_to(){
          this.search_offset = this.page_number;
          return this.tosearch(this.search_offset);
        },
        delete_item(item){
          let index = this.song_list.indexOf(item);
          this.song_list.splice(index,1);
          songlistids.splice(index,1);
        },
        add_item(item){
          get_cover_from_song(item.id,(img_url) =>{
              item.img_url = img_url;
              this.song_list.push(item);
              songlistids.push(item.id);
          })
        },
        onSendcaptcha(){
          captcha_sent({
            phone:this.login.phone_number
          });
          this.success_nf("发送成功");
        }
      }
    });
    function showW(){
      mainv.dialogVisible = true;
    }
    setTimeout(() => {
      mainv.loading = false;
    }, 2000);
var emsg;
var emsgMessages;
var emsgMessagebar;
var conversationStarted = false;
var toId;
var toAvatar;
var toName;

var app = new Framework7(
    {
        animateNavBackIcon:true,
        fastClicks:false,
        pushState:false,
        pushStateNoAnimation:true,
        sortable:false,
        swipeout:true,
        swipeoutNoFollow:true,
        swipePanelNoFollow:true,
        hideNavbarOnPageScroll:false,
        onAjaxStart:function(xhr){
            app.showIndicator();
        },
        onAjaxComplete:function(xhr) {
            app.hideIndicator();
        },
        precompileTemplates: true,
        preprocess: function (content, url, next) {
            var template = Template7.compile(content);
            var resultContent = "";
            if(url==='mine.html'||url==='me.html'){
                var user = JSON.parse(window.localStorage.getItem("user"));
                resultContent = template(user);
            }else if(url==='update-nickname.html'){
                var user = JSON.parse(window.localStorage.getItem("user"));
                var nickname = user["nickname"];
                resultContent = template({nickname:nickname});
            }else if(url==='update-gender.html'){
                var user = JSON.parse(window.localStorage.getItem("user"));
                var gender = user["gender"];
                var gender_boy = false;
                var gender_girl = false;
                if(gender=='男'){
                    gender_boy = true;
                    gender_girl = false;
                }else{
                    gender_boy = false;
                    gender_girl = true;
                }
                resultContent = template({gender_boy:gender_boy,gender_girl:gender_girl});
            }else if(url==='update-birthday.html'){
                var user = JSON.parse(window.localStorage.getItem("user"));
                var birthday = user["birthday"];
                resultContent = template({birthday:birthday});
            }else if(url==='update-email.html'){
                var user = JSON.parse(window.localStorage.getItem("user"));
                var email = user["email"];
                resultContent = template({email:email});
            }else if(url==='phonebook.html'){
                var usersData = {
                    "sn": "sn_2",
                    "service": "user",
                    "method": "contact",
                    "token":token,
                    "params": {
                        "action":"list"
                    }
                }
                $$.ajax({
                    cache: true,
                    type: 'POST',
                    url:'/request/',
                    data:'body='+JSON.stringify(usersData),
                    async: false,
                    error: function(request) {
                        app.alert("系统异常！",'');
                    },
                    dataType:"json",
                    success: function(data) {
                        if(data["success"]){
                            var users = data["entity"]["contacts"];
                            resultContent = template({users:users});
                        }else{
                            app.alert(data["entity"]["reason"]);
                        }
                    }
                });
            }else if(url.indexOf("detail.html")!=-1||url.indexOf("message.html")!=-1){
                var id = $$.parseUrlQuery(url).id;
                var infoData = {
                    "sn": "sn_4",
                    "service": "user",
                    "method": "get_user_info",
                    "token":token,
                    "params": {
                        userid:id
                    }
                }
                $$.ajax({
                    cache: true,
                    type: 'POST',
                    url:'/request/',
                    data:'body='+JSON.stringify(infoData),
                    async: false,
                    error: function(request) {
                        app.alert("系统异常！",'');
                    },
                    dataType:"json",
                    success: function(data) {
                        if(data["success"]){
                            var user = data["entity"]["user"];
                            resultContent = template(user);
                        }else{
                            app.alert(data["entity"]["reason"],'');
                        }
                    }
                });
            }else{
                resultContent = template();
            }
            return resultContent;
        }
    });
var $$ = Dom7;
var mainView = app.addView('.view-main', {
    dynamicNavbar: true
});

var token = window.localStorage.getItem("token");
if(!token||token==''){
    mainView.router.load({
        url: 'login.html',
        context:{

        }
    });
}else{
    mainView.router.load({
        url: 'msg.html',
        context:{

        }
    });
    var emsgServerInfo = JSON.parse(window.localStorage.getItem("emsg_server"));
    var user = JSON.parse(window.localStorage.getItem("user"));
    var port = 4224;
    //var port = emsgServerInfo.port;
    emsg = new Emsg({"host":emsgServerInfo.host,"port":port,"userId":user.id,"pwd":token,"suffix":"@"+emsgServerInfo.domain,
        "successHandle":messageHandler,"failHandle":function(msg){
            console.log("错误了：" + msg);
        }
    });
}

//初始化消息页面
app.onPageBeforeAnimation('me', function (page) {
    $$("#info-photo").on("click",function(e){
        e.preventDefault();
        $$("#file_upload").trigger('click');
    });
    $$("#file_upload").on("change",function(e){
        var file = this.files[0];
        var file_size = file.size;
        if(!file)return;
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {

        }
    });
    function imageUpload(){

    }
});
//初始化消息页面
app.onPageBeforeAnimation('msg', function (page) {

});
//初始化消息页面
app.onPageBeforeAnimation('update-nickname', function (page) {
    $$(".save-btn").on("click",function(e){
        saveInfo("nickname");
    })
});
//初始化消息页面
app.onPageBeforeAnimation('update-birthday', function (page) {
    $$(".save-btn").on("click",function(e){
        saveInfo("birthday");
    })
});
//初始化消息页面
app.onPageBeforeAnimation('update-email', function (page) {
    $$(".save-btn").on("click",function(e){
        saveInfo("email");
    })
});
//初始化消息页面
app.onPageBeforeAnimation('update-gender', function (page) {
    $$(".save-btn").on("click",function(e){
        saveInfo("gender");
    })
});
//初始化消息页面
app.onPageBeforeAnimation('phonebook', function (page) {
    $$("#contacts").on("click",".swipeout-actions-right a",function(){

    })
});

var chat_user = {};

//初始化消息页面
app.onPageBeforeAnimation('detail', function (page) {
    $$(".toolbar").remove();
    var messageBarHtml = Template7.templates.defaultBarTemplate();
    $$(".view").append(messageBarHtml);
    var url = page.url;
    var param = $$.parseUrlQuery(url);
    var isFriend = param.isFriend;
    if(isFriend==='0'){
        $$(".add-button").show().on("click",function(){
            var addData = {
                "sn": "sn_4",
                "service": "user",
                "method": "contact",
                "token":token,
                "params": {
                    "action":"add",
                    "contact_id":param.id
                }
            }
            $$.ajax({
                cache: true,
                type: 'POST',
                url:'/request/',
                data:'body='+JSON.stringify(addData),
                async: false,
                error: function(request) {
                    app.alert("系统异常！",'');
                },
                dataType:"json",
                success: function(data) {
                    if(data["success"]){
                        app.alert("已发送",'');
                    }else{
                        app.alert(data["entity"]["reason"],'');
                    }
                }
            });
        });
        $$(".chat-button").hide();
    }else{
        $$("#detail_back").find("span").text("通讯录");
        $$("#detail_back").find("a").attr("href","phonebook.html");
        $$(".add-button").hide();
        $$(".chat-button").show().on("click",function(){

        });
    }
});

//初始化消息页面
app.onPageBeforeAnimation('message', function (page) {
    $$(".toolbar").remove();
    var messageBarHtml = Template7.templates.messageBarTemplate();
    $$(".view").append(messageBarHtml);
    emsgMessages = app.messages('.messages', {
        autoLayout:true
    });
    emsgMessagebar = app.messagebar('.messagebar');

    var user = JSON.parse(window.localStorage.getItem("user"));
    var fromId = user.id;
    var toUser = app.formToJSON("#to-user");
    toId = toUser.id;
    toAvatar = toUser.icon;
    toName = toUser.nickname;
    $$('.messagebar .link').on('click', function () {
        // Message text
        var messageText = emsgMessagebar.value().trim();
        // Exit if empy message
        if (messageText.length === 0) return;

        // Empty messagebar
        emsgMessagebar.clear();

        // 随机消息类型
        //var messageType = (['sent', 'received'])[Math.round(Math.random())];

        // Add message
        emsgMessages.addMessage({
            // Message text
            text: messageText,
            // 随机消息类型
            type: 'sent',
            // 日期
            day: !conversationStarted ? 'Today' : false,
            time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
        })
        emsg.send(messageText,toId,1);
        // 更新会话flag
        conversationStarted = true;
    });
});

//初始化消息页面
app.onPageBeforeAnimation('add', function (page) {
    $$("#users-table").hide();
    $$(".search-btn").on("click",function(){
        var formData = app.formToJSON('#search-form');
        if(formData.info==''){
            app.alert('请输入搜索条件','');
        }
        var friend = formData.info;
        var param = {};
        if(friend.indexOf("@")!=-1){
            param["email"] = friend;
        }else{
            param["nickname"] = friend;
        }
        var searchData = {
            "sn": "sn_4",
            "service": "user",
            "method": "find_user",
            "token":token,
            "params": param
        }
        $$.ajax({
            cache: true,
            type: 'POST',
            url:'/request/',
            data:'body='+JSON.stringify(searchData),
            async: false,
            error: function(request) {
                app.alert("系统异常！",'');
            },
            dataType:"json",
            success: function(data) {
                if(data["success"]){
                    var users = data["entity"]["user_list"];
                    if(users.length==0){
                        return;
                    }
                    var userlistHtml = Template7.templates.usersTemplate({users:users});
                    $$("#users-table").show().html(userlistHtml);
                }else{
                    app.alert(data["entity"]["reason"],'');
                }
            }
        });
    })
});

//初始化消息页面
app.onPageBeforeAnimation('reg', function (page) {
    $$(".reg-button").on("click",function(){
        var param = app.formToJSON('#save-form');
        var email = param.email;
        if(email==''){
            app.alert('邮箱不能为空！','');
            return;
        }
        var username = param.username;
        if(username==''){
            app.alert('用户名不能为空！','');
            return;
        }
        var password = param.password;
        if(password==''){
            app.alert('密码不能为空！','');
            return;
        }
        var nickname = param.nickname;
        if(nickname==''){
            app.alert('昵称不能为空！','');
            return;
        }
        var birthday = param.birthday;
        if(birthday==''){
            app.alert('生日不能为空！','');
            return;
        }
        param.birthday = birthday.replace(/[年|月|日]/g,'-');
        var regData = {
            "sn": "sn_1",
            "service": "user",
            "method": "register",
            "params": param
        }
        $$.ajax({
            cache: true,
            type: 'POST',
            url:'/request/',
            data:'body='+JSON.stringify(regData),
            async: false,
            error: function(request) {
                app.alert("系统异常！",'');
            },
            dataType:"json",
            success: function(data) {
                if(data["success"]){
                    token = data["entity"]["token"];
                    localStorage.setItem("token",token);
                    localStorage.setItem("emsg_server",JSON.stringify(data["entity"]["emsg_server"]));
                    localStorage.setItem("user",JSON.stringify(data["entity"]["user"]));
                    app.alert("注册成功",'',function(){
                        mainView.router.load({
                            url: 'msg.html'
                        });
                        var emsgServerInfo = JSON.parse(window.localStorage.getItem("emsg_server"));
                        var user = JSON.parse(window.localStorage.getItem("user"));
                        var port = 4224;
                        //var port = emsgServerInfo.port;
                        emsg = new Emsg({"host":emsgServerInfo.host,"port":port,"userId":user.id,"pwd":token,"suffix":"@"+emsgServerInfo.domain,
                            "successHandle":messageHandler,"failHandle":function(msg){
                                console.log("错误了：" + msg);
                            }
                        });
                    });
                }else{
                    app.alert(data["entity"]["reason"],'');
                }
            }
        });
    })
});

function saveInfo(key){
    var param = app.formToJSON('#save-form');
    if(param[key]==undefined||param[key]==''){
        app.alert('请输入！','');
        return;
    }
    if(key=="birthday"){
        var birthday = param[key];
        birthday = birthday.replace(/[年|月|日]/g,'-');
    }
    var saveData = {
        "sn": "sn_4",
        "service": "user",
        "method": "update_user_info",
        "token":token,
        "params": param
    }
    $$.ajax({
        cache: true,
        type: 'POST',
        url:'/request/',
        data:'body='+JSON.stringify(saveData),
        async: false,
        error: function(request) {
            app.alert("系统异常！",'');
        },
        dataType:"json",
        success: function(data) {
            if(data["success"]){
                var user = JSON.parse(window.localStorage.getItem("user"));
                user[key] = param[key];
                localStorage.setItem("user",JSON.stringify(user));
                mainView.router.load({url:"me.html"});
            }else{
                app.alert(data["entity"]["reason"],'');
            }
        }
    });
}

function messageHandler(data){
    console.log(data);
    if(data.delay && data.delay.packets){
        //$.each(data.delay.packets,function(i,obj){
        //    var name = obj.envelope["from"].substr(0,obj.envelope["from"].indexOf("@"));
        //    var content = obj.payload.content.toString();
        //    var msgHtml = "<div class=\"accept_content_div\"><ul><li class=\"text_right\">"+name+"</li><li class=\"text_right accept_content_li\">"+content+"</li></ul></div>";
        //    $(".chat").append(msgHtml)
        //});
    }else if(data.envelope && data.envelope.type == 1){
        var obj = data;
        var content = obj.payload.content.toString();
        var messageType = obj.payload.attrs.messageType;
        console.log(messageType);
        if(messageType=='text'){
            emsgMessages.addMessage({
                // Message text
                text: content,
                // 随机消息类型
                type: 'received',
                avatar: toAvatar,
                name: toName,
                // 日期
                day: !conversationStarted ? 'Today' : false,
                time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
            })
        }else if(messageType=='image'){
            emsgMessages.addMessage({
                // Message text
                text: '<img src="data:image/png;base64,'+content+'">',
                // 随机消息类型
                type: 'received',
                avatar: toAvatar,
                name: toName,
                // 日期
                day: !conversationStarted ? 'Today' : false,
                time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
            })
        }else if(messageType=='audio'){
            emsgMessages.addMessage({
                // Message text
                text: '语音消息app收听',
                // 随机消息类型
                type: 'received',
                avatar: toAvatar,
                name: toName,
                // 日期
                day: !conversationStarted ? 'Today' : false,
                time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
            })
        }
    }
}

//初始化登录页面
app.onPageBeforeAnimation('login', function (page) {
    $$(".login-button").on("click",function(){
        var formData = app.formToJSON('#login-form');
        if(formData.username==''){
            app.alert('请输入用户名','');
            return;
        }
        if(formData.password==''){
            app.alert('请输入密码','');
            return;
        }
        var loginData = {
            "sn": "sn_2",
            "service": "user",
            "method": "login",
            "params": formData
        }

        $$.ajax({
            cache: true,
            type: 'POST',
            url:'/request/',
            data:'body='+JSON.stringify(loginData),
            async: false,
            error: function(request) {
                app.alert('系统异常！','');
            },
            dataType:"json",
            success: function(data) {
                if(data["success"]){
                    token = data["entity"]["token"];
                    localStorage.setItem("token",token);
                    localStorage.setItem("emsg_server",JSON.stringify(data["entity"]["emsg_server"]));
                    localStorage.setItem("user",JSON.stringify(data["entity"]["user"]));
                    var emsgServerInfo = JSON.parse(window.localStorage.getItem("emsg_server"));
                    var user = JSON.parse(window.localStorage.getItem("user"));
                    var port = 4224;
                    //var port = emsgServerInfo.port;
                    emsg = new Emsg({"host":emsgServerInfo.host,"port":port,"userId":user.id,"pwd":token,"suffix":"@"+emsgServerInfo.domain,
                        "successHandle":messageHandler,"failHandle":function(msg){
                            console.log("错误了：" + msg);
                        }
                    });
                    mainView.router.load({
                        url: 'msg.html',
                        context: {
                            tel: '(999)-111-22-33',
                            email: 'contact@john.doe'
                        },
                        force:true
                    });
                }else{
                    if(data["entity"]["code"]=1000){
                        app.alert("用户名或密码错误",'');
                    }else{
                        app.alert("系统异常！",'');
                    }
                }
            }
        });
    });
    $$(".reg-button").on("click",function(){
        mainView.router.load({
            url: 'reg.html'
        });
    })
});
//初始化我的页面
app.onPageBeforeAnimation('mine', function (page) {
    $$(".check-version").on("click",function(){
        app.alert("当前版本号:1.0","");
    });
    $$(".log-out").on("click",function(){
        var logoutData = {
            "sn":"sn_9",
            "service":"user",
            "method":"logout",
            "token":token,
            "params": {}
        };
        $$.ajax({
            cache: true,
            type: 'POST',
            url:'/request/',
            data:'body='+JSON.stringify(logoutData),
            async: false,
            error: function(request) {
                app.alert("系统异常！",'');
            },
            dataType:"json",
            success: function(data) {
                if(data["success"]){
                    window.localStorage.clear();
                    mainView.router.load({
                        url: 'login.html',
                        context:{

                        }
                    });
                    emsg.logout();
                }else{
                    app.alert(data["entity"]["reason"],'');
                }
            }
        });
    });
    $$(".user-info").on("click",function(){
        mainView.router.load({
            url: 'me.html',
            context: {
                tel: '(999)-111-22-33',
                email: 'contact@john.doe'
            }
        });
    });
});
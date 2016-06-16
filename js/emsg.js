var Emsg = function (options){
	this.host = '192.168.0.214';
	this.port = options.port;
	this.time = options.time | 50000;
	this.userId = options.userId;
	this.pwd = options.pwd;
	this.ackFlag = '\\02\\01'; // 用字符串表示为 "\02\01",即心跳请求+结束符
	this.killFlag = "\\03\\01";
	this.successHandle = options.successHandle;
	this.failHandle = options.failHandle;
	this.ws;
	this.resource = this.uuid();
	this.url = "ws://"+ this.host +":"+ this.port +"";
	this.suffix = options.suffix; // 连接服务的域
	this.init(); //连接webscoket
	this.messageQueue = {}; // 消息队列
}
var sendAckNum = 0;// 发送心跳计数
var acceptAckNum = 0;//丢失的包计数
var timer;
var handleMessageTimer;
Emsg.prototype = {
	init:function(){
		var that = this;
		if(!that.successHandle){
			throw new Error("successHandle is not null");
		}
		if(!that.failHandle){
			throw new Error("failHandle is not null");
		}
		if(!that.userId){
			that.failHandle("userId is not null");
		}
		if(!that.pwd){
			that.failHandle("pwd is not null");
		}
		that.ws = new WebSocket(that.url); // 建立连接
		that.ws.onopen = function(evt) {
			console.log("login success！" , evt);
			var packet = {
			    "envelope":{
				"id":that.uuid(),
				"type":0,
				"jid":that.userId + that.suffix+"/"+that.resource,
				"pwd":that.pwd
			  },
			  "vsn":"0.0.1"
			}
			console.log(packet);
			that.ws.send(JSON.stringify(packet));
			timer = setInterval(function(){ // 定时发送心跳
				that.ws.send(that.ackFlag);
				sendAckNum++;
				if(sendAckNum - acceptAckNum == 2){// 当发送心跳丢失两次就尝试重新连接
					that.ws = new WebSocket(that.url);
					sendAckNum = 0;
					acceptAckNum = 0;
					clearInterval(timer);
					clearInterval(handleMessageTimer);
				}
			},that.time);
			handleMessageTimer = setInterval(function(){
				for(var m in that.messageQueue){
					that.messageQueue[m].count++;
					if(that.messageQueue[m].count == 5){
						that.ws.send(JSON.stringify(that.messageQueue[m].msg));
						that.messageQueue[m].count = 0;
					}
				}
			},10000);// 处理未达消息
		};
		that.ws.onmessage = function(evt) {
			console.log("accept message !" , evt);
			var data = evt.data;
			if(data === that.ackFlag){
				acceptAckNum++;
				return;
			}
			if(data === that.killFlag){
				clearInterval(timer);
				clearInterval(handleMessageTimer);
				that.failHandle("");// 被服务器关闭连接时通知客户端
				return;
			}
			data = data.substr(0,data.length - 1);
			var d = JSON.parse(data);
			if(d.envelope && d.envelope.type == 3){ // type状态同步：可以实现消息的事件同步，例如：已送达、已读 等
				for(var m in that.messageQueue){
					if(that.messageQueue[m].msg.envelope.id == d.envelope.id){
						delete that.messageQueue[m];
					}
				}
			}else if(d.envelope.type == 0 ){
				if(d.entity.result === "ok"){
					var _from = that.userId + that.suffix; // 发送人
					if(d.delay && d.delay.total > 0 ){
						var msg = {"envelope":{"id":d.envelope.id,"type":3,"from":_from,"to":"server_ack"},"vsn":"0.0.1"};
						msg = JSON.stringify(msg);
						that.ws.send(msg);// 收到消息给服务器发送一个确认收到消息的回执
					}
					that.successHandle(d);
				}else{
					that.failHandle(d.entity.reason);
				}
			}else if(d.envelope.type == 1){
				that.successHandle(d);
			}
		};
		that.ws.onclose = function(evt) {
			console.log("WebSocketClosed!" ,evt);
			var data = evt.data;
			if(timer){
				clearInterval(timer);
			}
			if(handleMessageTimer){
				clearInterval(handleMessageTimer);
			}
			if(that.killFlag !== data){
				closeTimer = setInterval(function(){
					/**
					const unsigned short CONNECTING = 0;
					const unsigned short OPEN = 1;
					const unsigned short CLOSING = 2;
					const unsigned short CLOSED = 3;
					**/
					if(that.ws.readyState == 3){
						//that.init();
					}else{
						clearInterval(closeTimer);
					}
				},1000);
			}
		};

		that.ws.onerror = function(evt) {
			console.log("WebSocketError!",evt);
			console.error("connection server error,Trying to connect");
			if(timer){
				clearInterval(timer);
			}
			if(handleMessageTimer){
				clearInterval(handleMessageTimer);
			}
		};
	},
	singleChat:function(content,to){
		var _from = this.userId + this.suffix; // 发送人
		var to = to + this.suffix; // 接收人
		var msg = {"payload":{"content":content},"envelope":{"id":this.uuid(),"type":1,"from":_from,"to":to,"ack":1},"vsn":"0.0.1"}; // 发送消息数据结构
		this.ws.send(msg);
	},
	manyChat:function(content,groupId){
		var _from = this.userId + this.suffix; // 发送人
		var msg = {"payload":{"content":content},"envelope":{"id":this.uuid(),"type":2,"from":_from,"gid":groupId,"ack":1},"vsn":"0.0.1"}; // 发送消息数据结构
		this.ws.send(msg);
	},
	send:function(content,to,type){
		var _from = this.userId + this.suffix+"/"+this.resource; // 发送人
		var to = to + this.suffix; // 接收人
		var id = this.uuid();
		var msg = {"payload":{"content":content,"attrs":{"messageType":"text"}},"envelope":{"id":id,"type":type,"from":_from,"to":to,"ack":1},"vsn":"0.0.1"}; // 发送消息数据结构
		console.log(msg);
		this.messageQueue[id] = {"msg":msg,"count":0}
		this.ws.send(JSON.stringify(msg));
	},
	uuid:function(){
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
		var uuid = s.join("");
		return uuid;
	},
	logout:function(){ // 退出回话
		if(timer){
			clearInterval(timer);
		}
		if(handleMessageTimer){
			clearInterval(handleMessageTimer);
		}
		this.ws.close();
	}
}
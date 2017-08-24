'use strict'
var sha1=require('sha1');
var Wechat=require('./wechat.js');
var raw_body=require("raw-body");
var util=require('./util.js');
module.exports=function(opts,handler){
	var wechat=new Wechat(opts);
	//入口接入验证
	return function *(next){
		var that=this;
		console.log(this.query);
		var token=opts.token;
		var signature=this.query.signature;
		var nonce=this.query.nonce;
		var timestamp=this.query.timestamp;
		var echostr=this.query.echostr;
		//排序
		var str=[token,timestamp,nonce].sort().join('');
		var sha=sha1(str);
		if(this.method=="GET")
		{
			//判断是否相等
			if(sha===signature)
			{
				this.body=echostr+'';
			}
			else
			{
				this.body='warring';
			}
		}
		else if(this.method=="POST")
		{
			if(sha!==signature)
			{
				 this.body='wrong';
				 return false;
			}
			else
			{
				//获取异步过来的xml
				var data=yield raw_body(this.req,{
					length:this.length,
					limit:'1mb',
					encoding:this.charset
				})
				//console.log(data.toString());
				//将xml——>json
				var content=yield util.parseXMLAsync(data);
				//将json的键值对装换成  k->v
				var message=util.formatMessage(content.xml);
				console.log(message);
				this.weixin=message;
				//这是写死的回复文本不可以这么写
				/*if(message.MsgType==='event')
				{
					if(message.Event==='subscribe')
					{
						var now=new Date().getTime();
						that.status=200;
						that.type='application/xml';
						//使用字符串拼接
						that.body='<xml>'+
									'<ToUserName><![CDATA['+message.FromUserName+']]></ToUserName>'+
									'<FromUserName><![CDATA['+message.ToUserName+']]></FromUserName>'+
									'<CreateTime>'+now+'</CreateTime>'+
									'<MsgType><![CDATA[text]]></MsgType>'+
									'<Content><![CDATA[你好]]></Content>'+
									'</xml>';
						return;
					}
				}*/
				//暂停这里 走向外层逻辑改变上下文
				yield handler.call(this,next);
				//外层逻辑处理完逻辑
				wechat.reply.call(this)
			}
		}
	}
}

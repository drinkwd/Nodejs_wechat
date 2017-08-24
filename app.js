'use strict'
//入口文件
var Koa=require('koa');
var wechat=require('./wechat/g.js');
var Wechat=require('./wechat/wechat.js');
var path=require('path');
var util=require('./libs/util.js');
var config=require('./config.js');
var weixin=require('./weixin.js');
var crypto=require('crypto');
var ejs=require('ejs');
var heredoc=require('heredoc');
var tpl=heredoc(function(){/*
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>搜电影</title>
	<meta name='viewpoint' content='initial-scale=1,maximum-scale=1,minimum-scale=1'>
</head>
<body>
	<h1>点击标题开始录音翻译</h1>
	<p id='title'></p>
	<div id='directors'></div>
	<div id=year></div>
	<div id='poster'></div>
	<script src='http://zeptojs.com/zepto-docs.min.js'></script>
	<script src='https://res.wx.qq.com/open/js/jweixin-1.2.0.js'></script>
	<script>
		wx.config({
	    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
	    appId: 'wx7ab3fcdc4b4bb6a7', // 必填，公众号的唯一标识
	    timestamp: '<%=timestamp%>', // 必填，生成签名的时间戳
	    nonceStr: '<%=noncestr%>', // 必填，生成签名的随机串
	    signature: '<%=signature%>',// 必填，签名，见附录1
	    jsApiList: [
	    'startRecord',
		'stopRecord',
		'onVoiceRecordEnd', 
		'translateVoice',
		'onMenuShareTimeline',
		'onMenuShareAppMessage',
		'onMenuShareQQ',
		'onMenuShareWeibo',
		'previewImage'
] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
});
	wx.ready(function(){
    // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
	wx.checkJsApi({
    jsApiList: ['startRecord'], // 需要检测的JS接口列表
    success: function(res) {
    	console.log(res);
        // 以键值对的形式返回，可用的api值true，不可用为false
        // 如：{"checkResult":{"onVoiceRecordEnd":true},"errMsg":"checkJsApi:ok"}
    }
});
	var shareContent={
	    title: 'ahahah', // 分享标题
	    desc: '我是谁', // 分享描述
	    link: 'http://drinkwd.pagekite.me/movie', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
	    imgUrl: 'https://res.wx.qq.com/mpres/htmledition/images//bg/bg_login_banner_v5218877.jpg', // 分享图标
	    success: function () { 
	        window.alert("分享成功");
	    },
	    cancel: function () { 
	       window.alert("分享失败") // 用户取消分享后执行的回调函数
	    }
	}
	wx.onMenuShareAppMessage(shareContent);
	var isRecording=false
	var slides;
	$('#poster').on('tap',function(){
		wx.previewImage(slides);
	})
	$('h1').on('tap',function(){
		if(!isRecording){
			isRecording=true;
			wx.startRecord({
				cancel:function(){
					window.alert("那就不能搜了哦");
				}
			});
			return ;
		}
		isRecording=false;
		wx.stopRecord({
    	success: function (res) {
        var localId = res.localId;
        wx.translateVoice({
  		localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
    	isShowProgressTips: 1, // 默认为1，显示进度提示
    	success: function (res) {
    		var result=res.translateResult;
        //alert(res.translateResult); // 语音识别的结果
        $.ajax({
			type:'get',
			url:'https://api.douban.com/v2/movie/search?q='+result,
			dataType:'jsonp',
			jsonp:'callback',
			success:function(data){
				var subject=data.subjects[0];
				$('#directors').html(subject.directors[0].name);
				$('#title').html(subject.title);
				$('#year').html(subject.year);
				$('#poster').html('<img src="'+subject.images.large+'">');
				shareContent={
				title:subject.title , // 分享标题
				    desc: '我搜出来了'+subject.title, // 分享描述
				    link: 'http://drinkwd.pagekite.me/movie', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
				    imgUrl: subject.images.large, // 分享图标
				    type: 'link', // 分享类型,music、video或link，不填默认为link
				    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
				    success: function () { 
				        window.alert("分享成功");
				    },
				    cancel: function () { 
				       window.alert("分享失败") // 用户取消分享后执行的回调函数
				    }
				}
				slides={
						 current: 'subject.images.large',
						 urls: [subject.images.large]
				}
				data.subjects.forEach(function(item){
					slides.urls.push(item.images.large)
				})
				wx.onMenuShareAppMessage(shareContent);
			}
        })
    },fail:function(){
		window.alert('你说的我没有听懂');
    }
});
    },fail:function(){
		window.alert('请你再说一遍呗');
    }
});
	})
});
	</script>
</body>
</html>
*/})
var app=new Koa();
var _sign = function(noncestr, ticket, timestamp, url) {
   var params = [
     'noncestr=' + noncestr,
    'jsapi_ticket=' + ticket,
    'timestamp=' + timestamp,
     'url=' + url
   ]
   var str = params.sort().join('&')
   var shasum = crypto.createHash('sha1');
 
   shasum.update(str)
 
   return shasum.digest('hex')
 }
var createNonce=function(){
	return Math.random().toString(36).substr(2,15);
}
var createTimestamp=function(){
	return parseInt(new Date().getTime()/1000)+'';
}
function sign(ticket,url){
	var noncestr = createNonce()
   var timestamp = createTimestamp()
   var signature = _sign(noncestr, ticket,timestamp,url);
   //console.log(ticket);
   //console.log(url);
   return {
     noncestr: noncestr,
     timestamp: timestamp,
     signature: signature
   } 
}
//Koa的中间件必须是一个生存期函数
app.use(function *(next){
	if(this.url.indexOf('/movie')>-1){
		var wechatApi=new Wechat(config.wechat)	
		var data = yield wechatApi.fetchAccessToken()
 	  	var access_token = data.access_token
 	  	var ticketData = yield wechatApi.fetchTicket(access_token)
 	  	var ticket = ticketData.ticket
 	  	var url = this.href;
 	  	var params = sign(ticket, url);
 	  	//console.log(params);
		this.body=ejs.render(tpl,params);
		return next
	}
	yield next;
})
app.use(wechat(config.wechat,weixin.reply))
app.listen(1234);
console.log('Listen successful');
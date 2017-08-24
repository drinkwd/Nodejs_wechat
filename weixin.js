'use strict'
var config=require('./config.js');
var Wechat=require('./wechat/wechat.js');
var wechatApi=new Wechat(config.wechat);
var menu=require('./menu.js');
 exports.reply=function*(next){
 	wechatApi.deleteMenu().then(function(){
				return wechatApi.createMenu(menu);
			}).then(function(msg){
				console.log(msg);
			})
 	var message=this.weixin;
 	if(message.MsgType=='event')
 	{
 		if(message.Event==='subscribe'){
 			if(message.EventKey)
 			{
 				console.log('扫二维码进来'+message.EventKey+' '+message.ticket);
 			}
 			this.body='哈哈你订阅了这个号\n'+
 			'点击<a href="http://drinkwd.pagekite.me/movie">语音查询电影</a>'
 		}
 		else if(message.Event==='unsubscribe'){
 			console.log('无情取关');
 			this.body='';
 		}
 		else if (message.Event==='LOCATION') {
 			this.body='您上报的位置是'+message.Latitude+'/'+message.Longitude+'-'+message.Precision;
 		}
 		else if (message.Event==='CLICK')
 		{
 			this.body='您点击了菜单'+message.EventKey;
 		} 
 		else if (message.Event==='SCAN')
 		{
 			console.log('关注扫描二维码'+message.EventKey+' '+message.ticket);
 			this.body='看到你扫了一下哦';
 		} 
 		else if (message.Event==='scancode_push'){
 			console.log(message.ScanCodeInfo.ScanType);
 			console.log(message.ScanCodeInfo.ScanResult);
 			this.body='你点击中了菜单'+message.EventKey;
 		} 
 		else if (message.Event==='scancode_waitmsg'){
 			console.log(message.ScanCodeInfo.ScanType);
 			console.log(message.ScanCodeInfo.ScanResult);
 			this.body='你点击中了菜单中'+message.EventKey;
 		} 
 		else if (message.Event==='pic_sysphoto'){
 			console.log(message.SendPicsInfo.PicList);
 			console.log(message.SendPicsInfo.Count);
 			this.body='你点击中了菜单中'+message.EventKey;
 		} 
 		else if (message.Event==='pic_photo_or_album'){
 			console.log(message.SendPicsInfo.PicList);
 			console.log(message.SendPicsInfo.Count);
 			this.body='你点击中了菜单中'+message.EventKey;
 		}  
 		else if (message.Event==='pic_weixin'){
 			console.log(message.SendPicsInfo.PicList);
 			console.log(message.SendPicsInfo.Count);
 			this.body='你点击中了菜单中'+message.EventKey;
 		}
 		else if (message.Event==='location_select'){
 			console.log(message.SendLocationInfo.Location_Y);
 			console.log(message.SendLocationInfo.Location_X);
 			console.log(message.SendLocationInfo.Scale);
 			console.log(message.SendLocationInfo.Label);
 			console.log(message.SendLocationInfo.Poiname);
 			this.body='你点击中了菜单中'+message.EventKey;
 		} 
 		else if (message.Event==='media_id'){
 			this.body='你点击中了菜单中'+message.EventKey;
 		} 
 		else if (message.Event==='view_limited'){
 			this.body='你点击中了菜单中'+message.EventKey;
 		} 
 	}
 	else if (message.MsgType=='text') {
		var content=message.Content;
 		var reply='你说的'+message.Content+'太复杂了';
 		if(content==='1')
 		{
 			reply='回复1';
 		}
 		else if (content==='2') {
 			reply='回复2';
 		}
 		else if(content==='4')
 		{
 			reply=[{
 				title:'hahha',
 				description:'xixi',
 				PicUrl:'http://img4.imgtn.bdimg.com/it/u=2730485761,138060261&fm=28&gp=0.jpg',
 				Url:'http:www.baidu.com'
 			}]
 		}
 		else if(content==='5')
 		{
 			var data=yield	wechatApi.uploadMaterial('image',__dirname+'/2.png');
 			reply={
 				type:'image',
 				media_id:data.media_id
 			}
 		}
 		else if(content==='6')
 		{
 			var data=yield wechatApi.uploadMaterial('video',__dirname+'/1.mp4');
 			reply={
 				type:'video',
 				title:'这个是视频啊',
 				description:'我求求你了',
 				media_id:data.media_id
 			}
 		}
 		else if(content==='7')
 		{
 			var data=yield	wechatApi.uploadMaterial('image',__dirname+'/2.png');
 			reply={
 				type:'music',
 				title:'这个是音乐啊',
 				description:'让我们来添加一些音乐吧',
 				media_id:data.media_id,
 				MUSIC_Url:__dirname+'1.mp3'
 			}
 		}
 		else if(content==='8')
 		{
 			var data=yield	wechatApi.uploadMaterial('image',__dirname+'/2.png',{type:'image'});
 			console.log(data);
 			reply={
 				type:'image',
 				media_id:data.media_id
 			}
 		}
 		else if(content==='9')
 		{
 			var data=yield wechatApi.uploadMaterial('video',__dirname+'/1.mp4',
 				{type:'video',description:'{"title":"1",introduction:"2"}'});
 			console.log(data);
 			reply={
 				type:'video',
 				title:'这个是视频啊',
 				description:'我求求你了',
 				media_id:data.media_id
 			}
 		}
 		else if(content==='10')
 		{
 			var picData=yield wechatApi.uploadMaterial('image',__dirname+'/2.png',
 				{});
 			console.log(picData);
 			var media={
 				"articles": [{
		      "title": '哈哈哈',
		      "thumb_media_id": picData.media_id,
		      "author": 'dinkwd',
		      "digest": 'no digest',
		      "show_cover_pic": 1,
		      "content": 'no content',
		      "content_source_url": 'http://www.baidu.com'
   				}] 
 			}
 			var data=yield wechatApi.uploadMaterial('news',media,{});
 			console.log(data);
 			var data=yield wechatApi.fetchMaterial(data.media_id,'news',{});
 			console.log(data);
 			var items=data.news_item;
 			console.log(items);
 			var news=[];
 			items.forEach(function(item){
 				news.push({
 					"title":item.title,
				    'description':item.digest,
				    'PicUrl':picData.url,
				    'url':item.url
 				})
 			})
 				
 				reply=news;
 			
 		}
 		else if(content==='11')
 		{
 			var counts=yield wechatApi.countMaterial();
 			console.log(JSON.stringify(counts));
 			var result=yield [
 			wechatApi.batchMaterial({
 				offset:0,
 				count:10,
 				type:'image'
 			}),
 			wechatApi.batchMaterial({
 				offset:0,
 				count:10,
 				type:'video'
 			}),
 			wechatApi.batchMaterial({
 				offset:0,
 				count:10,
 				type:'news'
 			}),wechatApi.batchMaterial({
 				offset:0,
 				count:10,
 				type:'voice'
 			})
 			];
 			console.log(JSON.stringify(result));
 		/*	var list=yield wechatApi.batchget_material({
 				offset:0,
 				count:10,
 				type:'image'
 			})
 			var list1=yield wechatApi.batchget_material({
 				offset:0,
 				count:10,
 				type:'video'
 			})
 			var list2=yield wechatApi.batchget_material({
 				offset:0,
 				count:10,
 				type:'news'
 			})
 			var list3=yield wechatApi.batchget_material({
 				offset:0,
 				count:10,
 				type:'voice'
 			})*/
 		}
 		else if(content==='12')
 		{
 			/*var group=yield	wechatApi.createGroup('drinkwd5');
 			console.log('新分组drinkwd5');
 			console.log(group);
 			var groups=yield wechatApi.fetchGroup();
 			console.log('加入drinkwd5后的分组列表');
 			console.log(groups);
 			var groups2=yield wechatApi.checkGroup(message.FromUserName);
 			console.log('查看自己的分组');
 			console.log(groups2);
 			var groups3=yield wechatApi.updateGroup(101,'xixi');
 			console.log('101改名为xixi');
 			console.log(groups3);
 			var group4=yield wechatApi.fetchGroup();
 			console.log('查看改名之后的分组列表');
 			console.log(group4);
 			var group5=yield wechatApi.deleteGroup(106);
 			console.log("删除id=106")
 			console.log(group5);
 			var group6=yield wechatApi.fetchGroup();
 			console.log('查看删除106之后的分组列表');
 			console.log(group6);*/
 			var group7=yield wechatApi.batchGroup([message.FromUserName],101);
 			console.log("将自己移动到103")
 			console.log(group7);
 			var group8=yield wechatApi.fetchGroup();
 			console.log('查看移动之后的分组列表');
 			console.log(group8);
 			reply=' Group Successful';
 		}
 		else if(content==='13'){
 			var user=yield wechatApi.fetchUser(message.FromUserName,'en');
 			console.log(message.FromUserName);
 			console.log(user);
 			var openIds=[
 			{
 				openid:message.FromUserName,
 				lang:'en'
 			}
 			];
 			var users=yield wechatApi.fetchUser(openIds)
 			console.log('users');
 			reply=JSON.stringify(user);
 		}
 		else if(content==='14'){
 			var listUser=yield wechatApi.listUsers(message.FromUserName);
 			console.log(listUser);
 			reply=listUser.total;
 		}
 		else if(content==='15'){
 			var mpnews={
 				media_id:'RAdJVECjcgfw8wLtrRyI-hDys48Sq4Z1ZyH8odhKvs0'
 			}
 			var massDate=yield wechatApi.sendBytags('mpnews',mpnews,103);
 			console.log(massDate);
 			reply='Yeah';
 		}
 		else if(content==='16'){
 			var mpnews={
 				media_id:'RAdJVECjcgfw8wLtrRyI-hDys48Sq4Z1ZyH8odhKvs0'
 			}
 			var massDate=yield wechatApi.previewMass('mpnews',mpnews,message.FromUserName);
 			console.log(massDate);
 			reply='Yeah';
 		}
 		else if(content==='17'){
 			var massDate=yield wechatApi.checkMass('');
 			console.log(massDate);
 			reply='Yeah';
 		}
 		else if(content==='18'){
 			var tempQr={
 				expire_seconds:40000,
 				action_name:'QR_SCENE',
 				action_info:{"scene": {"scene_id": 123}}
 			};
 			var permQr={
 				 "action_name": "QR_LIMIT_SCENE",
 				 "action_info": {"scene": {"scene_id": 123}}
 			};
 			var permstrQr={
 				"action_name": "QR_LIMIT_STR_SCENE",
 				"action_info": {"scene": {"scene_str": "test"}}

 			};
 			var prCode1=yield wechatApi.createQrcode(tempQr);
 			var prCode2=yield wechatApi.createQrcode(permQr);
 			var prCode3=yield wechatApi.createQrcode(permstrQr);
 		}
 		else if(content==='19'){
 			var LongUrl='http://www.baidu.com';
 			var shortData=yield wechatApi.createShortUrl(null,LongUrl);
 			reply=shortData.short_url;
 		}
 		else if(content==='20'){
 			var semanticData={
				"query":"寻龙诀",
				"city":"杭州",
				"category": "movie",
				"uid":message.FromUserName
			}	 
			var Data=yield wechatApi.semantic(semanticData);
			console.log(Data);
			reply=JSON.stringify(Data);
 		}
 		this.body=reply;
 	}
 		yield next;
 }
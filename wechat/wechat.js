'use strict'
/*
access_token接口的实现
7200秒
过期或者不存在就更新然后就写入
 */
var Promise=require('bluebird');
var fs=require('fs');
var request=Promise.promisify(require('request'));
var util=require('./util.js');
var _=require('lodash')
var prefix="https://api.weixin.qq.com/cgi-bin/";
var Mpprefix='https://mp.weixin.qq.com/cgi-bin/';
var semanticUrl='https://api.weixin.qq.com/semantic/semproxy/search?';
var api={
	semanticUrl:semanticUrl,
	accessToken:prefix+"token?grant_type=client_credential",
	temporary:{
		upload:prefix+'media/upload?',
		fetch:prefix+'media/get?'
	},
	permanent:{
		//用来上传视频和图片
		upload:prefix+'material/add_material?' ,
		//上传图文
		uploadNews:prefix+'material/add_news?',
		//图文消息中的图片
		uploadPic:prefix+'media/uploadimg?',
		fetch:prefix+'material/get_material?',
		del:prefix+'media/del_material?',
		upadte:prefix+'media/upadte_news?',
		count:prefix+'material/get_materialcount?',
		batch:prefix+'material/batchget_material?'
	},
	group:{
		create:prefix+'tags/create?',
		fetch:prefix+'tags/get?',
		update:prefix+'tags/update?',
		del:prefix+'tags/delete?',
		check:prefix+'tags/getidlist?',
		batch:prefix+'tags/members/batchtagging?'
	},
	user:{
		remark:prefix+'user/info/updateremark?',
		fetch:prefix+'user/info?',
		batchfetch:prefix+'user/info/batchget?',
		list:prefix+'user/get?'
	},
	mass:{
		sendBytags:prefix+'message/mass/sendall?',
		sendById:prefix+'message/mass/send?',
		del:prefix+'mass/delete?',
		preview:prefix+'message/mass/preview?',
		check:prefix+'message/mass/get?'
	},
	menu:{
		create:prefix+'menu/create?',
		get:prefix+'menu/get?',
		del:prefix+'menu/delete?',
		current:prefix+'get_cur,rent_selfmenu_info?'
	},
	qrcode:{
		create:prefix+'qrcode/create?',
		show:Mpprefix+'showqrcode?'
	},
	shortUrl:{
		create:prefix+'shorturl?', 
	},
	ticket: {
    get: prefix + 'ticket/getticket?'
  }
}
function Wechat(opts)
{
	this.appsecrect=opts.appsecrect;
	this.appID=opts.appID;
	this.getAccessToken=opts.getAccessToken;
	this.saveAccessToken=opts.saveAccessToken;
	this.getTicket=opts.getTicket;
	this.saveTicket=opts.saveTicket;
	this.fetchAccessToken();
}
Wechat.prototype.isValidAccessToken=function(data){
	if(!data.access_token||!data.expires_in||!data)
	{
		return false
	}
	var access_token=data.access_token;
	var expires_in=data.expires_in;
	var now =new Date().getTime();
	if(now<expires_in)
	{
		return true;
	}
	else

		return false;
}
Wechat.prototype.updateAccessToken=function(){
	var appID=this.appID;
	var appsecrect=this.appsecrect;
	var url=api.accessToken+"&appid="+appID+"&secret="+appsecrect;
	return new Promise(function(resolve,reject){
		request({url:url,json:true}).then(function(response){
			var data=response.body;
			var now=new Date().getTime();
			var expires_in=now+(data.expires_in-20)*1000;
			data.expires_in=expires_in;
			resolve(data);
		})
	})
}
Wechat.prototype.fetchAccessToken=function(data){
	var that=this;
	return this.getAccessToken()
		.then(function(data){
			try{
				data=JSON.parse(data);
			}
			catch(e){
				return that.updateAccessToken();
			}
			if(that.isValidAccessToken(data)){
				return Promise.resolve(data)
			}
			else
			{
				return that.updateAccessToken();
			}
		})
		.then(function(data){
			that.saveAccessToken(data);
			return Promise.resolve(data);
		})
}
Wechat.prototype.fetchTicket = function(access_token) {
  var that = this

  return this.getTicket()
    .then(function(data) {
      try {
        data = JSON.parse(data)
      }
      catch(e) {
        return that.updateTicket(access_token)
      }

      if (that.isValidTicket(data)) {
        return Promise.resolve(data)
      }
      else {
        return that.updateTicket(access_token)
      }
    })
    .then(function(data) {
      that.saveTicket(data)
      return Promise.resolve(data)
    })
}
Wechat.prototype.updateTicket = function(access_token) {
  var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi'

  return new Promise(function(resolve, reject) {
    request({url: url, json: true}).then(function(response) {
      var data = response.body;
      var now = (new Date().getTime())
      var expires_in = now + (data.expires_in - 20) * 1000;

      data.expires_in = expires_in;

      resolve(data);
    })
  })
}
Wechat.prototype.isValidTicket = function(data) {
  if (!data || !data.ticket || !data.expires_in) {
    return false
  }

  var ticket = data.ticket
  var expires_in = data.expires_in
  var now = (new Date().getTime())

  if (ticket && now < expires_in) {
    return true
  }
  else {
    return false
  }
}
/*
上传临时素材或永久素材
 */
Wechat.prototype.uploadMaterial=function(type,material,permanent){
	var that=this;
	var form={};
	var uploadUrl=api.temporary.upload;
	if(permanent)
	{
		uploadUrl=api.permanent.upload;
		_.extend(form,permanent);
	}
	if(type==='pic'){
		uploadUrl=api.permanent.uploadPic;
	}
	if(type==='news'){
		uploadUrl=api.permanent.uploadNews;
		form=material;
	}
	else{
		form.media=fs.createReadStream(material);
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=uploadUrl+"&access_token="+data.access_token;
				if(!permanent){
					url+="&type="+type;
				}
				else{
					form.access_token=data.access_token;
				}
				var options={
					method:'POST',
					url:url,
					json:true
				}
				if(type==='news')
				{
					options.body=form;
				}
				else{
					options.formData=form; 
				}
				request(options).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
			})
	})
}
Wechat.prototype.fetchMaterial=function(mediaId,type,permanent){
	var that=this;
	var fetchUrl=api.temporary.fetch;
	if(permanent)
	{
		fetchUrl=api.permanent.fetch;
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=fetchUrl+"&access_token="+data.access_token;
				var form={}
				var options={url:url,json:true,method:'POST'};
				if(permanent){
					form.media_id=mediaId;
					form.access_token=data.access_token;
					options.body=form;
				}
				else{
					if(type='video'){
						url=url.replace('https://','http://');
					}
					url+='&media_id='+mediaId
				}
				if(type==='news'||type==='video'){	
				request(options).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('deletefail');
					}
				})
				.catch(function(err){
					reject(err);
				})		
				}
				else{
					resolve(url);
				}
				})	
			})
}
Wechat.prototype.deleteMaterial=function(mediaId){
	var that=this;
	var form={
		media_id:mediaId
	};
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.del+"&access_token="+data.access_token+'&media_id='+mediaId;
				request({url:url,json:true,method:'POST',body:form}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('deletefail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.updateMaterial=function(mediaId,news){
	var that=this;
	var form={
		media_id:mediaId
	};
	_.extend(form,news);
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.upadte+"&access_token="+data.access_token+'&media_id='+mediaId;
				request({url:url,json:true,method:'POST',body:form}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('updatefail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.countMaterial=function(){
	var that=this;
	
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.count+"&access_token="+data.access_token;
				request({url:url,json:true,method:'GET'}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('Countfail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.batchMaterial=function(options){
	var that=this;
	options={};
	options.type=options.type||'image';
	options.offset=options.offset||0;
	options.count=options.count||1;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.permanent.batch+"&access_token="+data.access_token;
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('Countfail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.createGroup=function(name){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.group.create+"&access_token="+data.access_token;
				var options={
					tag:{
						name:name
					}
				}
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('createGroup fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.fetchGroup=function(){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.group.fetch+"&access_token="+data.access_token;
				request({url:url,json:true}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('fetchGroup fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.checkGroup=function(openId){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.group.check+"&access_token="+data.access_token;
				var options={
					openid:openId
				}
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('checkGroup fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.updateGroup=function(id,name){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.group.update+"&access_token="+data.access_token;
				var options={
					tag:{
						id:id,
						name:name 
					}
				}
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('updateGroup fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.batchGroup=function(openids,id){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.group.batch+"&access_token="+data.access_token;
				var options={
						openid_list:openids,
						tagid:id 
				}
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('batchGroup fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.deleteGroup=function(id){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.group.del+"&access_token="+data.access_token;
				var options={
					tag:{
						id:id
					}
				}
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('createGroup fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.remarkUser=function(openId,remark){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.user.remark+"&access_token="+data.access_token;
				var options={
					openid:openId,
					remark:remark 
				}
				request({url:url,json:true,method:'POST',body:options}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('remark fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.fetchUser=function(openIds,lang){
	var that=this;
	var lang=lang||'zh_CN';
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var options={
					json:true
				}
				if(_.isArray(openIds)){
					options.body={
						user_list:openIds
					}
					options.method='POST';
					options.url=api.user.batchfetch+"&access_token="+data.access_token;
				}
				else{
					options.method='GET';
					options.url=api.user.fetch+"&access_token="+data.access_token+"&openid="+openIds+"&lang="+lang;
				}
				
				request(options).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('fetchUser fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.listUsers=function(openId){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.user.list+"&access_token="+data.access_token;
				if(openId){
					url+="&next_openid="+openId;
				}
				request({url:url,json:true,method:'GET'}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('listUsers fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.sendBytags=function(type,message,tagid){
	var that=this;
	var msg={
		filter:{},
		msgtype:type
	}
	msg[type]=message
	if(!tagid)
	{
		msg.filter.is_to_all=true;
	}
	else{
		msg.filter={is_to_all:false,tag_id:tagid};
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.sendBytags+"&access_token="+data.access_token;
				request({method:'POST',url:url,json:true,body:msg}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('sendBytags fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.sendById=function(type,message,openIds){
	var that=this;
	var msg={
		touser:openIds
	}
	msg[type]=message
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				url=api.mass.sendById+"&access_token="+data.access_token;
				request({method:'POST',url:url,json:true,body:msg}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('sendById fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.deleteMass=function(msg_id,article_idx){
	var that=this;
	var msg={
		msg_id:msg_id
	}
	if(article_idx)
	{
		msg.article_idx=article_idx
	}
	
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				url=api.mass.del+"&access_token="+data.access_token;
				request({method:'POST',url:url,json:true,body:msg}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('deleteMass fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.previewMass=function(type,message,openId){
	var that=this;
	var msg={
		touser:openId,
		msgtype:type
	}
	msg[type]=message;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.preview+"&access_token="+data.access_token;
				request({method:'POST',url:url,json:true,body:msg}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('preview fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.checkMass=function(msg_id){
	var that=this;
	var msg={
		msg_id:msg_id
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.mass.check+"&access_token="+data.access_token;
				request({method:'POST',url:url,json:true,body:msg}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('check fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.createMenu=function(menu){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.create+"&access_token="+data.access_token;
				request({url:url,json:true,method:'POST',body:menu}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('createMenu fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.getMenu=function(){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.get+"&access_token="+data.access_token;
				request({url:url,json:true,method:'GET'}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('getMenu fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.deleteMenu=function(){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.menu.del+"&access_token="+data.access_token;
				request({url:url,json:true,method:'GET'}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('delete fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.createQrcode=function(qr){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.qrcode.create+"&access_token="+data.access_token;
				request({url:url,json:true,method:'POST',body:qr}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('createQrcode fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.showQrcode=function(ticket){
	return api.qrcode.show+"&ticket="+ticket;
}
Wechat.prototype.createShortUrl=function(action,url){
	action=action||'long2short'
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.shorturl.create+"&access_token="+data.access_token;
				var form={
					action:action,
					long_url:url
				}
				request({url:url,json:true,method:'POST',body:form}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('createShortUrl fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.semantic=function(semanticData){
	var that=this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken()
			.then(function(data){
				var url=api.semanticUrl+"&access_token="+data.access_token;
				semanticData.appID=data.appID
				request({method:'POST',url:url,json:true,body:semanticData}).then(function(response){
					var _data=response.body;
					//console.log(_data);
					if(_data){
						resolve(_data);
					}
					else{
						throw new Error('semantic fail');
					}
				})
				.catch(function(err){
					reject(err);
				})
				})	
			})
}
Wechat.prototype.reply=function(){
	var content=this.body;
	var message=this.weixin;
	var xml=util.tpl(content,message);
	this.status=200;
	this.type='application/xml';
	this.body=xml;
}
module.exports=Wechat;
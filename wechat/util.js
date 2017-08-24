'use strict'
/*
xml转换成json
 */
var Promise=require('bluebird');
var xml2js=require('xml2js');
var tpl=require('./tpl.js');
exports.parseXMLAsync=function(xml){
	return new Promise(function(resolve,reject){
		xml2js.parseString(xml,{trim:true},function(err,content){
			if(err) reject(err);
			else{
				resolve(content);
			}
		})
	})
}
/*
	将json转换成key->value 因为转换之前的value会有数组或者是对象的可能性
 */
function formatMessage(result){
	var message={};
	if(typeof result==="object")
	{
		var keys=Object.keys(result);
		for(var i=0;i<keys.length;i++)
		{
			var item=result[keys[i]];
			var key=keys[i];
			if( !(item instanceof Array||item.length===0)){
				continue;
			}
			if(item.length===1)
			{
				var val=item[0];
				if(typeof val==='object')
				{
					message[key]=formatMessage(val);
				}
				else{
					message[key]=(val||'').trim()
				}
			}
			else{
				 message[key]=[];
				 for(var j=0,k=item.length;j<k;j++)
				 {
				 	message[key].push(formatMessage(item[j]));
				 }
			}
		}
	}
	return message;
}
exports.formatMessage=formatMessage;
exports.tpl=function(content,message){
	var info={};
	var type='text';
	var fromUserName=message.FromUserName;
	var toUserName=message.ToUserName;
	if(Array.isArray(content)){
		type='news';
	}
	if (!content) {
    content = 'Empty news'
  }
	//console.log(type);
	var type=content.type||type;
	info.content=content;
	info.CreateTime=new Date().getTime();
	info.MsgType=type;
	info.FromUserName=toUserName;
	info.ToUserName=fromUserName;
	console.log(info);
	return tpl.compiled(info);

}
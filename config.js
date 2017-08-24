'use strict'
var path=require('path');
var util=require('./libs/util.js');
//创建一个临时文件夹
var wechat_file=path.join(__dirname,'./config/wechat.txt');
var wechat_ticket_file = path.join(__dirname, './config/wechat_ticket.txt')
//微信验证需要的
var config={
	wechat:{
		appID:'wx7ab3fcdc4b4bb6a7',
		appsecrect:'76b1c561c71ceb3b05956e76b15d4a82',
		token:'lovewd',
		//获取access_token
		getAccessToken:function(){
			return util.readFileAsync(wechat_file);
		},
		//保存access_token
		saveAccessToken:function(data){
			data=JSON.stringify(data)
			return util.writeFileAsync(wechat_file,data);
		},
		  getTicket: function() {
      return util.readFileAsync(wechat_ticket_file)
    },
    saveTicket: function(data) {
      data = JSON.stringify(data)

      return util.writeFileAsync(wechat_ticket_file, data)
    }
	}
}
module.exports=config;
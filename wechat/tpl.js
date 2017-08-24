'use strict'
var ejs=require('ejs');
var heredoc=require('heredoc');
var tpl=heredoc(function(){/*
	<xml>
	<ToUserName><![CDATA[<%=ToUserName %>]]></ToUserName>
	<FromUserName><![CDATA[<%=FromUserName%>]]></FromUserName>
	<CreateTime><%=CreateTime%></CreateTime>
	<MsgType><![CDATA[<%=MsgType %>]]></MsgType>
	<% if(MsgType=='text'){%>
		<Content><![CDATA[<%- content%>]]></Content>
	<%}else if(MsgType=='image'){%>
		<Image>
		<MediaId><![CDATA[<%=content.media_id%>]]></MediaId>
		</Image>
	<%}else if(MsgType=='voice'){%>
		<Voice>
			<MediaId><![CDATA[<%=content.media_id%>]]></MediaId>
		</Voice>
	<%}else if(MsgType=='video'){%>
		<Video>
			<MediaId><![CDATA[<%=content.media_id%>]]></MediaId>
			<Title><![CDATA[<%=content.title%>]]></Title>
			<Description><![CDATA[<%=content.description%>]]></Description>
		</Video>
	<%}else if(MsgType=='music'){%>
		<Music>
			<Title><![CDATA[<%=content.title%>]]></Title>
			<Description><![CDATA[<%=content.description%>]]></Description>
			<MusicUrl><![CDATA[<%=content.MUSIC_Url%>]]></MusicUrl>
			<HQMusicUrl><![CDATA[<%=content.HQ_MUSIC_Url%>]]></HQMusicUrl>
			<ThumbMediaId><![CDATA[<%=content.media_id%>]]></ThumbMediaId>
	<%}else if(MsgType=='news'){%>
		<ArticleCount><%=content.length%></ArticleCount>
		<%content.forEach(function(item){%>
		<Articles>
			<item>
			<Title><![CDATA[<%=item.title%>]]></Title> 
			<Description><![CDATA[<%=item.description%>]]></Description>
			<PicUrl><![CDATA[<%=item.PicUrl%>]]></PicUrl>
			<Url><![CDATA[<%=item.Url%>]]></Url>
			</item>
			<%})%>
		</Articles>
		<%}%>
	</xml>
	 */
}) 
var compiled=ejs.compile(tpl)
module.exports={
	compiled:compiled
}
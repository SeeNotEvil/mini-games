
define(['jquery'], function($){
	
	var chat = function()
	{
			
				
		var self = this ;
				
		self.block = false ;
				
		self.template = '<div id = "chat" class="chat">' +
						'<h2> Чат </h2>' +
						'<div id = "messagesChat"> </div>' +
						'<div><input id="chatInput" /> </div>' +
						'<div> <button class="btn btn-primary" id="chatButton"> Отправить сообщение </button> </div>' +
						'</div>' ;
								

		self.messageChat = null ;
				
		self.element = null ;
				
		self.user = null ;
				
		self.init = function(options, cb)
		{
			self.element = $('#' + options.element) ;
			
			self.onSocketHandlers(options.socket) ;

			self.user = new user(options.socket, options.login) ;
			self.drawChat() ;
			self.onHandlers() ; 
					
		};
				
		self.drawChat = function()
		{
			self.element.html(self.template) ;		
		};
				
		self.clearDrawChat = function()
		{	
			self.element.html("") ;
					
		};
				
		//Отправка всем сообщения
		self.sendMessage = function()
		{
					
			var message = $('#chatInput').val() ;

			if(message == "" )
                return ;

			self.user.socket.emit("sendMessageChat", {message: message}) ;

            $('#chatInput').val("") ;
					
		};
			
		self.onHandlers = function()
		{

            $('#chat').keydown(function(e){

                if (e.which == 13) {
                    self.sendMessage() ;
                }
            });

			$('#chatButton').on('click', self.sendMessage) ;

		};
				
		//Принимаем сообщение
		self.getMessage = function(data)
		{
			if(data.message == "" || data.login == "")
				return ;
					
			$('#messagesChat').append('<div>'+ data.login + ' : ' + data.message +'</div>') ;
		};
				
		self.destroy = function()
		{
			self.offSocketHandlers(self.user.socket) ;
		};
				
				
		self.onSocketHandlers = function(socket)
		{
			socket.on('sendMessageChat', self.getMessage) ;
		};
				
		self.offSocketHandlers = function(socket)
		{
			socket.removeListener('sendMessageChat') ;
		};
				
				
		self.destroyChat = function()
		{
			self.offSocketHandlers(socket) ;
			self.clearDrawChat() ;
		};
				
				
		var user = function(socket, login)
		{
			this.socket = socket ;
					
			this.login = login ;
		}
	};
	

    return chat;
	
});			
			
			
			
			
			
	

	module.exports = function()
	{

		var self = this ;
		
		self.users = [] ;
		
		
		self.init = function(options) {
			for(var i = 0 ; i < options.players.length; i++)
			{
				self.addUser(options.players[i].user.socket, options.players[i].user.login) ;
			}
		};
		
		
		self.addUser = function(socket, login)
		{
			var newUser = new user(socket, login) ;
			self.onSocketHandlers(socket) ; 
			self.users[socket.id.toString()] = newUser ; 
		};
	
		//Отправка всем сообщений
		self.sendMessage = function(message)
		{
			console.log(message) ;
			for(var key in self.users)
			{
				self.users[key].socket.emit("sendMessageChat", message) ;
			}
	
		};
	
	
		//Принимаем сообщение
		self.getMessage = function(data)
		{
			
			if(data.message == "")
				return ;
			
			var key = this.id.toString() ;
			
			if(self.users[key] != undefined)
			{
				var login = self.users[key].login ;
				console.log("login " + login) ;
				var date = new Date() ;
				
				self.sendMessage({
									login: login,
									date: date,
									message: data.message
								 })	 ;
			}
		};
		
		self.destroy = function()
		{
			
			for(var key in self.users)
			{
				self.offSocketHandlers(self.users[key].socket) ;
			
			}
		};
		
		self.deleteUser = function(id)
		{
			delete self.users[id] ;
		};
		
		self.onSocketHandlers = function(socket)
		{
			socket.on('sendMessageChat', self.getMessage) ;	
		};
		
		self.offSocketHandlers = function(socket)
		{
            console.log("removeListener socketId" + socket.id.toString()) ;
			socket.removeListener('sendMessageChat', self.getMessage) ;
		};
		
		var user = function(socket, login)
		{
			this.socket = socket ;
			
			this.login = login ;
		}
	};
	
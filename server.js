	console.log("Listening at " + port) ;
	
	var express = require('express') ;
	var app = express();
	

	var http = require('http').Server(app);
	//var io = require('socket.io')(http);
	http.listen(3000);
	

	//app.use(express.static(__dirname + '/public'));
	
	//Создаем и инициализируем экземпляр платформы
 	//var application = require('./application') ;
	//var platform = new application() ;
   // platform.init() ;

	
	
	//Присоеденяемся к игре
	/*io.sockets.on('connection', function(socket) 
	{
		//Добавляем клиента
		platform.onSocketHandlers(socket) ;
	});*/
	
	
	


	var express = require('express') ;
	var app = express();
	

	var port = process.env.PORT || 5000;       
	app.listen(port)                           // Запускаем сервер на 5000 порту, если не указана переменная окружения "port" 
	console.log("Listening at " + port)
	
	
	

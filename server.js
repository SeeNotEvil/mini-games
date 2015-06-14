
	var express = require('express') ;
	var app = express();

    //var fs = require('fs');
	var http = require('http').Server(app);
	io = require('socket.io')(http);
	http.listen(3000);


    var validator = require('./backend/lib/validator') ;
    var configGames = require('./games/config_games') ;

	//Создаем и инициализируем экземпляр платформы
 	var application = require('./backend/application') ;
	platform = new application() ;


    platform.init({
        validator : new validator(),
        configGames: configGames
    }) ;


    //Событие присоеденение к игре
    io.sockets.on('connection', function(socket) {

        platform.onSocketHandlers(socket) ;

    });



    app.get('/:path.html', function(req, res){

        try {
            fs.readFile(req.params.path + '.html', function (err, data) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }
        catch (e) {}
    });

    app.get('/:path.css', function(req, res){

        try{
            fs.readFile(req.params.path + '.css',function (err, data){
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.end(content, 'utf-8');
                res.end();
            });
        }
        catch (e) {}
    });



    app.use(express.static(__dirname));
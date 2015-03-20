    /**
     * Фабрика игр
     */

	var fabricGame = {


		games : {

            water_war : {
                path : 'water_war',
                options : {
                    timeMove : 40 ,
                    timePreparation: 40
                }
            },

            tic_tac_toe: {
                path: 'tic_tac_toe',
                options : {
                    timeMove : 40 ,
                    mode: "default",
                    step: "random"
                }
            }
        },

        /**
         * Создаем игру
         * creatorGame - создатель игры
         * titleGame - название игры
         * application - ссылка на экземпляр приложения
         * options - настройки игры (пришедшие от клиента)
         * Возвращает созданную игру
         */
         createGame : function(titleGame, creatorGame, application, options) {

			if(fabricGame.games[titleGame] == undefined)
				return undefined ;

			var path = application.gameDirectory + '/' +  fabricGame.games[titleGame].path ;

            //Получаем опции игры
			var optionsGame = fabricGame.getOptionsGame(fabricGame.games[titleGame].options, options) ;

			var game = require(path) ;

            var newDate = Date() ;

			return new game({date : newDate,
                             userId : creatorGame.id,
                             titleGame : titleGame,
                             creatorGame : creatorGame,
                             application : application,
                             optionsGame : optionsGame}) ;


		},

        /**
         *
         *  gameOptions Опции пришедшие от создателя игры
         *  options Опции игры по умолчанию
         *  Возвращаем обьедененные опции
         */
		getOptionsGame: function(gameOptions, options)
		{
			for(var key in gameOptions)
			{
				if(options[key] != undefined)
					gameOptions[key] = options[key] ;
			}

			return gameOptions ;

		}

	};


	
	/**
     * Класс приложения (платформы)
	 * для взаймодействия пользователей
	 * и создания игр
     */
	var application = module.exports = function()
	{
		var self = this ;

		self.games = [] ;
		self.users = [] ;

        //Старт платформы
        self.startDate = null ;
		self.interval = {} ;

        //Директории для игр и модулей
        self.gameDirectory = "./games" ;
        self.moduleDirectory = "./module" ;

        //Кол-во игр
        self.countGame = 0 ;

        //Кол-во игроков в играх
        self.countUsersInGame = 0 ;


		self.onSocketHandlers = function(socket)
		{
			
			socket.on('sendLogin', self.authorizeUser) ;
			
			socket.on('showFreeGames', self.showFreeGames) ;
	
			socket.on('disconnect', self.userDisсonnect) ;

            socket.on('showMenu', self.showMenu) ;
			
			socket.on('hostingGame', self.hostingGame)  ;
		
			socket.on('connectingToGame', self.connectionUserToGame) ; 
			
			socket.on('initGamePlayers', self.initGamePlayers) ;

            socket.on('showStatistic', self.showStatistic) ;

            socket.on('exitGame', self.exitGame) ;
        } ;

        /**
         *
         * Инициализирует приложение
         * Запускает таймер для отдачи статистики игрокам находящимся не в игре
         */
        self.init = function()
        {

            self.startTimer(40, 10, self.interval, function(time)
            {
                var state = self.getStatistic() ;

                for(var key in self.users)
                {
                    if(self.users[key].location != "game")
                        self.users[key].socket.emit('updateStatistic', state) ;
                }

            }) ;

        };

        /**
         *  Показать статику конкретному пользователю
         */
        self.showStatistic = function(data, callback)
        {
            var id = this.id.toString() ;

            if(self.users[id] != undefined)
            {
                var states = self.getStatistic() ;

                callback(states) ;
            }

        };

        /**
         * Переход в меню
         */
        self.showMenu = function(data, callback) {

            var id = this.id.toString() ;

            self.users[id].location = "menu" ;

            var games = self.getFreeGames() ;

            self.users[id].socket.emit('showFreeGames', {games : games}) ;

            var state = self.getStatistic() ;

            self.users[id].socket.emit('updateStatistic', state) ;
        };


        /**
         * Показ свободной комнаты
         */
        self.showFreeGames = function(data, callback)
        {
            var id = this.id.toString() ;

            if(self.users[id] != undefined)
            {
                var games = self.getFreeGames() ;

                callback({games: games}) ;
            }
        } ;


        //Сбор статистики
        self.getStatistic = function()
        {
            var states = {} ;

            var countUsers = 0 ;
            var countFreeUser = 0 ;
            var countUsersInGame = 0 ;
            var countUsersInLobby = 0 ;

            for(var key in self.users )
            {
                if (self.users[key].game == null)
                    countFreeUser++ ;
                else if(self.users[key].game.initialization)
                    countUsersInGame ++ ;
                else
                    countUsersInLobby ++ ;

                countUsers++ ;
            }

            return {
                        countUsers: countUsers,
                        countFreeUser : countFreeUser,
                        countUsersInGame : countUsersInGame,
                        countUsersInLobby : countUsersInLobby,
                        countGame : self.countGame
                    } ;
        };


		//Авторизация пользователя 
		self.authorizeUser = function(data, callback)
		{
			var socket = this ; var id = socket.id.toString() ; var login = data.login ;

			if(login != undefined || login != '')
			{
				self.users[id] = new user(socket, id, login) ;
                self.users[id].location = "menu" ;
                console.log("menu") ;
				callback({status: true, userId : id, login: login}) ;		
			
			}
			else
				callback({status: false}) ;		
		} ;
		


        /**
         *  Выход из игры пользователя
         */
        self.leavePlayerGame = function(id)
        {

            //Получаем игру
            var game = self.users[id].game ;

            if(game != null)
            {
                //Обнуляем игру у пользователя
                self.users[id].game = null ;

                //Если игра неиницилизирована
                if (!game.initialization)
                {
                    if (game.isFull())
                        self.stopTimer(game.interval);

                    //Если вышел создатель игры
                    if (game.creatorGame == self.users[id])
                    {
                        //Удаляем игрока
                        game.deletePlayerId(id);

                        //Информируем всех игроков
                        for (var i = 0; i < game.players.length; i++)
                        {
                            game.players[i].user.socket.emit('creatorLeaveGameLobby', {name: self.users[id].login});
                            game.players[i].user.game = null ;
                        }

                        //Удаляем игру
                        self.deleteGame(game.gameId);
                    }
                    else
                    {
                        //Удаляем игрока
                        game.deletePlayerId(id);

                        //Информируем игроков
                        for (var i = 0; i < game.players.length; i++)
                        {
                            game.players[i].user.socket.emit('playerLeaveGameLobby', {name: self.users[id].login});
                        }
                    }

                    //Обновляем информацию по комнатам у юзеров
                    self.showUsersFreeGames()  ;

                }
                else
                {
                    //Передаем управление самой игре
                    game.disconnectPlayer(id);

                }

            }
        };

        /**
         * Дисконнект
         */
		self.userDisсonnect = function(data)
		{
			
			var id = this.id.toString() ;

            if(self.users[id] == undefined)
                return ;

            //Выход из игры
            self.leavePlayerGame(id) ;

            //Удаление пользователя
			self.deleteUser(id) ;


		} ;

        /**
         * Выход из игры
         */
        self.exitGame = function(data, callback)
        {

            var id = this.id.toString() ;

            if(self.users[id] == undefined)
                return ;
				
            self.leavePlayerGame(id) ;

            //Перемещаем его в меню
            self.users[id].location = "menu" ;

            callback() ;
        } ;


        /**
         * Удаление юзера
         */

		self.deleteUser = function(key)
		{
			console.log("delete user  " + key) ;
			delete self.users[key];
		} ;


        /**
         * Удаление игры
         */
		self.deleteGame = function(key)
		{
			console.log("deleteGame  " + key) ;
            self.games[key] = null ;
			delete self.games[key];
            self.countGame -- ;
		
		} ;


        /**
         * Создание игры
         */
		self.hostingGame = function(data, callback)
		{
		    if(data.titleGame == undefined)
                return ;

			var titleGame = data.titleGame ; 
			var userId = this.id.toString() ;

			if(self.users[userId] == undefined)
				return ;
				
			if(self.users[userId].game == null)
			{
                //Получаем опции игры
				var options = data.options == undefined ? {} :  data.options ;

                //Создатель игры
				var creatorGame = self.users[userId] ;

                //Пробуем создать игру с такими параметрами
				var game = fabricGame.createGame(titleGame, creatorGame, self,  options) ;

                if(game == undefined)
                    return ;

                for(var key in game.players.length) {
                    console.log(game.players[key].user.id) ;


                }
                console.log(game.players.length) ;

				if(game == undefined)
					return ;

                //Меняем локацию создателю игры
                creatorGame.location = "lobby" ;

                //Ставим игру
				creatorGame.game = game;

                self.games[userId] = game ;

                console.log(self.games[userId].players.length) ;
				self.countGame++ ;

                //Ответ клиенту
				callback({titleGame: data.titleGame, optionsGame: data.options}) ;

                //Обновляем информацию о играх
				self.showUsersFreeGames()  ;
				
			}		
		} ;
	
		
		/**
         * Добавления игрока в игру
         */
 		self.connectionUserToGame = function(data)
		{

			var userId = this.id.toString() ;

            var gameId = data.gameId ;
			
			if(self.users[userId] == undefined || gameId == undefined)
				return ;
				
			//Если пользователь уже играет нечего не делаем
			if(self.users[userId].game != null)
				return ;		 
			
			//Если такая игра действительно существует,она не явлеятся заполненной , и игрок не играет
			if(self.games[gameId] !== undefined && !self.games[gameId].isFull() && !self.games[gameId].initialization)
			{
				//Записываем что игрок находится в лобби
				self.users[userId].location = "lobby" ;


				self.users[userId].game = self.games[gameId] ;
				
				self.games[gameId].addPlayer(self.users[userId]) ;

                //Информируем всех игроков о присоеденении
				self.connectedUserToGame(self.games[gameId], userId) ;

                //Если игра заполнилась , стартуем подготовку к игре
				if(self.games[gameId].isFull())
					self.preparationGame(self.games[gameId]) ;

                self.showUsersFreeGames()  ;
			}
		} ;

        /**
         * Раассылаем информацию о присоеденении  игрока к игре
        */
		self.connectedUserToGame = function(game, userId)
		{
			var players = game.players ;
		
			for(var key in players)
			{
				if(players[key].user.id == userId)
					players[key].user.socket.emit('connectedGame', {id : game.id, titleGame : game.titleGame,
                                                                    optionsGame: game.options}) ;
				else
					players[key].user.socket.emit('connectedUserGame', {name : players[key].user.login}) ;
			}	
		
		};

        /**
         * Подготовка к запуску игры
         */
		self.preparationGame = function(game)
		{
					
			self.startTimer(10, 1, game.interval, function(time, interval)
			{

				if(time <= 0 && game.isFull())
				{
					self.stopTimer(game.interval) ;

                    //Инициализируем игру
					game.init() ;
						
                    //Отправляем игрокам данные об игре
					for(var key in game.players)
					{


						game.players[key].user.socket.emit('initGame', {title: game.titleGame,
                                                                        optionsGame: game.getOptionsGame(),
                                                                        optionsPlayer: game.getOptionsPlayer(key)
                                                                        }) ;

                        game.players[key].user.location = "game" ;
					}

                    //Стартуем таймер для инициализации игры на клиенте
					self.startTimeInitGamePlayers(game) ;

                    //Обновляем статистику
					self.showUsersFreeGames() ;

				}
			
			})	;

            //Информируем игроков об начале подготовке к игре
			for(var key in game.players)
			{
				game.players[key].user.socket.emit('readyToStartGameTimer', {time : 10}) ;				
			}
		} ;

        /**
         * Отсчет времени для инициализиции игры на клиентах игроков
         */

		self.startTimeInitGamePlayers = function(game)
		{
		
			self.startTimer(40, 1,  game.interval, function(time)
			{
                //Если время вышло
				if(time <= 0)
				{
                    //Отправляем игрокам что один из игроков незагрузился
					for(var key in game.players)
					{

						if(game.players[key].initGame)
							game.players[key].user.socket.emit('playersLongTime', {}) ;

                        self.stopTimer(game.interval) ;
					}		
				}
			})
		} ;

        /**
         * Инициализация игры от клиента
         */
		self.initGamePlayers = function(data)
		{
			
			var id = this.id.toString() ;
			
			if(self.users[id] == undefined)	
				return ;
			
			var game = self.users[id].game ;
			
			if(game == null)
				return ;
					
			var player = game.getPlayerId(id) ; 


            //Если игроки неиницолизировали свои игры на клиента и игрок еще неинициализировал игру
			if(!game.playersInitGame() && !player.initGame)
			{
				player.initGame = true ;
				game.countInitPlayer++ ;
			}

            //Если все игроки готовы к запуску игры
			if(game.playersInitGame()) 
			{
				game.startGame() ;
				self.stopTimer(game.interval) ;
			}	
		} ;


        /**
         * Отправляем всем пользователям в меню что создана новая игра
         */
		self.showUsersFreeGames = function()
		{
			
			var games = self.getFreeGames() ;	
												
			for(var key in self.users)
			{


				if(self.users[key].location == 'menu')
                {
                    console.log('menu') ;
                    self.users[key].socket.emit('showFreeGames', {games : games}) ;

                }

			}
	
		} ;


        /**
         *  Выполнение таймера
         */
		self.startTimer = function(startTime, delay, interval, callback) {

			var time = startTime * 1000 ;
			var delay =  delay * 1000 ;

            interval.int = setInterval(function() {
				callback(time / 1000) ;
				time = time  - delay ;

			}, delay);

		} ;

        /**
         *  Стоп таймер
         */
		self.stopTimer = function(interval) {
			clearInterval(interval.int) ;
		} ;


        /**
         *   Показать свободные игры
         */
		self.getFreeGames = function() {
			var states = [] ;
			var i = 0 ;
			
			for(var key in self.games)
			{
				if(self.games[key].initialization == false)
				{

					states[i] = {} ;
					states[i].gameId = key ;
					states[i].time = self.games[key].time ;
					states[i].titleGame = self.games[key].titleGame ;
					states[i].nameCreatorGame = self.games[key].creatorGame.login ;
                    states[i].countPlayer = self.games[key].countPlayer ;
                    states[i].maxCountPlayer = self.games[key].maxCountPlayer ;
					states[i].isFull = self.games[key].isFull() ;
					i++ ;
				}
			
			}
			
			return states ;
		} ;


        /**
         * Уничтожение игры
         */
		self.destroyGame = function(gameId)
		{

			if(self.games[gameId] == undefined)
				return ;

            for (var key in self.games[gameId].players)
			{
				self.games[gameId].players[key].user.game = null ;
			}
			
			self.deleteGame(gameId) ;
				
		}
		
	} ;
	
	/**
     * Пользователь платформы
     */
	var user = function(socket, id, login)
    {
        var self = this;

        self.socket = socket;

        self.location = "none";

        self.login = login;

        self.id = id;

        self.game = null;
    } ;
	

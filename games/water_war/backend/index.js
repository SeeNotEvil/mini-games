
	var util = require('util');
	var basicGames = require('../../../backend/basic_games');

	/*
		Морской бой
		
	*/
	var waterWar = module.exports = function(constructOptions)
	{

        var self = this ;

		self.nowPlayer = null ;
		self.opponent = null ;
		self.countReadyPlayer = 0 ;
		

        self.options = {
            timePreparation : 60 ,
            timeMove : 20
        };

		//Функция инициализации 
		self.init = function(cb)
		{
			self.timeMove = self.options.timeMove ;
			self.timePreparation = self.options.timePreparation ;

			self.onSocketHandlers() ;

            for(var i = 0 ; i < self.players.length; i++) {
                self.players[i].options.opponent = self.players[i] == self.players[0] ? self.players[1].user.login :
                                                                                        self.players[0].user.login ;
            }

            waterWar.super_.prototype.init.apply(self, arguments);

		};
		
		
		self.getModulesOptions = function()
        {
			return [{
                name : "./chat" ,
                options : {players: self.players}
			}] ;
		};
		

		self.startGame = function()
        {
			waterWar.super_.prototype.startGame.apply(this, arguments);
			self.preparationToGame() ;
		};
		
		self.swapPlayers = function()
        {
			var container = self.nowPlayer ;
			self.nowPlayer = self.opponent ;
			self.opponent = container ;
		};
		
		//Вешаем события сокетов
		self.onSocketHandlers = function()
        {

			for(var i = 0 ; i < self.players.length; i++) {
				self.players[i].user.socket.on('sendSudmarines', self.sendSudmarines) ;	
				self.players[i].user.socket.on('shoot', self.shoot) ;
			}
		};
		

		
		//Снимает события сокетов
		self.offSocketHandlers = function()
        {
			for(var i = 0 ; i < self.players.length; i++) {
				self.players[i].user.socket.removeListener('sendSudmarines', self.sendSudmarines) ;	
				self.players[i].user.socket.removeListener('shoot', self.shoot) ;			
			}
		};
		

	
		self.sendSudmarines = function(data)
        {
			var player = self.getPlayerId(this.id.toString()) ;
					
			if(!player)
				return false;
						
			if(!player.readyToGame)
				self.preparationPlayerGame(player, data.sudmarines) ;
		
		};
		
		
		self.preparationGame = function()
        {
			return (self.countReadyPlayer == self.countPlayer) ;
		};
		
		self.disconnectPlayer = function(id)
        {
			if(self.interval)
				self.stopTimer() ;	 
				
			waterWar.super_.prototype.disconnectPlayer.apply(this, arguments);
			
			self.offSocketHandlers() ;

			self.destroyGame() ;
		};
		
		
		
		self.preparationPlayerGame = function(player, sudmarines)
		{
			if(self.preparationGame())
				return false ;
				
			player.field = new waterField(10) ;
			player.field.init() ;
			player.field.addSudmarines(sudmarines) ;
			player.readyToGame = true ;
			self.countReadyPlayer++ ;
			
			if(self.preparationGame()) {
				self.stopTimer() ;	
				self.startToGame() ;
			}	
				
		};
		
		self.pickUpMask = function() 
        {
			for(var i = 0 ; i < self.players.length; i++)
			{
				if(self.players[i].readyToGame == false) {
                    self.players[i].user.socket.emit('pickUpMask', {}) ;
                }

			}
		};

        self.createGamePlayer = function(user)
        {
            return new waterWarPlayer(user) ;
        };

		//Приготовление к игре 
		self.preparationToGame = function() {

			self.startTimer(self.timePreparation, 1, function(time) {

                if(time <= 0) {
                    self.stopTimer() ;
                    self.pickUpMask() ;
                }

            });

		};
		
		
		self.move = function()
        {
            self.nowPlayer.user.socket.emit('move', {move : true }) ;
            self.opponent.user.socket.emit('move', {move : false  }) ;

			//Вешаем таймер
			self.startTimer(self.timeMove, 1, function(time) {

        		if(time <= 0) {

					self.swapPlayers() ;
					self.stopTimer() ;	
					self.move() ;
				}
			})
		};
		
		
		//Старт основной фазы игры
		self.startToGame = function() 
		{

			//Рандом для начинающего пользователя
			self.nowPlayer = (Math.random() > 0.5) ? self.players[0] : self.players[1];
			self.opponent = self.nowPlayer ==  self.players[0] ?  self.players[1] : self.players[0] ;

            self.nowPlayer.user.socket.emit('startFight' , {move : true} ) ;
            self.opponent.user.socket.emit('startFight', {move: false} ) ;

			self.move() ;
			
		};
	
		
		//Выполнение таймера	
		self.startTimer = function(startTime, delay, callback)
        {
			var time = startTime * 1000 ;
			var delay =  delay * 1000 ;
			
			self.interval = setInterval(function() {
				callback(time / 1000) ;	
				time = time  - delay ;	
			}, delay);
			
			return time ;		
		};
		
		//Стоп таймер
		self.stopTimer = function()
        {
			clearInterval(self.interval) ;
		};

		/*Выстрел
		  Координаты , и номер игрока который стреляет
		*/
		self.shoot = function(data) {

			if(!self.preparationGame) 
				return false ;
			
			var playerId = this.id.toString() ;
			
			var x = data.x ; var y = data.y ;
			
			if(self.getPlayerId(playerId) != self.nowPlayer)
				return false ;
				
			if(x > self.nowPlayer.field.countCells || x < 0 || 
			   y > self.nowPlayer.field.countCells || y < 0)
				return false ;
			
			if(self.opponent.field.shoot(x, y)) {

				var sudmarine = self.opponent.field.mask[x][y] ;
				
				if(sudmarine.aliveIsSudmarine())
					self.nowPlayer.user.socket.emit('attack', {state: "attackHit", x : x , y : y}) ;
				else
					self.nowPlayer.user.socket.emit('attack', {state: "attackHitDieSudmarine", cells : sudmarine.cells}) ;
				
				self.opponent.user.socket.emit('attacked', {state: "attackedHit", x : x , y : y}) ;
				self.opponent.field.mask[x][y] = null;
			}
			else {
				
				self.nowPlayer.user.socket.emit('attack', {state: "attackMiss", x : x , y : y}) ;
				self.opponent.user.socket.emit('attacked', {state: "attackedMiss", x : x , y : y}) ;
				self.swapPlayers() ;
			}
		
		
			if(!self.opponent.field.isAliveSudmarines())
				self.gameOver(self.nowPlayer, self.opponent) ;
			else {
				self.stopTimer() ;
				self.move() ;
			
			}
		};
		
		
		self.gameOver = function(winner, loser)
		{
			
			self.stopTimer() ;
			
			winner.user.socket.emit('gameOver', {win : true}) ;
			loser.user.socket.emit('gameOver', {win : false}) ;
			
			self.offSocketHandlers() ;
			
			self.destroyGame();
		};

        waterWar.super_.apply(this, arguments);

	} ; util.inherits(waterWar, basicGames.game);
	


	/**
     * Игрок
     * Передаем ссылку на пользователя играющего и саму игру
     */
	var waterWarPlayer = function(user)
	{
		var self = this ;
		waterWarPlayer.super_.apply(this, arguments);
		
		self.field = null ;
		
		self.readyToGame = false ;
	} ; util.inherits(waterWarPlayer, basicGames.player);
	

	/**
     * Обьект поле игры
     * Массив судмарин,
     * Маска поля
     * Кол-во ячеек
	*/
	var waterField = function(countCells) 
	{
		var self = this; 
		
		self.sudmarines = [];
		
		self.mask = [] ;
		
		
		self.countCells = countCells ;
		
		self.init = function()
		{
			self.createMask() ;		
		};
		
		self.shoot = function(x , y)
		{	
			
			
			if(self.mask[x][y] == null)
				return false;

            self.mask[x][y].dieCell++ ;
		
			return true ;
		};
		
		self.isAliveSudmarines = function()
		{
			
			for(var key in self.sudmarines) {
				if(self.sudmarines[key].aliveIsSudmarine())
					return true ;
			}
		
			return false ;
		};
		
		
		//Создание маски
		self.createMask = function()
		{
			for(var i = 0; i <= self.countCells + 1; i++) {
				self.mask[i] = [] ;
				for(var j = 0 ; j <= self.countCells + 1; j++) {
					self.mask[i][j] = null ;		
				}	
			}				
		};
		
		//Добавляем судмарины в поле
		self.addSudmarines = function(sudmarines)
		{
			for(var i = 0 ; i < sudmarines.length; i++) {
				if(!self.isSudmarinePole(sudmarines[i]))
					return false ;
				
				if(!self.isSudmarineCorrect(sudmarines[i]))
					return false ;
				
				var sudmarine = new wateRsudmarine() ;
				sudmarine.countCells = sudmarines[i].countCells ;
				sudmarine.cells = sudmarines[i].cells ;
				
				for( var j = 0 ; j < sudmarines[i].cells.length; j++) {
					self.mask[sudmarines[i].cells[j].x][sudmarines[i].cells[j].y] = sudmarine ;
				}
				
				self.sudmarines[i] = sudmarine ;
					
			}

			return true ;
		};
		
		
		//Кооректные ли координаты судмарины
		self.isSudmarineCorrect = function(sudmarine)
		{
			if(sudmarine.countCells == 1)
				return true ;

			if((sudmarine.cells[sudmarine.countCells - 1].x - sudmarine.cells[0].x + 1) *
			   (sudmarine.cells[sudmarine.countCells - 1].y - sudmarine.cells[0].y + 1) == sudmarine.countCells)
				return true ;

				return false ;

		};
		
		
		//Может ли встать судмарина
		self.isSudmarinePole = function(sudmarine)
		{
			var startX = sudmarine.cells[0].x ;
			var endX = sudmarine.cells[sudmarine.countCells - 1].x ;
			var startY = sudmarine.cells[0].y ;
			var endY = sudmarine.cells[sudmarine.countCells - 1].y ;
			

			for(var i = startY - 1 ; i <= endY + 1 ; i++) {
				for(var j = startX - 1; j <= endX + 1; j++) {
					if(i < 0 || i > 11 || j < 0 || j > 11)
						return false ;

					if(self.mask[j][i] != null )
						return false ;
								
				}
			}

			return true ;
		}
	
	};
	
	/*Обьект корабли
	  Живые яейки корабля
	  Подбитые ячейки корабля
	*/  
	var wateRsudmarine = function()
	{
		var self = this ;
		self.dieCell = 0 ;
		self.countCells = null ;
		self.cells = [] ;
		
		self.aliveIsSudmarine = function()
		{
			return (self.dieCell  != self.countCells) ;
		}

	};
	
	
	
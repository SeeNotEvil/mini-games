
	/**
	 * Базовый прототип игры
     * Выполняет минимальные функции игры
     * constructOptions опции для создания игры
     */

	module.exports.game = game = function(constructOptions)
	{
		var self = this ;

        //Массив игроков
        self.players = [] ;

        //Стартанула ли игра
        self.started = false ;

        //Кол - во инициализированных игроков
        self.countInitPlayer = 0 ;

        //Максимальное кол - во игроков
        self.maxCountPlayer = self.maxCountPlayer != undefined ? self.maxCountPlayer : 2 ;

        //Текущее кол - во игроков
        self.countPlayer = 0 ;

        //Инициализирована ли игра
        self.initialization = false ;

        //Интервал для тиндивидуального таймера игры
        self.interval = {int : null} ;

        //Массив модулей
        self.modules = [] ;

        self.options = self.options != undefined ? self.options : {} ;


        //Установка основных настроек
        self.setConstructOption(constructOptions) ;

	} ;



    /**
     * Установка опций
     * constructOptions опции
     */
	game.prototype.setConstructOption = function(constructOptions)
    {
        if (constructOptions == undefined)
        {
            //ЧТОТО ЗДЕСЬ СДЕЛАТЬ
        }

        //Дата создания
        this.time = constructOptions.date ;

        //Название игры
        this.titleGame = constructOptions.titleGame ;


        //Создатель игры
        this.creatorGame = constructOptions.creatorGame ;

        //id Игры
        this.gameId = constructOptions.userId;

        //Ссылка на экземпляр платформы
        this.app = constructOptions.application;

        //Установка игровых опций
        this.setGameOption(constructOptions.optionsGame) ;

        //Добавляем игрока в игру
        this.addPlayer(this.creatorGame) ;



    };

    /**
     * Инициализация игры
     */
	game.prototype.init = function()
	{		
		this.initialization = true ;
		this.initModules() ;
	} ;

    /**
     * Запуск игры
     */
	game.prototype.startGame = function()
	{
		this.started = true;
	};


    /**
     *  Проверка готовы ли все пользователи к игре
     */
	game.prototype.playersInitGame = function()
	{	
		return (this.maxCountPlayer == this.countInitPlayer) ;  
	};

    /**
     * Получение общих опций и свойств игры (время хода , размер поля, игровой мод, информация о мире и т д)
     */
	game.prototype.getOptionsGame = function()
    {
        return this.options ;
    };

    /**
     * Установка опций игры
     */
    game.prototype.setGameOption = function(options)
    {
        for(var key in options)
        {
            if( this.options[key] != undefined)
                this.options[key] = options[key] ;
        }
    };

    /**
     *   Получение индивидуальных свойств для конкретного игрока (цвет фигур, выбор прицела, информация о игроке)
     */
    game.prototype.getOptionsPlayer = function(key)
    {

        if(this.players[key] != undefined)
             return this.players[key].options ;
    };


    /**
     * Дисконект игрока
     * По умолчанию удаляет пользователья из игры и удомляет об этом пользователей
     */
	game.prototype.disconnectPlayer = function(id)
	{	
		var player = this.getPlayerId(id)  ;
		
		if(player == undefined)
			return false ;

		var name = player.login ;

		this.deletePlayer(player) ;

		for(var i = 0 ; i < this.players.length; i++)
		{
			this.players[i].user.socket.emit('playerDisconnectedGame' , {name : name}) ;
		}		
	};

    /**
     * Инициализация модулей
     */

	game.prototype.initModules = function()
	{
		var self = this ;
		
		var modules = self.getModulesOptions() ;
			

		for(var i = 0 ; i < modules.length ; i++)
		{		
			var options = modules[i].options ;
			var module = require(this.app.moduleDirectory + '/' + modules[i].name) ;
			var newModule = new module() ;
			newModule.init(options) ;
			self.modules.push(newModule) ;
		}
	};

    /**
     * Отключаем модули
     */
	game.prototype.offModules = function()
	{
        console.log(this.modules.length) ;

		for(var i = 0 ; i < this.modules.length ; i++)
		{
			if(this.modules[i] != null)
			{
                console.log("destroy module" + i) ;
				this.modules[i].destroy() ;	
				this.modules[i] = null ;	
			}	
		}
	};

    /**
     * Получение модулей
     * Возвращает массив модулей
     */
    game.prototype.getModulesOptions = function()
    {
        return [] ;
    };


    /**
     *   Проверка заполнена или игра
     */
	game.prototype.isFull = function()
	{	
		return (this.maxCountPlayer == this.countPlayer) ;  
	};


    /**
     * Удаляем игрока
     * player - экземпляр игрока
     */

	game.prototype.deletePlayer = function(player)
    {
		var index = this.players.indexOf(player) ;

        if(index != -1)
        {
            this.players.splice(index, 1);
            this.countPlayer--;
        }
	};


    /**
     *  Удаляем игрока по его id
     */
    game.prototype.deletePlayerId = function(id)
    {
        var player = this.getPlayerId(id)  ;

        if(player == undefined)
            return false ;

        this.deletePlayer(player) ;


    };

    /**
     * Создание игрока
     * Этот метод желательно переопределить в игре
     * Возвращаем экземпляр игрока наследуемого от player
     */
    game.prototype.createGamePlayer = function(user)
    {
       return new player(user) ;
    };

    /**
     *  Добавление игрока
     */
	game.prototype.addPlayer = function(user)
	{
        console.log("self.addPlayer2") ;
		if(!this.isFull())
		{
			var player = this.createGamePlayer(user) ;
			this.players.push(player)  ;
			this.countPlayer++ ;
		}	
	};

    /**
     *  Удаление игры
     */
	game.prototype.destroyGame = function() 
	{

		this.offModules() ;

        //Вызываем событие платформы
		this.app.destroyGame(this.gameId) ;

	} ;

    /**
     * Получение игрока по номеру id
     */
	game.prototype.getPlayerId = function(id)
	{
		for(var i = 0 ; i < this.players.length; i++)
		{
			if(this.players[i] == undefined)
				return undefined ;
					
			if(this.players[i].user.id == id)	
			{			
				return this.players[i] ;				
			}	
		}
			
		return undefined ;	
	};
	
	

	
	/**
		Базовый прототип игрока
	*/
	module.exports.player = player = function(user)
	{
		var self = this ;
	
		self.initGame = false ;

        self.options = {} ;

		self.user = user ;

	} ;
	


	
	
	
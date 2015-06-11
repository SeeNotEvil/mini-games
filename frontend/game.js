define("game", ["app", "io"], function(App, Io){
    /**
     * Базовый прототип для игр
     * App класс приложения
     */
	var game = function(options)
	{

        this.directoryGame = options.directory || "games";

        //Модули
        this.modules = [] ;

        //Опции самой игры
        this.optionsGame = self.optionsGame != undefined ? this.optionsGame : {} ;

        //Опции игрока
        this.optionsPlayer = {} ;

        //Флаг инициализации
        this.initialization = false ;
	};



    /**
     * Инициализация игры
     * optionsGame - Опциии игры
     * optionsPlayer - Опции игрока
     * cb - колбэк
     */
	game.prototype.init = function(optionsGame, optionsPlayer, cb)
	{
        var self = this ;

		this.setOptionsGame(optionsGame) ;
        this.setOptionsPlayer(optionsPlayer) ;

        Io.socket.on('startGame', function (data) {

            self.startGame(data) ;

        }) ;

        this.loadedResources(cb) ;
	};

    /**
     *  Загрузка ресурсов
     */

    game.prototype.startGame = function()
    {



    };

    game.prototype.loadedResources = function(cb)
    {
        cb() ;
    };

    /**
     * Установка опций игры
     */
	game.prototype.setOptionsGame = function(optionsGame)
	{
		for(var key in optionsGame)
		{
			if(this.optionsGame[key] != undefined)
				this.optionsGame[key]  = optionsGame[key] ;

		}	
	
	};


    /**
     * Установка опций игрока
     */
    game.prototype.setOptionsPlayer = function(optionsPlayer)
    {

        this.optionsPlayer = optionsPlayer ;
        console.log(this.optionsPlayer) ;
    };

    /**
     * Инициализация модулей
     */
	game.prototype.initModules = function(cb)
	{
		var self = this ;

        //Получаем массив модулей
		var modules = self.getModulesOptions() ;

        //Кол-во модулей
        var countModules  = modules.length ;

        //Кол - во загруженных модулей
        var countLoadedModules = 0 ;

        //Загружаем модули
		for(var i = 0 ; i < modules.length ; i++)
		{		

            (function(options) {


                require([App.appModel.get("moduleDirectory") + modules[i].name + "/frontend/index"], function (module) {

                    var newModule = new module();

                    //После инициализации модуля проверяем все ли инициализированы , и вызываем cb
                    newModule.init(options, function(){
                        if(cb != undefined) {
                            countLoadedModules ++ ;
                            if(countLoadedModules == countModules)
                                cb() ;
                        }

                    });

                    self.modules.push(newModule);


                });

            })(modules[i].options) ;
		}
	};

    /**
     * Возвращаем модули
     */
	game.prototype.getModulesOptions = function()
	{
		return [] ;		
	};


    /**
     * Уничтожаем модули
     */
	game.prototype.offModules = function()
	{

		for(var i = 0 ; i < this.modules.length ; i++) {
			this.modules[i].destroy() ;	
		}
	};

    /**
     * Уничтожение игры
     */
	game.prototype.destroyGame = function()
	{
        Io.socket.removeListener('startGame') ;


		this.offModules() ;
		App.destroyGame() ;
	};


    /**
     *  Событие выхода из игры
     */
	game.prototype.exitGame = function()
    {
        console.log("exitGame") ;
        this.destroyGame() ;

    };
	
	
	return game ;
}) ;


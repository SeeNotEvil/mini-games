    define("app", ["jquery", "io", "mustache", 'bootstrap-dialog'], function($, Io , Mustache, BootstrapDialog){

    /**
    *  Оновной класс приложения
    */

	var App =
    {
        userId: 0,

        login: "",

        //Директории для игры и модулей
        gameDirectory: 'games/' ,

        moduleDirectory: 'module/' ,

        //Локация пользователя
        location: "none",

        //Массив информации об играх
        listGames: {
            water_war: {
                path: "water_war/water_war",
                title: "Морской бой",
                options: {
                    "timeMove" : {
                         html: {
                             type: "input",
                             value: 20,
                             name: "timeMove",
                             label: "Время хода",
                             maxlength: 2,
                             size: 20
                         }
                     },
                    "timePreparation" : {

                        html: {
                            type: "input",
                            value: 20,
                            name: "timePreparation",
                            label: "Время расстановки кораблей",
                            maxlength: 2,
                            size: 20
                        }
                    }
                }
            },
            tic_tac_toe: {
                path: "tic_tac_toe/tic_tac_toe",
                title: "Крестики нолики",
                options: {
                    "timeMove" : {
                        html: {
                            type: "input",
                            value: 20,
                            name: "timeMove",
                            label: "Время хода",
                            maxlength: 2,
                            size: 20
                        }
                    },
                    "mode" : {

                        html: {
                            type: "select",
                            array:
                            [
                                {
                                    label: "Обычный 3x3",
                                    value: "default"
                                },
                                {
                                    label: "Расширенный 10x10",
                                    value: "enlarged"
                                }


                            ],

                            name: "mode",
                            label: "Режим игры",
                            maxlength: 2
                        }
                    },
                    "step" : {

                        html: {
                            type: "select",
                            array: [
                                    {
                                        label: "Крестики",
                                        value: "x"
                                    },
                                    {
                                        label: "Нолики",
                                        value: "o"
                                    },
                                    {
                                        label: "Случайно",
                                        value: ""
                                    },

                                ],

                            name: "step",
                            label: "Первый ход",
                            maxlength: 2
                        }
                    }
                }


            },

            balda: {
                path: "balda/balda",
                title: "Балда",
                options: {
                    "timeMove": {
                        html: {
                            type: "input",
                            value: 20,
                            name: "timeMove",
                            label: "Время хода",
                            maxlength: 2,
                            size: 20
                        }
                    },
                    "language": {
                        html: {
                            type: "select",
                            array: [
                                {
                                    label: "Русский",
                                    value: "russian"
                                }

                            ],
                            name: "language",
                            label: "Язык"
                        }
                    }
                }
            }
        },

        //Модальное окно для сообщений платформы
        modalWindow: null,

        //Текущая игра
        game: null,

        //Интервал для таймера
        interval: null,

        /**
         * Инициализация игры
         */
        init: function () {

            //Инициализируем сокет
            Io.init();
            //Вешаем обработчики кнопок
            App.onHandlers();

            //Кэшируем шаблоны для платформы
            App.cacheTemplate();
            App.$area.html(App.$templateAuthorize);

            //События сокетов
            Io.socket.on('showFreeGames', App.showFreeGames);
            Io.socket.on('updateStatistic', App.updateStatistic);

            Io.socket.on('connectedGame', App.connectedGame);
            Io.socket.on('connectedUserGame', App.connectedUserGame);
            Io.socket.on('readyToStartGameTimer', App.readyToStartGameTimer);
            Io.socket.on('initGame', App.initGame);
            Io.socket.on('playerLeaveGameLobby', App.playerLeaveGameLobby);
            Io.socket.on('creatorLeaveGameLobby', App.creatorLeaveGameLobby);

            Io.socket.on('disconnect', App.disconnect);

        },

        /**
         * Кэшируем шаблоны
         */
        cacheTemplate: function()
        {
            App.$doc = $(document);
            App.$area = $('#area');
            App.$templateGamesList = $('#list-game-template').html();
            App.$templateApplication = $('#application-template').html();
            App.$templateAuthorize = $('#authorize-template').html();
            App.$templateGames = $('#games-template').html();
            App.$templateOpenCreateGame = $('#open_create_game-template').html();
            App.$templateHosting = $('#hosting-template').html()  ;
            App.$templateStatistic = $('#statistic-template').html()  ;

        },


        /**
         * Установка локации
         */
        setLocation: function(state)
        {


            if(state == 'menu') {
                if(App.location != 'none' || App.location != 'game') {

                    App.addSideBar("create") ;
                    App.$area.html(App.$templateApplication);
                }
                else {
                    App.addSideBar("create") ;
                }

                App.location = 'menu'   ;

            }
            else if(state == 'lobby') {

                App.addSideBar("exit") ;

                App.location = 'lobby'   ;
            }
            else if(state == 'game') {

                App.location = 'game'   ;

            }



        },

        /**
         * Добавление сайд - бара
         */
        addSideBar : function(state)
        {
            if(state == 'create')
                $('#sideBarMenu').html('<a class = "openCreateGame" href="#">Создать игру</a>') ;
            else if(state == 'exit')
                $('#sideBarMenu').html(' <a class = "exitGame" href="#">Выйти</a>') ;

        },

        /**
         * Обновление статистики
         */
        updateStatistic: function(data)
        {
            var temp = Mustache.to_html(App.$templateStatistic, data);
            $('#statistic').html(temp) ;

        },

        /**
         * Показываем комнаты
         */
        showFreeGames: function(data)
        {

            if(data.games[0] == undefined)
            {
                $('#content').html("") ;
                return ;
            }


            var games = data.games ;

            $('#content').html(App.$templateGamesList) ;

            for(var i = 0 ; i < games.length; i++) {
                games[i].title = App.listGames[games[i].titleGame].title ;
            }

            var temp = Mustache.to_html(App.$templateGames, {games : games});

            $('#listGames').html(temp) ;


        },

        /**
         *  Преобразование даты
         */
        getDate : function()
        {
            var now = new Date();

            var date = now.getDate()  + '-' + now.getMonth() + '-' + now.getFullYear() + '   ' +
                       now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

            return date ;

        },




        /**
         *  Вешаем обработчики
         */

		onHandlers : function()
		{
			$('#area').on('click', '.sendLogin', function(){
				var login = $('#login-input').val() ;
				if(login != "")
					App.sendLogin(login) ;
				else
					App.showError("Поле логин не может быть пустым!!!") ;
			}) ;
			
			$('#body').on('click', '.createGame', function()
			{
                var titleGame = $('#selectOptionGame').val() ;
				App.hostingGame(titleGame) ;
														
			})  ;
			
			$('#area').on('click', '.btnJoinGame', function(event)
			{
                event.preventDefault();
				var gameId = $(this).data('game_id') ;
				App.connectingToGame(gameId) ;
														
			})  ;


            $('#area').on('click', '.exitGame', function(event)
            {
                event.preventDefault();
                console.log("dsd") ;
                App.exitGame() ;
            })  ;


            $('#body').on('change', '.selectOptionGame', function(event)
            {

                var value = $(this).val() ;

                App.setGameOptionsHtml(value) ;

            });

            $('#area').on('click', '.openCreateGame', function(event)
            {
                event.preventDefault();
                App.modalWindow = BootstrapDialog.show({
                     title: 'Создание игры',
                     message:  App.$templateOpenCreateGame
                });

            })  ;
		},
		
		setGameOptionsHtml: function(title)
        {
            if( App.listGames[title] != undefined)
            {
                var options = App.listGames[title].options;
                var html = App.getOptionHtml(options);
                $('#optionsGame').html(html);
            }
            else
            {
                $('#optionsGame').html("");
            }

        },
		
		//Отправка логина (прохождение авторизации)
		sendLogin: function(login)
		{		
			Io.socket.emit('sendLogin', {login : login}, App.authorization) ;	
		},

		//Результаты авторизации
		authorization: function(data)
		{
			if(data.status) 
			{
				App.userId = data.userId ; App.login = data.login ;

                App.setLocation('menu') ;

                Io.socket.emit('showMenu', {}) ;
			}	
			else
				App.showError("Ошибка авторизации") ;
		},
		
		//Показать ошибку
		showError: function(text)
		{
			$('#message').html(text) ;
		},
		
		//Показать сообщение
		consoleLobbyText: function(text)
		{
            var date = App.getDate() ;
            $('#consoleLobby').append('<p>' + date + '  ' + text + '</p>') ;
		},




        getOptionHtml: function(options)
        {
            var html = "" ;

            for(var key in options)
            {
                var htmlOption = options[key].html ;

                if(htmlOption.type == "input")
                {

                    var temp = "" ;

                    if(htmlOption.maxlength != undefined)
                        temp += ' maxlength = "' + htmlOption.maxlength + '"' ;

                    if(htmlOption.size != undefined)
                        temp += ' size = "' + htmlOption.size + '"';



                    html += '<p>' +htmlOption.label + '</p>' ;
                    html += '<input style="width:40px"' + temp +' name = "'+ htmlOption.name+'"  ' +
                            'class="option-game-control" value = "'+ htmlOption.value +'" type="text" >' ;
                    console.log(html) ;

                }
                else if(htmlOption.type == "select")
                {

                    html += '<p>' + htmlOption.label + '</p>' ;
                    html += '<select name = "'+ htmlOption.name +'"  class="option-game-control" >' ;

                    if(htmlOption.array != undefined) {
                        var array = htmlOption.array;

                        for (var key in array) {
                            html += '<option  value = "' + array[key].value + '" >' + array[key].label + ' </option>';

                        }
                    }

                    html += '</select>' ;

                }
            }

            return html ;

        },



        getOptionsGame: function()
        {
            var options  = {} ;

            $('.option-game-control').each(function(i, elem)
            {

                var name =  $(this).attr("name") ;
                var value =  $(this).val() ;


                options[name] = value ;

            }) ;

            return options;

        },

        /**
         * Запрос на создание игры
         */
		hostingGame: function(titleGame)
		{
            var options = App.getOptionsGame() ;
			Io.socket.emit('hostingGame', {titleGame : titleGame, options:  options }, App.hostedGame) ;
			
		},

        /**
         * Создалась игра
         */

        hostedGame: function(data)
        {

            App.modalWindow.close() ;

            App.setLocation("lobby") ;

            var temp = Mustache.to_html(App.$templateHosting, { message : "Игра -" ,
                                                                titleGame  :  App.listGames[data.titleGame].title});


            $('#content').html(temp) ;

            App.showLobbyParameters(data.titleGame, data.optionsGame) ;

            App.consoleLobbyText("Вы создали игру ...") ;
        },

        /**
         * Присоеденение к игре
         */

		connectingToGame: function(id)
		{
			Io.socket.emit('connectingToGame', {gameId : id}) ;
		},


        /**
         *  Присоеденились к игре
         */

		connectedGame: function(data)
		{		

			App.gameId = data.gameId ;

            App.setLocation("lobby") ;

            var temp = Mustache.to_html(App.$templateHosting, { message : "Игра -" ,
                                                                titleGame  :  App.listGames[data.titleGame].title});


            $('#content').html(temp) ;

            App.showLobbyParameters(data.titleGame, data.optionsGame) ;

            App.consoleLobbyText("Вы присоеденились к игре ...") ;

			
		},

        showLobbyParameters: function(title, options)
        {
            var html = '' ;

            if(App.listGames[title] == undefined)
                return ;


            for(var key in options)
            {
                if(App.listGames[title].options[key] != undefined)
                     html += '<p>' + App.listGames[title].options[key].html.label + ' : ' + options[key] + '</p>' ;
            }

            $('#lobbyParameterGame').html(html) ;

        },

        /**
         *  Создалась игра
         */

		connectedUserGame: function(data)
		{
            App.consoleLobbyText('К вам присоеденился игрок-' + data.name) ;

		},

        /**
         * Игрок отсоеденился от лобби
         */
		playerLeaveGameLobby: function(data)
		{
            App.consoleLobbyText('Игрок ' + data.name + 'отсоеденился от игры ') ;
            App.stopTimer() ;

		},
		
		creatorLeaveGameLobby: function(data)
		{
            App.consoleLobbyText('Создатель игры  ' + data.name + ' вышел ') ;
            App.stopTimer() ;
            App.setLocation("menu") ;
            Io.socket.emit('showMenu', {}) ;

		},


        /**
         * Отсчет начала игры
         */

		readyToStartGameTimer: function(data)
		{		
			App.startTimer(data.time, 1, function(time)
										 {
                                            App.consoleLobbyText('До начала игры ' + time) ;

											if(time <=0)
												App.stopTimer() ;

										 }) ;
						  
		},

        /**
         * Старт игры
         */
		initGame: function(data)
		{

            App.consoleLobbyText('Инициализация игры  ') ;

			App.createInitGame(data.title, data.optionsGame,  data.optionsPlayer) ;

		},
		
		
		playerLeaveGame: function(data)
		{
			$('#timer').html("") ;		
		},


		createInitGame: function(title, optionsGame, optionsPlayer)
		{


			if(App.listGames[title] != undefined) 
			{	
				
				require([App.gameDirectory + App.listGames[title].path], function(game)
				{
                    console.log("createInitGame") ;
					App.game = new game() ;	
					App.game.init(optionsGame, optionsPlayer, function(){
                        App.location = 'game';
                        Io.socket.emit('initGamePlayers', {}) ;
                    }) ;
				
				});

			}

		},
		
		

		
		//Выполнение таймера	
		startTimer : function(startTime, delay, callback)
		{
			var time = startTime * 1000 ;
			var delay =  delay * 1000 ;
			
			App.interval = setInterval(function()
			{		
				callback(time / 1000) ;	
				time = time  - delay ;	
			}, delay);
			
			return time ;		
		},
		
		//Стоп таймер
		stopTimer : function() 
		{
			clearInterval(App.interval) ;
		},
		
		
		destroyGame: function()
		{
			App.game = null ;
            App.setLocation("menu") ;
            Io.socket.emit('showMenu', {}) ;
		},


        disconnect: function()
        {
            if(App.game == null)
                App.showError("Соеденение потеряно , попробуйте подключится позднее...") ;
            else if (App.game.initialization)
                App.game.disconnect() ;

        },

        exitGame: function()
        {
            Io.socket.emit('exitGame', {}, App.exit) ;
        },

        exit: function()
        {
            if(App.game != null)
            {
                App.game.exitGame();
            }
            else
            {
                App.setLocation("menu") ;
                Io.socket.emit('showMenu', {}) ;
                App.stopTimer() ;
            }

        }

	};
	
	
	return App ;
});
	
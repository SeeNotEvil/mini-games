define("app", ["jquery", "io", 'backbone', 'bootstrap-dialog',  'validator'],
           function($, Io , Backbone, BootstrapDialog, Validator){


    /*
    *  Модели данных
    */
    var Statistic = Backbone.Model.extend({

        defaults: {
            countGame: 0,
            countUsers: 0,
            countUsersInGame: 0,
            countUsersInLobby: 0,
            countFreeUser: 0
        }
    });

    var Game = Backbone.Model.extend({

        defaults: {
            title: "",
            time: "",
            nameCreatorGame: "",
            countPlayer: 0,
            maxCountPlayer: 0,
            gameId : 0,
            isFull: true

        }
    });

    var LobbyModel = Backbone.Model.extend({

        defaults: {

            titleGame: "Морской бой",
            message: "Создана игра",
            textsConsole: [],
            options: []

        },

        initialize: function() {

            this.set("textsConsole", []) ;
            this.set("options", []) ;

        },

        clear: function() {

            this.set("textsConsole", []) ;
            this.set("options", []) ;

        },

        //Сделано для будущего логирования собщений
        addText: function(text) {
            this.get("textsConsole").push(text) ;
            this.trigger("addText", text) ;
        },

        setOptions: function(optionsGame, titleGame) {

            var configGames = App.appModel.get("configGames") ;

            this.set("titleGame", configGames[titleGame].label) ;

            var gameValues ;

            for (var key in optionsGame) {


                if((gameValues = configGames[titleGame].values[key]) != undefined) {

                    var option = {} ;

                    if(gameValues.label != undefined)
                        option.label = gameValues.label ;
                    else
                        option.label = key ;

                    if (gameValues.value instanceof Object) {

                        if(gameValues.value[optionsGame[key]] != undefined)
                            option.value = gameValues.value[optionsGame[key]] ;
                        else
                            option.value = optionsGame[key] ;
                    }
                    else {
                        option.value = optionsGame[key] ;

                    }

                    this.get("options").push(option) ;
                }

            }
            return this ;
        }



    });


    var GameCollection = Backbone.Collection.extend({

         model: Game

     });

    var AppModel = Backbone.Model.extend({

        defaults: {

            gameDirectory: 'games/' ,
            moduleDirectory: 'module/',
            error: "",
            configGames: {},
            game: null,
            authorization: false,
            user: ""
        }
    });

    var User = Backbone.Model.extend({

        defaults: {
            userId: 0,
            login: ""
        }

    }) ;

    /*
    *Виды
    */
    var GameView = Backbone.View.extend({

        template: _.template($('#games-template').html()),

        events:  {
            "click .btnJoinGame" : "joinGame"
        },

        joinGame: function(event) {

            event.preventDefault();

            var gameId = this.model.get("gameId") ;
            App.connectingToGame(gameId) ;


        },

        render: function() {

            $(this.el).html(this.template(this.model.toJSON()));

            return this;
        }

    });


     var GameListView = Backbone.View.extend({

         template: _.template($('#list-game-template').html()),

         render: function() {

             var self = this;

             $(this.el).html(this.template());

             _.each(App.gamesCollection.models, function (game) {

                 var gameView = self.renderGame(game);
                 console.log(gameView) ;
                 $(this.el).find("#listGames").append(gameView) ;

             }, this);

             return this;
         },

         renderGame: function(game) {


             var gameView = new GameView({
                 model: game
             });

             return gameView.render().el ;
         }

     });

     var StatisticView = Backbone.View.extend({

         template: _.template($('#statistic-template').html()),

         initialize: function(){

             App.statisticModel.bind('change', this.render, this);

         },

         render: function() {

             $(this.el).html(this.template(App.statisticModel.toJSON()));

             return this;

         }

     }) ;


     var LobbyView = Backbone.View.extend({

         template: _.template($('#hosting-template').html()),

         initialize: function(){

             App.lobbyModel.bind('addText', this.addConsoleText, this);

         },


         render: function() {

             $(this.el).html(this.template(App.lobbyModel.toJSON()));
             return this;

         },


         addConsoleText: function(text) {

             var date = this.getDate() ;
             $('#consoleLobby').append('<p>' + date + '  ' + text + '</p>') ;

         },

         getDate : function() {
             var now = new Date();

             var date = now.getDate()  + '-' + now.getMonth() + '-' + now.getFullYear() + '   ' +
                        now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

             return date ;
         }

     });


     var FormView = Backbone.View.extend({

         initialize: function() {

             this.validator = new Validator() ;

         },

         template: _.template($('#open_create_game-template').html()),

         events: {
             "change .selectOptionGame" : "selectGame",
             "click .createGame" : "createGame"
         },

         createGame: function() {

             var titleGame = $('#selectOptionGame').val() ;

             if(titleGame == "")
                return ;

             var configGames = this.model.get("configGames") ;

             if(configGames[titleGame] == undefined)
                return ;

             if(configGames[titleGame].rules != undefined) {

                 this.validator.setValidateInfo(configGames[titleGame].rules) ;
                 if(!this.validator.doValidateForm($('#optionsGame'), true))
                    return ;
             }

             var options = this.getOptionsGame() ;

             App.hostingGame(titleGame, options);
         },

         getOptionsGame: function() {

             var options = {} ;

             $('#optionsGame').find("input,select").each(function(i, elem) {

                 if($(this).attr("type") == "submit")
                     return ;

                 var nameElement = $(this).attr("name") ;

                 var valueElement = $(this).val() ;

                 options[nameElement] = valueElement ;
             }) ;

             return options ;

         },


         selectGame: function(event) {

             var value = $('#selectOptionGame').val() ;

             if(value != "") {

                 require(["frontend/text!" + this.model.get("gameDirectory") + value + "/frontend/form.html"], function(form){

                    $('#optionsGame').html(form) ;

                 });
             }
             else {
                 $('#optionsGame').html("") ;
             }

         },

         render: function() {

             $(this.el).html(this.template(this.model.toJSON()));

             return this;

         }

     });

     var AppView = Backbone.View.extend({

         el: $('#area'),

         models : {},

         views : {} ,

         gameHosted : false,

         modalWindow : null,

         initialize: function(){
             this.model.bind('change:error', this.showError, this);
             this.views.statisticView = new StatisticView({});
             this.views.lobbyView = new LobbyView({});
             this.views.gameListView = new GameListView({});
         },

         /*!!!!!!!!!!!!!*/
         events:  {
            "click .openCreateGame" : "openForm",
            "click .sendLogin" : "sendLogin",
            "click .exitGame" : "exitGame"
         },

         exitGame:function(event) {

             event.preventDefault();

             App.exitGame() ;
         },

         exitPlatform: function() {

            App.exitPlatform() ;

         },

         addStyle: function(css) {

             var styleElement = document.createElement("style");
             styleElement.type = "text/css";

             if (styleElement.styleSheet) {
                 styleElement.styleSheet.cssText = css;
             } else {
                 styleElement.appendChild(document.createTextNode(css));
             }

             document.getElementsByTagName("head")[0].appendChild(styleElement);

         },

         sendLogin: function() {

            var value = $('#login-input').val() ;

            App.sendLogin(value) ;

         },


         openForm: function(event) {

             var formView = new FormView({

                model: this.model

             }) ;

             event.preventDefault();

             this.modalWindow = BootstrapDialog.show({
                 title: "Создание игры",
                 message:  formView.render().el
             });

         },

         templates: {

             "application-template" : _.template($('#application-template').html()),
             "authorize" : _.template($('#authorize-template').html())

         },

         showError: function() {

            $('#message').html(this.model.get("error")) ;

         },

         render: function(command) {

             switch (command) {

                 case "none":
                     this.renderEmpty() ;
                 break ;

                 case "authorize":
                     this.renderAuthorize() ;
                 break ;

                 case "platform":
                     this.renderPlatform() ;
                 break ;

                 case "main-menu":
                     this.renderListGame() ;
                 break ;

                 case "lobby":
                     this.renderLobby() ;
                 break ;

             }
         },

         renderAuthorize: function() {

             $(this.el).html(this.templates["authorize"](this.model.toJSON()));

         },

         renderPlatform: function() {

             $(this.el).html(this.templates["application-template"](this.model.toJSON()));

             $('#statistic').html(this.views.statisticView.render().el) ;

         },

         renderLobby: function() {

             if(this.modalWindow != null) {

                 this.modalWindow.close() ;
                 this.modalWindow = null ;
             }

             $('#sideBarMenu').html(' <a class = "exitGame" href="#">Выйти</a>') ;

             $('#content').html(this.views.lobbyView.render().el) ;

             return this ;
         },

         renderListGame: function() {
             this.views.gameListView = new GameListView({});

             $('#sideBarMenu').html('<a class = "openCreateGame" href="#">Создать игру</a>') ;

             $('#content').html(this.views.gameListView.render().el) ;

         },


         renderEmpty: function() {

            $(this.el).html(this.templates["application-template"](this.model.toJSON()));

         }
     });


     var App =
     {

         interval : null ,

         css: {},

         lobby: false,

         init: function (configGames) {


             //Инициализируем сокет
             Io.init();
             //Вешаем обработчики кнопок
             App.onSocketHandlers();

             App.appModel = new AppModel({
                 configGames: configGames
             }) ;

             App.lobbyModel =  new LobbyModel() ;
             App.statisticModel = new Statistic();
             App.gamesCollection = new GameCollection();

             App.appView = new AppView({
                 model: App.appModel
             });

             App.appView.render("authorize");

         },


         //Отправка логина (прохождение авторизации)
         sendLogin: function(login) {

             if(login == "") {
                 App.appModel.set("error", "Поле логин не может быть пустым!!!") ;
                 return ;
             }

             Io.socket.emit('sendLogin', {login : login}, App.authorization) ;
         },

         setStyle: function(css) {

             if(App.css[css.name] == undefined) {

                 App.css[css.name] = css ;
                 App.appView.addStyle(css) ;

             }

         },

         getLogin: function() {

             return App.user.get("login") ;

         },

         //Результаты авторизации
         authorization: function(data) {

             if(data.status)  {
                 App.appModel.set("authorization", true) ;
                 App.user = new User(data) ;
                 App.appView.render("platform");
                 Io.socket.emit('showMenu', {}) ;
             }
             else
                 App.appModel.set("error", "Ошибка авторизации") ;
         },

         onSocketHandlers: function() {

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
          * Показываем комнаты
          */
         showFreeGames: function(data) {

             var games = [] ;

             var label = "" ;

             for(var i = 0 ; i < data.games.length; i++) {
                 var titleGame = data.games[i].titleGame ;

                 if((label = App.appModel.get('configGames')[titleGame].label) != undefined)
                     data.games[i].label =  label ;

                 games.push(new Game(data.games[i])) ;
             }

             App.gamesCollection = new GameCollection(games) ;

             App.appView.render("main-menu");

         },

         updateStatistic: function(data) {
             App.statisticModel.set(data) ;
         },

         /**
          * Запрос на создание игры
          */
         hostingGame: function(titleGame, options){

             Io.socket.emit('hostingGame', {titleGame : titleGame, options:  options }, App.hostedGame) ;

         },

         /**
          * Присоеденение к игре
          */
         connectingToGame: function(id) {
             Io.socket.emit('connectingToGame', {gameId : id}) ;
         },

         /**
          *  Присоеденились к игре
          */
         connectedGame: function(data) {

            // App.appModel.set("gameId", data.gameId) ;

             App.lobbyModel.clear() ;
             App.lobbyModel.setOptions(data.optionsGame, data.titleGame) ;
             App.appView.render("lobby");
             App.lobbyModel.addText("Вы присоеденились ...") ;
             App.lobby = true ;

         },



         /**
          * Полный выход из платформы
          *
          */
         exitPlatform: function() {

             if(App.lobby)
             {
                 Io.socket.emit('exitGame', {}, function(){
                     App.appView.render("authorize");
                     App.stopTimer() ;
                     App.lobby = false ;
                 }) ;
             }
             else
                 App.appView.render("authorize");
         },

         /**
          * Создалась игра
          */
         hostedGame: function(data)  {

             /*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

             App.lobbyModel.clear() ;
             App.lobbyModel.setOptions(data.optionsGame, data.titleGame) ;
             App.appView.render("lobby");
             App.lobbyModel.addText("Вы создали игру ...") ;
             App.lobby = true ;
         },

         /**
          * Отсчет начала игры
          */

         readyToStartGameTimer: function(data)
         {
             App.startTimer(data.time, 1, function(time)
             {

                 if(time <=0) {

                     App.stopTimer() ;
                     App.lobbyModel.addText('Инициализация игры') ;
                 }

                 App.lobbyModel.addText('До начала игры ' + time) ;
             }) ;

         },

         /**
          *  Создалась игра
          */

         connectedUserGame: function(data) {

             App.lobbyModel.addText('К вам присоеденился игрок-' + data.name) ;
         },

         /**
          * Игрок отсоеденился от лобби
          */
         playerLeaveGameLobby: function(data) {
             App.lobbyModel.addText('Игрок ' + data.name + 'отсоеденился от игры ') ;
             App.stopTimer() ;

         },

         creatorLeaveGameLobby: function(data)
         {
             App.lobbyModel.addText('Создатель игры  ' + data.name + ' вышел ') ;
             App.stopTimer() ;

             Io.socket.emit('showMenu', {}) ;

         },

         /**
          * Старт игры
          */
         initGame: function(data) {

             App.stopTimer() ;

             App.createInitGame(data.title, data.optionsGame,  data.optionsPlayer) ;

         },

         createInitGame: function(title, optionsGame, optionsPlayer) {

             if(App.appModel.get("configGames")[title] != undefined) {

                 var directory = App.appModel.get("gameDirectory") + title + "/frontend/";

                 require([directory + "index"], function(Game) {

                     var game = new Game({
                         directory : directory
                     }) ;

                     App.appModel.set("game", game) ;
                     App.appView.renderEmpty() ;

                     game.init(optionsGame, optionsPlayer, function(){
                         console.log("initGamePlayers") ;
                         Io.socket.emit('initGamePlayers', {}) ;
                     }) ;

                     game = null ;

                 });

             }

         },


         //Выполнение таймера
         startTimer : function(startTime, delay, callback)
         {
             var time = startTime * 1000 ;
             var convertDelay =  delay * 1000 ;

             App.interval = setInterval(function()
             {
                 callback(time / 1000) ;
                 time = time  - convertDelay ;
             }, convertDelay);

             return time ;
         },

         //Стоп таймер
         stopTimer : function() {
             console.log("stopTimer") ;
             clearInterval(App.interval) ;
         },


         destroyGame: function()
         {
             App.appModel.set("game" , null) ;
             App.appView.render("platform") ;
             Io.socket.emit('showMenu', {}) ;
         },

         disconnect: function() {

             if(App.appModel.get("game") == null)
                 App.appModel.set("error", "Соеденение потеряно , попробуйте подключится позднее...") ;
             else if (App.appModel.get("game").initialization)
                 App.appModel.get("game").disconnect() ;

         },

         exitGame: function(){

             Io.socket.emit('exitGame', {}, App.exit) ;
         },

         exit: function() {

             if(App.appModel.get("game") != null)  {
                 App.appModel.get("game").exitGame();

             }
             else {
                 App.appView.render("platform") ;
                 Io.socket.emit('showMenu', {}) ;
                 App.stopTimer() ;
                 App.lobby = false ;
             }
         }
     };



     return App ;
});
	
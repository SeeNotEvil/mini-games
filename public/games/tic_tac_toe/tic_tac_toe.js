    /**
     * Пример подлкючаемоего файла игры
     * Порядок запуска игры
     * game.prototype.setGameOption - установка опций игры в массив game.prototype.options
     * game.prototype.init - инициализация игры
     * game.prototype.getOptionsGame - передача клиенту общих опций игры ,возвращает game.prototype.options
     * game.prototype.getOptionsPlayer - передача клиенту индивидуальных опций игрока, возвращает player.prototype.options
     * game.prototype.init - инициализирует игру
     * game.prototype.startGame - стартует игру
     */

    define("games/tic_tac_toe/tic_tac_toe",["game", "jquery", "util", "io", "app", "mustache"],
        function(game, $, util, Io, App, Mustache) {

            //Обьект игры "Морской бой"
            var tic_tac_toe = function () {

                tic_tac_toe.super_.apply(this, arguments);

                var self = this;

                self.field = null ;

                self.nowPlayer = null ;

                self.opponent = null ;

                self.user = null ;

                self.template = null;

                self.optionsGame = {
                    element: 'area',
                    timeMove: 40,
                    login: "username",
                    countCells : 3,
                    countCellsWin: 3,
                    mode : "default"

                } ;



                self.loadedResources = function (callback) {
                    require([App.gameDirectory + "tic_tac_toe/template"], function (template) {
                        self.template = template;
                        self.initGame(callback);
                    })
                };


                self.initGame = function (callback) {

                    if(self.optionsGame.mode == "enlarged")
                        self.field = new field(200, 100, self.optionsGame.countCells, 30, self);
                    else
                        self.field = new field(200, 100, self.optionsGame.countCells, 90, self);



                    self.opponent = new player(self.optionsPlayer.opponent.login , self.optionsPlayer.opponent.step) ;
                    self.user = new player(self.optionsPlayer.nowPlayer.login , self.optionsPlayer.nowPlayer.step) ;


                    self.initCanvas() ;
                    self.onSocketHandlers() ;
                    self.field.init() ;
                    self.initModules() ;

                    callback() ;

                };


                self.init = function (options, cb) {
                    tic_tac_toe.super_.prototype.init.apply(this, arguments);
                };




                self.onSocketHandlers = function() {
                    Io.socket.on('attacked', function (data) {

                        self.field.hit(data.cell.x, data.cell.y, self.opponent.step) ;
                    });

                    Io.socket.on('startGame', function (data) {


                        if(self.user.step == "x") {

                            self.nowPlayer = self.user ;
                            self.field.block = false ;
                            self.step() ;
                        }
                        else {
                            self.nowPlayer = self.opponent ;
                            self.step() ;
                        }

                    });


                    Io.socket.on('newStep', function(data) {
                        self.swap();
                        self.step() ;
                    });


                    Io.socket.on('gameOver', function(data) {
                        self.field.block = true ;
                        if(data.state == "win") {
                            $('#gameMessage').html("Вы победили!!!") ;
                            self.field.drawLine(data.cells) ;
                        }
                        else if(data.state == "lose") {
                            $('#gameMessage').html("Вы проиграли!!!") ;
                            self.field.drawLine(data.cells) ;
                        }
                        else if(data.state == "draw")
                            $('#gameMessage').html("Ничья!!!!") ;


                        App.stopTimer() ;
                    });

                    Io.socket.on('playerDisconnectedGame', function(data)
                    {
                        App.stopTimer() ;
                        $('#gameMessage').html("Оппонент отсоеденился от игры!!!") ;


                    });





                };

                self.swap = function() {

                    if(self.nowPlayer == self.user) {
                        self.field.block = true;
                        self.nowPlayer = self.opponent ;
                    }
                    else {
                        self.field.block = false ;
                        self.nowPlayer = self.user ;
                    }


                };

                self.step = function() {
                    App.stopTimer() ;

                    if(self.nowPlayer == self.user)
                        $('#gameMessage').html("Ваш ход!!! " + self.optionsGame.timeMove) ;
                    else
                        $('#gameMessage').html("Ходит соперник !!!" + self.optionsGame.timeMove) ;

                    App.startTimer(self.optionsGame.timeMove - 1, 1, function(time){

                        if(self.nowPlayer == self.user)
                            $('#gameMessage').html("Ваш ход!!! " + time) ;
                        else
                            $('#gameMessage').html("Ходит соперник !!!" + time) ;

                        if(time <= 0) {
                            App.stopTimer() ;
                        }

                    })

                };

                self.initCanvas = function() {
                    var temp = Mustache.to_html(self.template, {
                        login : App.login ,
                        opponent  : self.opponent.login
                     });


                    $('#' + self.optionsGame.element).html(temp) ;

                    self.canvas = document.getElementById("canvas");
                    self.drawContext = self.canvas.getContext('2d');
                };


                self.shot = function(x, y) {
                    console.log( self.user) ;
                    Io.socket.emit("shot", {cell : {x: x, y: y}} , function() {
                        self.field.hit(x, y ,  self.user.step) ;
                    }) ;
                };

                self.getModulesOptions = function()
                {
                   
                    return [
                        {
                            path : "chat/chat" ,

                            options : {element: 'chat',
                                       socket: Io.socket,
                                       login: "dasdsa"}
                        }
                    ] ;
                };


                self.offSocketHandlers = function() {
                    Io.socket.removeListener('sendMessageChat') ;
                    Io.socket.removeListener('newStep') ;
                    Io.socket.removeListener('gameOver') ;
                    Io.socket.removeListener('attacked') ;

                };

                self.destroyGame = function() {


                    self.offSocketHandlers() ;
                    App.stopTimer() ;
                    tic_tac_toe.super_.prototype.destroyGame.apply(this, arguments);


                }
            };


            var field = function(x, y, countCells, lengthCell, game)
            {
                var self = this ;

                self.mask = [] ;

                self.countCells = countCells ;

                self.block = true ;

                self.game = game ;

                self.cellsFill = new Point(0,0)  ;

                self.lengthCell = lengthCell ;

                self.lengthField =  countCells * lengthCell;

                self.x = x ; self.y = y ;

                self.init = function() {
                    self.createMask() ;
                    self.draw() ;

                    $(self.game.canvas).on('mousemove', self.hover) ;
                    $(self.game.canvas).on('click', self.shot ) ;

                };


                self.createMask = function() {

                    for(var i = 0; i < self.countCells ; i++) {
                        self.mask[i] = [] ;

                        for(var j = 0 ; j < self.countCells ; j++) {
                            self.mask[i][j] = null ;
                        }
                    }
                };

                self.hit = function(x, y, sign) {
                    if(self.mask[x][y] == null)
                        self.mask[x][y] = sign ;

                    self.draw() ;

                };


                self.hover = function(e)
                {
                    if(self.block)
                        return ;

                    var coordinateX = e.pageX - $(self.game.canvas).offset().left ;
                    var coordinateY = e.pageY - $(self.game.canvas).offset().top ;



                    //Проверяем находимся ли мы над полем
                    if(coordinateX > self.x  && coordinateX < self.lengthField + self.x
                        && coordinateY > self.y && coordinateY < self.y + self.lengthField){



                        var y = Math.ceil((coordinateY - self.y) / self.lengthCell) - 1;
                        var x = Math.ceil((coordinateX - self.x) / self.lengthCell) - 1;

                        //Проверям свободная ли это ячейка?
                        if(self.mask[x][y] == null)
                            self.drawFillCell(x, y) ;
                    }
                    else {
                        if(self.cellsFill.x != -1 || self.cellsFill.y != -1)
                            self.draw() ;
                    }

                };

                self.shot = function() {

                    if(self.block)
                        return ;


                    var x = self.cellsFill.x ;
                    var y = self.cellsFill.y ;

                    if(x > -1 || y > -1) {
                  
                        if(self.mask[x][y] == null)
                            self.game.shot(x, y) ;

                    }


                };




                //Отрисовываем поле
                self.draw = function() {

                    self.drawClearField() ;


                    for(var i = 0; i < self.countCells; i++) {

                        for(var j = 0 ; j < self.countCells; j++) {

                            self.game.drawContext.lineWidth = 2;

                            self.game.drawContext.strokeRect(self.x + self.lengthCell * j,
                                                             self.y + self.lengthCell * i,
                                                             self.lengthCell, self.lengthCell);


                            if(self.mask[i][j] != null) {
                               
                                if(self.mask[i][j] == "o")
                                    self.DrawToe(i, j) ;
                                else if(self.mask[i][j] == "x")
                                    self.DrawTic(i, j) ;

                            }
                        }
                    }

                };


                self.DrawTic = function(x, y) {
                    var coordX = self.x + (x + 1) * self.lengthCell; var coordY = self.y + (y +1) * self.lengthCell;
                    self.game.drawContext.beginPath() ;
                    self.game.drawContext.moveTo(coordX, coordY) ;
                    self.game.drawContext.lineTo(coordX - self.lengthCell, coordY - self.lengthCell) ;
                    self.game.drawContext.moveTo(coordX , coordY - self.lengthCell) ;
                    self.game.drawContext.lineTo(coordX - self.lengthCell, coordY) ;
                    self.game.drawContext.stroke();

                };

                self.DrawToe = function(x, y) {

                    var centerX = self.x + (x + 1) * self.lengthCell - self.lengthCell / 2 ;
                    var centerY = self.y + (y + 1)  * self.lengthCell - self.lengthCell / 2 ;
                    var radius = self.lengthCell / 8 ;

                    self.game.drawContext.beginPath();
                    self.game.drawContext.arc(centerX, centerY, radius, 0, 2*Math.PI, true);
                    self.game.drawContext.fill();
                    self.game.drawContext.stroke();

                };

                self.drawClearField = function() {
                    self.cellsFill.x = -1 ; self.cellsFill.y = -1 ;
                    self.game.drawContext.clearRect(self.x - 5, self.y - 5, self.lengthField + 5, self.lengthField + 5);

                };


                self.drawFillCell = function(x, y) {
                    if(self.cellsFill.x != x || self.cellsFill.y != y) {
                        self.draw() ;

                        self.game.drawContext.fillRect(self.x + self.lengthCell * x,
                            self.y + self.lengthCell * y,
                            self.lengthCell, self.lengthCell);

                        self.cellsFill = new Point(x, y) ;
                    }
                };


                self.drawLine = function(cells) {
                    var startX = self.x + (cells[0].x + 1) * self.lengthCell - self.lengthCell / 2 ;
                    var startY = self.y + (cells[0].y + 1)  * self.lengthCell - self.lengthCell / 2 ;
                    var endX = self.x + (cells[cells.length - 1].x + 1) * self.lengthCell - self.lengthCell / 2 ;
                    var endY = self.y + (cells[cells.length - 1].y + 1)  * self.lengthCell - self.lengthCell / 2 ;

                    self.game.drawContext.beginPath() ;
                    self.game.drawContext.lineWidth = 15;
                    self.game.drawContext.strokeStyle = "#ff0000";
                    self.game.drawContext.moveTo(startX, startY) ;
                    self.game.drawContext.lineTo(endX, endY) ;
                    self.game.drawContext.stroke();

                }

            };



            var player = function(login, step) {

                var self = this ;

                self.step = step ;

                self.login = login ;

            };

            var Point = function(x, y) {

                var self = this ;

                self.x = x ;

                self.y = y ;
            };

            util.inherits(tic_tac_toe, game);

            return  tic_tac_toe ;

        }) ;




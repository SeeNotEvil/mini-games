
var util = require('util');

var basicGames = require('../basic_games');


var ticTacToe = module.exports = function(constructOptions) {

    var self = this ;


    self.options = {

        countCells : 3,

        countCellsWin : 3,

        mode : "default",

        timeMove : 20,

        step : "x"

    };


    self.field = null ;

    self.opponent = null ;

    self.nowPlayer = null ;

    self.countSteps = null ;

    self.nowStep = 0 ;



    self.init = function() {

        if(self.options.step == "o" || self.options.step == "x")
            self.players[0].step = self.options.step ;
        else
            self.players[0].step = (Math.random() > 0.5) ? "o" : "x";

        self.players[1].step = self.players[0].step == "o" ? "x" : "o" ;

        self.nowPlayer = self.players[0].step == "o" ? self.players[1] : self.players[0] ;
        self.opponent = self.players[0] ==  self.nowPlayer ? self.players[1] : self.players[0] ;

        if(self.options.mode == "enlarged") {
            self.options.countCells = 10 ;
            self.options.countCellsWin = 5 ;

            self.field = new fieldTicTac(self.options.countCells) ;

        }
        else
        {
            self.field = new fieldTicTac(self.options.countCells) ;
        }


        self.field.init() ;

        self.countSteps = self.options.countCells * self.options.countCells ;

        ticTacToe.super_.prototype.init.apply(this, arguments);


        self.onSocketHandlers() ;
    };



    self.getOptionsPlayer = function(key) {


        var opponent = self.players[key] == self.players[0] ? self.players[1] : self.players[0] ;

        var nowPlayerOptions = {
            login: self.players[key].user.login,
            step: self.players[key].step
        } ;


        var opponentOptions = {
            login: opponent.user.login,
            step: opponent.step
        } ;

        self.players[key].options = {
            nowPlayer : nowPlayerOptions,
            opponent : opponentOptions
        } ;


        return this.players[key].options ;
      // return ticTacToe.super_.prototype.getOptionsPlayer.apply(this, arguments);
    };

    self.startGame = function() {
        ticTacToe.super_.prototype.startGame.apply();

        for(var i=0; i < self.players.length; i++) {
            self.players[i].user.socket.emit("startGame" , {} ) ;
        }


        self.move() ;
    };

    self.newStep = function() {
        for(var i=0; i < self.players.length; i++) {
            self.players[i].user.socket.emit("newStep" , {} ) ;
        }
    };



    self.move = function() {

        self.stopTimer() ;
        self.startTimer(0, self.options.timeMove, function(time) {
            if(time <= 0) {
                self.swapPlayers();
                self.newStep() ;
                self.move();
            }
        }) ;

    };

    self.createGamePlayer = function(user)
    {
        console.log("playerTicTacToe") ;
        return new playerTicTacToe(user) ;
    };


    self.swapPlayers = function()
    {
        var container = self.nowPlayer ;
        self.nowPlayer = self.opponent ;
        self.opponent = container ;
    };

    self.shot = function(data, cb) {


        var player = self.getPlayerId(this.id.toString()) ;

        if(player != self.nowPlayer )
            return false ;

        if(self.field.hit(data.cell, player.step)) {
            self.nowStep ++ ;
            var gameInfo = self.field.isWinner(self.nowPlayer.step,  self.options.countCellsWin, data.cell) ;

            if(gameInfo.state == "win" || gameInfo.state == "dwar") {
                self.opponent.user.socket.emit("attacked", {cell : data.cell}) ;
                cb() ;
                self.gameOver(self.nowPlayer, self.opponent, gameInfo) ;
            }

            else {
                self.opponent.user.socket.emit("attacked", {cell : data.cell}) ;
                self.swapPlayers();
                self.newStep() ;
                self.move() ;
                cb() ;

            }
        }

    };


    //Вешаем события сокетов
    self.onSocketHandlers = function()
    {

        for(var i = 0 ; i < self.players.length; i++)
        {
            self.players[i].user.socket.on('shot', self.shot) ;
        }
    };

    //Снимает события сокетов
    self.offSocketHandlers = function()
    {

        for(var i = 0 ; i < self.players.length; i++)
        {
            self.players[i].user.socket.removeListener('shot', self.shot) ;
        }
    };


    self.gameOver = function(winner, loser, gameInfo)
    {

        self.stopTimer() ;
        if(gameInfo.state == "win") {
            winner.user.socket.emit('gameOver', {state : "win", cells : gameInfo.cells}) ;
            loser.user.socket.emit('gameOver', {state : "lose", cells : gameInfo.cells}) ;

        }
        else if (gameInfo.state == "draw") {
            winner.user.socket.emit('gameOver', {state : "draw"}) ;
            loser.user.socket.emit('gameOver', {state : "draw"}) ;

        }

        self.offSocketHandlers() ;

        self.destroyGame();


    };




    self.getModulesOptions = function()
    {
        return [
            {
                name : "./chat" ,

                options : {players: self.players}
            }
        ] ;
    };


    //Выполнение таймера
    self.startTimer = function(startTime, delay, callback)
    {
        var time = startTime * 1000 ;
        var delay =  delay * 1000 ;

        self.interval = setInterval(function()
        {
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


    self.disconnectPlayer = function(id) {
        if(self.interval)
            self.stopTimer() ;

        ticTacToe.super_.prototype.disconnectPlayer.apply(this, arguments);

        self.offSocketHandlers() ;

        self.destroyGame() ;
    };


    ticTacToe.super_.apply(this, arguments);

}; util.inherits(ticTacToe, basicGames.game);



var playerTicTacToe = function(user) {
    var self = this ;
    playerTicTacToe.super_.apply(this, arguments);

    self.step = null ;

} ; util.inherits(playerTicTacToe, basicGames.player);




var fieldTicTac = function(countCells) {
    var self = this ;

    self.mask = [] ;

    self.countCells = countCells ;


    self.freeCells = countCells * countCells ;

    self.init = function() {
        self.createMask() ;
    };

    //Создание маски
    self.createMask = function() {

        for(var i = 0; i < self.countCells ; i++) {
            self.mask[i] = [] ;

            for(var j = 0 ; j < self.countCells ; j++) {
                self.mask[i][j] = null ;
            }
        }
    };

    self.hit = function(cells, sign) {

        if(self.mask[cells.x][cells.y] == null) {
            self.mask[cells.x][cells.y] = sign ;
            self.freeCells-- ;
            return true ;
        }

        return false;

    };


    self.isWinner = function(sign, countWin, cell) {

        var gameInfo = new gameInfoStep() ;
        var count = 0 ;
        var cellsWin = [] ;

        var Point = function(x, y) {
            this.x = x ;
            this.y = y ;
        };

        //По вертикали проверяем
        for(var k = 0 ; k < self.countCells; k++)
        {


            if(self.mask[k][cell.y] == sign) {
                count++ ;
                cellsWin.push(new Point(k, cell.y)) ;

            }
            else {
                count = 0 ;
                cellsWin = [] ;
            }

            if(count == countWin)
            {
                gameInfo.cells = cellsWin ;
                gameInfo.state = "win" ;
                return gameInfo ;

            }

        }

        count = 0 ;
        cellsWin = [] ;

        //По горизонтали проверяем
        for(var k = 0 ; k < self.countCells; k++)
        {


            if(self.mask[cell.x][k] == sign) {
                count++ ;
                cellsWin.push(new Point(cell.x, k)) ;

            }
            else {
                count = 0 ;
                cellsWin = [] ;
            }

            if(count == countWin) {
                gameInfo.cells = cellsWin ;
                gameInfo.state = "win" ;
                return gameInfo ;


            }


        }

        count = 0 ;
        cellsWin = [] ;


        //По диогонали слева направо
        if(cell.x >= cell.y) {
            var startX = cell.x - cell.y;
            var startY = 0;
        }
        else {
            var startX = 0;
            var startY = cell.y - cell.x;

        }


        while (startX < self.countCells  && startY < self.countCells ) {


            if(self.mask[startX][startY] == sign) {
                count++ ;
                cellsWin.push(new Point(startX, startY)) ;
            }
            else {
                count = 0 ;
                cellsWin = [] ;
            }

            if(count == countWin) {
                console.log("\\") ;
                gameInfo.cells = cellsWin ;
                gameInfo.state = "win" ;
                return gameInfo ;
            }


            startX++ ;
            startY++ ;


        }

        count = 0 ;
        cellsWin = [] ;

        //По диогонали слева направо


        var startX = self.countCells - 1;
        var startY =  cell.y -(self.countCells - cell.x - 1);



        console.log(startX + '+' + startY) ;

        while (startX >= 0 && startY < self.countCells ) {


            if(self.mask[startX][startY] == sign) {
                count++ ;
                cellsWin.push(new Point(startX, startY)) ;
            }
            else {
                count = 0 ;
                cellsWin = [] ;
            }

            if(count == countWin) {
                console.log("//") ;
                gameInfo.cells = cellsWin ;
                gameInfo.state = "win" ;
                return gameInfo ;

            }


            startX-- ;
            startY++ ;
        }


        if(self.freeCells == 0 )
        {
            console.log(self.freeCells) ;
            gameInfo.state = "draw" ;
            return gameInfo ;
        }

        gameInfo.state = "waiting" ;
        return gameInfo ;

    };

    var gameInfoStep = function() {
        var self = this ;

        self.state = "" ;

        self.cells = [] ;

    }



};
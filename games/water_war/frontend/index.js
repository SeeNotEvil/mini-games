	define(["game", "jquery", "util", "io", "app"],
        function(game, $, util, Io, App){
		
		//Обьект игры "Морской бой" 
		var waterWar = function()
		{

			waterWar.super_.apply(this, arguments);
			
			var self = this ;
			
			self.interval = null ; 
			self.field = null ;
			self.fieldEnemy = null ;
			self.sudmarines = null ;

			self.optionsGame = {
                element: 'area',
				timeMove: 40,
				timePreparation: 20,
                login: "username"
            } ;

            self.optionsPlayer = { opponent: "" } ;

							 
			self.template = null ;
			self.canvas = null ;
			self.drawContext = null ;

            self.loadedResources = function(callback) {

                require(["frontend/text!"+ self.directoryGame +"/template.html"],
                    function(template, css) {

                         self.template = template ;
                         //App.setStyle(css) ;
                         self.initGame(callback) ;

                     })

            };


            self.initGame = function(callback) {

                //Создаем корабли
                var sudmarines = [new sudmarine(4) ,
                                  new sudmarine(3) , new sudmarine(3) ,
                                  new sudmarine(2) , new sudmarine(2) , new sudmarine(2) ,
                                  new sudmarine(1) , new sudmarine(1) , new sudmarine(1) , new sudmarine(1)] ;


                //Инициализируем канвас
                self.initCanvas() ;

                //Создаем поля
                self.field = new field(44, 10, 10, 30, sudmarines, self) ;
                self.field.init() ;

                //Второе поле (вначале заблокировано)
                self.fieldEnemy = new fieldEnemy(500, 10, 10, 30, self) ;
                self.fieldEnemy.init() ;

                self.onSocketHandlers() ;
                self.onHandlers() ;
                self.initModules() ;



                callback() ;
            };


			self.init = function (optionsGame, optionsPlayer , cb) {
				waterWar.super_.prototype.init.apply(this, arguments);
			};


            self.startGame = function() {

                App.startTimer(self.optionsGame.timePreparation, 1, function(time) {
                    $('#gameMessage').html('Время для растоновки кораблей осталось ' + time + ' секунд');

                    if(time <= 0) {
                        App.stopTimer() ;
                    }

                }) ;

            };


			self.onHandlers = function() {
				$('#sendSudmarines').on('click', self.sendSudmarinesInformation) ;
                $('#randomSudmarines').on('click', self.field.newRandom) ;

			};

            self.getModulesOptions = function()
			{
				return [{

					name : "chat" ,

					options : {
                        element: 'chat',
                        socket: Io.socket,
						login: ""
                    }

				}] ;
			};
			
			self.onSocketHandlers = function() 
			{

				Io.socket.on('pickUpMask', function(data) {

					self.sendSudmarinesInformation() ;
				});
				
				Io.socket.on('move', function(data) {

                    App.stopTimer() ;

                    if(data.move) {
                        $('#gameMessage').html('Ваш ход ' + self.optionsGame.timeMove + ' секунд') ;
                        self.fieldEnemy.setBlock(false) ;
                    }
                    else {
                        $('#gameMessage').html('Ход соперника ' + self.optionsGame.timeMove + ' секунд') ;
                        self.fieldEnemy.setBlock(true) ;
                    }

                    App.startTimer(self.optionsGame.timeMove - 1, 1, function(time) {

                        if(data.move)
                             $('#gameMessage').html('Ваш ход ' + time + ' секунд') ;
                        else
                            $('#gameMessage').html('Ход соперника ' + time + ' секунд') ;

                        if(time <= 0) {
                            App.stopTimer() ;
                        }

                    }) ;

				});

                Io.socket.on('attack', function(data) {

                    switch(data.state) {

                        case "attackHit" :
                            $('#gameMessage').html('Вы попали в корбаль!!!') ;
                            self.fieldEnemy.hitCell(data.x , data.y) ;
                        break ;

                        case "attackHitDieSudmarine" :
                            $('#gameMessage').html('Вы подбили корабль!!!') ;
                            self.fieldEnemy.sudmarineDie(data.cells) ;
                        break ;

                        case "attackMiss" :
                            $('#gameMessage').html('Вы промазали') ;
                            self.fieldEnemy.missCell(data.x , data.y) ;
                            self.fieldEnemy.setBlock(true) ;
                        break ;
                    }

                });


                Io.socket.on('attacked', function(data) {

                    switch(data.state) {

                        case "attackedHit" :
                            $('#gameMessage').html('В ваш корабль попали !!!') ;
                            self.field.hitCell(data.x , data.y) ;
                        break ;

                        case "attackedMiss" :
                            $('#gameMessage').html('Противник промазал ') ;
                            self.field.missCell(data.x , data.y) ;
                            self.fieldEnemy.setBlock(false) ;
                        break ;
                    }

                });

                Io.socket.on('startFight', function(data)
                {
                    App.stopTimer() ;

                    $("#panel").html("") ;
                    $('#gameMessage').html('Начало!!!') ;
                });


				Io.socket.on('gameOver', function(data)
				{
                    App.stopTimer() ;

					if(data.win)
						$('#gameMessage').html("Вы победили!!!") ;
					else
						$('#gameMessage').html("Вы проиграли!!!") ;
						
					//Удаление игры			
					self.fieldEnemy.setBlock(false) ;
				});
				
				Io.socket.on('playerDisconnectedGame', function(data) {
                    App.stopTimer() ;
                    $('#gameMessage').html("Оппонент отсоеденился от игры!!!") ;
				});
				

			};



			self.offSocketHandlers = function() 
			{
                Io.socket.removeListener('playerDisconnectedGame') ;
                Io.socket.removeListener('gameOver') ;
                Io.socket.removeListener('attacked') ;
                Io.socket.removeListener('attack') ;
                Io.socket.removeListener('move') ;
                Io.socket.removeListener('pickUpMask') ;
                Io.socket.removeListener('preparationToGameTimer') ;

			};


			self.destroyGame = function()
			{
				self.offSocketHandlers() ;
                $('#' + self.optionsGame.element).html("") ;
                App.stopTimer() ;

				waterWar.super_.prototype.destroyGame.apply(this, arguments);

			};
			
			//Инициализируем нужный canvas для игры
			self.initCanvas = function() 
			{

                var temp = _.template(self.template)({
                    login : App.getLogin() ,
                    opponent  : self.optionsPlayer.opponent
                }) ;

                $('#' + self.optionsGame.element).html(temp) ;

				self.canvas = document.getElementById("canvas");
				self.drawContext = self.canvas.getContext('2d');
			};
			
			//Отправка информации о караблях
			self.sendSudmarinesInformation = function()
			{
						
				var states = [] ;

                self.field.setBlock() ;

				for(var i = 0 ; i < self.field.sudmarines.length; i++)
				{
					states[i] = {} ;
					states[i].cells = [] ;
					states[i].cells =  self.field.sudmarines[i].cells ;
					states[i].countCells = self.field.sudmarines[i].countCells ;
				}

				Io.socket.emit('sendSudmarines', {sudmarines : states}) ;

			
			};
			
			//Выстрел
			self.shot = function(x, y)
			{
				Io.socket.emit('shoot' , { x : x , y : y }) ;	
				
			};
			
		
			self.gameOver = function(winner)
			{	
				if(winner)
					$('#infoGame').html('Вы победили !!! Ура') ;
				else
					$('#infoGame').html('Вы проиграли!!!') ;
					
				self.destroy() ;	

			}

		};
		
		util.inherits(waterWar, game) ;

        var fieldBase = function() {

        };

        fieldBase.prototype.createMask = function()
        {

            for(var i = 0; i <= this.countCell; i++) {

                this.mask[i] = [] ;

                for(var j = 0 ; j <= this.countCell + 1; j++) {
                        this.mask[i][j] = null ;
                }
            }
        };

        fieldBase.prototype.getMouseCoordinate = function(e) {

            return {
                x : e.pageX - $(this.game.canvas).offset().left,
                y : e.pageY - $(this.game.canvas).offset().top
            }

        };

        fieldBase.prototype.inField = function(x , y) {

            return (x > this.x && x < this.lengthField + this.x &&
                    y > this.y && y < this.y + this.lengthField) ;

        };
		/*Создаем основное поле 
		  Координаты , кол- во ячеек, 
		  длина ячеек , массив кораблей */
		
		var field = function(x, y, countCell, lengthCell, sudmarines, game)
		{
			var self = this ;
			
			self.block = false ;
			self.x = x ;
			self.y = y ;
			
			self.lengthCell = lengthCell ;
			self.countCell = countCell ;

            self.sudmarines = sudmarines ;

			self.game = game ;
			
			self.mask = [] ;

            self.moveSudmarine = null ;

			self.lengthField = countCell * lengthCell ;

			self.hitCell = function(x, y)
			{
				self.drawHitCell(x, y) ;
				self.mask[x][y] = 2 ;
			};
			
			
			self.missCell = function(x, y)
			{
				self.drawMissCell(x, y) ;	
				self.mask[x][y] = 1 ;
			};
			
			
			//Отрисовка попадание в ячейку с кораблем 
			self.drawHitCell = function(x, y)
			{
				var coordX = self.x + x * self.lengthCell ;
				var coordY = self.y + y * self.lengthCell ;
			
				self.game.drawContext.beginPath() ;			
				self.game.drawContext.moveTo(coordX, coordY) ;
				self.game.drawContext.lineTo(coordX - self.lengthCell, coordY - self.lengthCell) ;
				self.game.drawContext.moveTo(coordX , coordY - self.lengthCell) ;
				self.game.drawContext.lineTo(coordX - self.lengthCell, coordY) ;
				self.game.drawContext.stroke();
			};
			
			
			
			//Отрисовка попадание в ячейку с кораблем 
			self.drawMissCell = function(x, y)
			{
				
				var centerX = self.x + x * self.lengthCell - self.lengthCell / 2 ;
				var centerY = self.y + y * self.lengthCell - self.lengthCell / 2 ;
				var radius = self.lengthCell / 8 ;
				
				self.game.drawContext.beginPath();
				self.game.drawContext.arc(centerX, centerY, radius, 0, 2*Math.PI, true);	
				self.game.drawContext.fill();
				self.game.drawContext.stroke(); 
				
			};
			
			
			
			self.sudmarineSort = function(sudmarine)
			{
				if(sudmarine.cells[0].x > sudmarine.cells[sudmarine.countCells - 1].x || 
				   sudmarine.cells[0].y > sudmarine.cells[sudmarine.countCells - 1].y)
				{
					
					var cloneSudmarineCells = createCloneObject(sudmarine.cells) ; 
					
					for(var i = 1; i <= sudmarine.countCells; i++)
					{					
					
						sudmarine.cells[i - 1].x = cloneSudmarineCells[sudmarine.countCells - i ].x ;
						sudmarine.cells[i - 1].y = cloneSudmarineCells[sudmarine.countCells - i ].y ;
					} 
				}
			};

			self.createMask = function()
			{
				for(var i = 0; i <= self.countCell + 1; i++) {
					self.mask[i] = [] ;

					for(var j = 0 ; j <= self.countCell + 1; j++) {
						self.mask[i][j] = null ;
					}
				}

			};

			self.init = function()
			{
				
				self.createMask() ;
				self.random() ;
				
				self.draw() ;
				
				//Вешаем обработчики на поле
				$(self.game.canvas).on('mousedown', self.clickSudmarine) ;	
				$(self.game.canvas).on('dblclick', self.rotateSudmarine) ;									
			
			};


            self.newRandom = function() {
                self.mask = [] ;
                self.createMask() ;
                self.random() ;
                self.draw() ;
            };

			//Рандомная расстановка кораблей
			self.random = function()
			{
				if(self.block)
                    return false ;

				var left = true ; var right = true ; var top = true ; var bottom = true ;
				
				var strokes = [] ;

				for(var i = 0 ; i < self.sudmarines.length; i++)
				{
					
					var rnd = Math.random() ; var random = (rnd == 0) ? 1 : Math.ceil(rnd * 100) ;
				
					var y = Math.floor(random / self.countCell) == 0 ? 1 : Math.floor(random / self.countCell) ;
					var x = (random % self.countCell == 0) ?  self.countCell : random % self.countCell;
					
					if(self.mask[x][y] == null)
					{					
						//Ставим корабли
						for(var j = 0 ; j <= self.sudmarines[i].countCells + 1 ; j++)
						{
							//Смотрим свободны ли стороны							
							if(y + j - 1 < 0 || y + j - 1 > self.countCell + 1)
								bottom = false ;
							else 
							{
								if(self.mask[x][y + j - 1] != null ||  self.mask[x + 1][y + j - 1] != null || 
								   self.mask[x - 1][y + j - 1] != null)
									bottom = false ;
							}
							
							
							if(y - j + 1 < 0 || y - j + 1 > self.countCell + 1)
								top = false ;
							else 
							{	
								if(self.mask[x][y - j + 1] != null ||  self.mask[x + 1][y - j + 1] != null || 
								   self.mask[x - 1][y - j + 1] != null)
									top = false ;
							}
							
							 
							if(x + j - 1 < 0 || x + j - 1 > self.countCell + 1)
								right = false ;
							else 
							{						
								if(self.mask[x + j - 1][y] != null ||  self.mask[x + j - 1][y - 1] != null || 
								   self.mask[x + j - 1][y + 1] != null)
									right = false ;
							}
							
							
							if(x - j + 1 < 0 || x - j + 1 > self.countCell + 1)
								left = false ;
							else 
							{
								if(self.mask[x - j + 1][y] != null ||  self.mask[x - j + 1][y - 1] != null || 
								   self.mask[x - j + 1][y + 1] != null)
									left = false ;
							}
						}
				
						//ПОКА ТОПОРНО ПОТОМ ПЕРЕДЛЕАЮ КРАСИВО СНАЧЛАО НАДО ЧТОБЫ РАБОТАЛО!!!!!!!
						if(right == true) strokes.push('right') ;
							
						if(bottom == true) strokes.push('bottom') ;
							
						if(top == true) strokes.push('top') ;
							
						if(left == true) strokes.push('left') ;
											
						random = Math.floor(Math.random() * (strokes.length - 1)) ;	

						if(strokes[random] == 'right')
						{			
							for(var j = 0 ; j < self.sudmarines[i].countCells; j++)
							{
								self.sudmarines[i].cells[j] = new Point(x + j, y) ;			
								self.mask[x + j][y] = self.sudmarines[i] ;
							}
						}
						
						if(strokes[random] == 'left')
						{		
							for(var j = 0 ; j < self.sudmarines[i].countCells; j++)
							{		
								self.sudmarines[i].cells[self.sudmarines[i].countCells - j - 1] = new Point(x - j, y) ;
								self.mask[x - j][y] = self.sudmarines[i] ;
							}
						}
						
						if(strokes[random] == 'top')
						{			
							for(var j = 0 ; j < self.sudmarines[i].countCells; j++)
							{			
								self.sudmarines[i].cells[self.sudmarines[i].countCells - j - 1] = new Point(x , y - j) ;						
								self.mask[x][y - j] = self.sudmarines[i] ;
							}
						}
						
						
						if(strokes[random] == 'bottom')
						{
							for(var j = 0 ; j < self.sudmarines[i].countCells; j++)
							{						
								self.sudmarines[i].cells[j] = new Point(x, y + j) ;							
								self.mask[x][y + j] = self.sudmarines[i] ;
							}
						}

						if(strokes[random] == undefined)
							i-- ;

					}
					else			
						i-- ;
					
					strokes = [] ;
					left = true ; right = true ; top = true ; bottom = true ;						
				}
			};
			
			self.correctField = function()
			{
				for(var i = 0 ; i < self.sudmarines.length; i++)
				{
					if(!self.sudmarinesPole(self.sudmarines[i])) 
						return false ;
				}
				
				return true ;
			};
			
			
			//Поворот корабля на угол
			self.rotateAngle = function(sudmarine, coef, x, y)
			{
				
				var e = 0 - x ; var f = 0 - y ; 				
				//Поворот направо
				
				for(var i = 1; i <= sudmarine.countCells; i++)
				{
					self.mask[sudmarine.cells[i - 1].x][sudmarine.cells[i - 1].y] = null ;
					sudmarine.cells[i - 1].x = sudmarine.cells[i - 1].x + e ; 
					sudmarine.cells[i - 1].y = sudmarine.cells[i - 1].y + f ;	
					var container = sudmarine.cells[i - 1].x ;				
					sudmarine.cells[i - 1].x = sudmarine.cells[i - 1].y * -1 * coef ;
					sudmarine.cells[i - 1].y = container * coef;
					sudmarine.cells[i - 1].x = sudmarine.cells[i - 1].x - e ; sudmarine.cells[i - 1].y = sudmarine.cells[i - 1].y - f ;
					
				}
				
				self.sudmarineSort(sudmarine) ;
				
			};
			
			self.sudmarineResetPosition = function(clone, sudmarine)
			{
				for(var i = 1; i <= sudmarine.countCells; i++)
				{		
					self.mask[clone.cells[i - 1].x][clone.cells[i - 1].y] = sudmarine ;	
					sudmarine.cells[i - 1].x = clone.cells[i - 1].x ; 
					sudmarine.cells[i - 1].y = clone.cells[i - 1].y ;	
					
				}	
			};
			
			self.sudmarineSetPosition = function(sudmarine)
			{
				for(var i = 1; i <= sudmarine.countCells; i++) {
					self.mask[sudmarine.cells[i - 1].x][sudmarine.cells[i - 1].y] = sudmarine ;
				}	
			};
			
			self.sudmarineDeletePosition = function(sudmarine)
			{
				for(var i = 1; i <= sudmarine.countCells; i++) {
					self.mask[sudmarine.cells[i - 1].x][sudmarine.cells[i - 1].y] = null ;
				}
			};
			
			//Поворот корабля при двойном клике
			self.rotateSudmarine = function(e)
			{
                e.preventDefault() ;

				if(self.block)
					return ;

				//Пытаемся повернуть корабль
                var coordinateX = e.pageX - $(self.game.canvas).offset().left ;
                var coordinateY = e.pageY - $(self.game.canvas).offset().top ;

				//Проверяем находимся ли мы над полем
				if(coordinateX > self.x && coordinateX < self.lengthField + self.x &&
				   coordinateY > self.y && coordinateY < self.y + self.lengthField)
				{	
					var y = Math.ceil((coordinateY - self.y) / self.lengthCell) ;
					var x = Math.ceil((coordinateX - self.x) / self.lengthCell) ;
					
					if(self.mask[x][y] != null)
					{	
						//Запоминаем начальное положение 
						var sudmarine = self.mask[x][y] ;
						var clone = createCloneObject(sudmarine) ;
						
						self.sudmarineDeletePosition(sudmarine) ;
									
						self.rotateAngle(clone, 1, x, y) ;	
					
						if(self.sudmarinesPole(clone))
						{				
							
							self.sudmarineResetPosition(clone, sudmarine) ;					
							self.draw() ;
							return ;
						}
						
						clone = createCloneObject(sudmarine) ;
						self.rotateAngle(clone, -1, x, y) ;
						
						if(self.sudmarinesPole(clone))
						{		
							self.sudmarineResetPosition(clone, sudmarine) ;
							self.draw() ;
							return ;
						}
						
						self.sudmarineSetPosition(sudmarine) ;
						
						
					}
				}
			};
			
			
			//Функция проверки , может ли встать корабль
			self.sudmarinesPole = function(sudmarine)
			{
				var startX = sudmarine.cells[0].x ;
				var endX = sudmarine.cells[sudmarine.countCells - 1].x ;
				var startY = sudmarine.cells[0].y ;
				var endY = sudmarine.cells[sudmarine.countCells - 1].y ;
				

				for(var i = startY - 1 ; i <= endY + 1 ; i++)
				{
					for(var j = startX - 1; j <= endX + 1; j++)
					{
						if(i < 0 || i > 11 || j < 0 || j > 11)
							return false ;

						if(self.mask[j][i] != null )
							return false ;
									
					}
				}
			
				return true ;
			};



            self.setBlock = function() {

                if(!self.block) {

                    if(self.moveSudmarine != null) {
                        $(self.game.canvas).unbind('mousemove.sudmarine') ;
                        $(self.game.canvas).unbind('mouseup.sudmarine') ;

                        self.sudmarineSetNewPosition(self.moveSudmarine) ;
                        self.moveSudmarine = null ;
                    }

                    $(self.game.canvas).unbind('mousedown') ;
                    $(self.game.canvas).unbind('dblclick') ;

                    self.block = true ;

                    $('#canvas').css("cursor", "default") ;
                }
            };

			//Перемещение корабля (доступно тока при режиме конструкции)
			self.clickSudmarine = function(e)
			{
                e.preventDefault() ;

				if(self.block)
					return ;
				
				var mouseCoordinate = self.getMouseCoordinate(e) ;

				//Проверяем находимся ли мы над полем
                if(self.inField(mouseCoordinate.x, mouseCoordinate.y))
				{

					var y = Math.ceil((mouseCoordinate.y - self.y) / self.lengthCell) ;
					var x = Math.ceil((mouseCoordinate.x - self.x) / self.lengthCell) ;
					
					if(self.mask[x][y] != null)
					{
                        $('#canvas').css("cursor", "move") ;

                        self.moveSudmarine = self.mask[x][y] ;

						self.sudmarineDeletePosition(self.moveSudmarine) ;
						self.draw() ;

						//Запоминаем начальное положение
                        self.moveSudmarine.lastCells = createCloneObject(self.moveSudmarine.cells) ;

						var stepX = 0 ;
						var stepY = 0 ;

						var moveSudmarine = function(e)
						{
                            var mouseCoordinate = self.getMouseCoordinate(e) ;

                            if(self.inField(mouseCoordinate.x, mouseCoordinate.y))

							{

                                $("#body").css("cursor : move") ;

								var newPosition = true ;
								var newY = Math.ceil((mouseCoordinate.y - self.y ) / self.lengthCell) ;
								var newX = Math.ceil((mouseCoordinate.x - self.x ) / self.lengthCell) ;
								var nextX = 0;
								var nextY = 0;


								if(newY != y || newX !=x)
								{
									stepX = newX - x + stepX ;
									stepY = newY - y + stepY;

									for(var i = 1; i <= self.moveSudmarine.countCells; i++)
									{
										nextX = self.moveSudmarine.cells[i - 1].x  + stepX ;
										nextY = self.moveSudmarine.cells[i - 1].y  + stepY ;

										if(nextX < 1 ||  nextX > self.countCell || nextY < 1 ||
										   nextY > self.countCell)
										{
											newPosition = false ;
										}
									}

									if(newPosition)
									{
										for(var i = 1; i <= self.moveSudmarine.countCells; i++)
										{
                                            self.moveSudmarine.cells[i - 1].x  = self.moveSudmarine.cells[i - 1].x + stepX ;
                                            self.moveSudmarine.cells[i - 1].y  = self.moveSudmarine.cells[i - 1].y + stepY ;
										}

										self.draw() ;
									}

									x = newX ;
									y = newY ;
									stepX = 0 ;
									stepY = 0 ;

								}
							}
						};


						var upSudmarine = function(e)
						{

                            self.sudmarineSetNewPosition(self.moveSudmarine) ;

							$(self.game.canvas).unbind('mousemove.sudmarine', moveSudmarine) ;
							$(self.game.canvas).unbind('mouseup.sudmarine', upSudmarine) ;

                            self.moveSudmarine = null ;

                            $('#canvas').css("cursor", "default") ;
						};

						//Функция перемещения
						$(self.game.canvas).on('mousemove.sudmarine', moveSudmarine) ;
						$(self.game.canvas).on('mouseup.sudmarine', upSudmarine) ;

					}

				}
			
			};


            self.sudmarineSetNewPosition = function(sudmarine) {

                console.log(sudmarine) ;
                if(self.sudmarinesPole(sudmarine))
                {
                    for(var i = 1; i <= sudmarine.countCells; i++)
                    {
                        self.mask[sudmarine.cells[i - 1].x][sudmarine.cells[i - 1].y] = sudmarine ;
                    }

                }
                else
                {
                    for(var i = 1; i <= sudmarine.countCells; i++)
                    {
                        sudmarine.cells[i - 1].x = sudmarine.lastCells[i - 1].x ;
                        sudmarine.cells[i - 1].y = sudmarine.lastCells[i - 1].y ;
                        self.mask[sudmarine.lastCells[i - 1].x][sudmarine.lastCells[i - 1].y] = sudmarine ;
                    }
                }

                self.draw() ;
            };

			//Функция очищает поле
			self.clearField = function()
			{
				 self.game.drawContext.clearRect(self.x - 10, self.y - 10, self.lengthField + 20, self.lengthField + 20);
			};
			
			//Отрисовываем поле
			self.draw = function()
			{			
				self.clearField() ;
				
				for(var i = 1; i <= self.countCell; i++)
				{
					for(var j = 1 ; j <= self.countCell; j++)
					{			
						
						self.game.drawContext.lineWidth = 2;
						self.game.drawContext.strokeRect(self.x + self.lengthCell * (i - 1), self.y + self.lengthCell * (j - 1), 
													     self.lengthCell, self.lengthCell);
									
					}		
				}	

				//Рисуем корабли
				for(var i = 0 ; i < self.sudmarines.length; i++)
				{

					if(self.sudmarines[i] != null)
                        self.sudmarines[i].draw(self.x, self.y, self.lengthCell, self.game.drawContext) ;

				}
				
			}
			

		};

        util.inherits(field, fieldBase) ;

		var Point = function(x, y)
		{
			var self = this ;
			self.x = x ;
			self.y = y ;
		};
		
		/*Второе поле для боя
		  По умолчанию в начале игры заблокированно 
		  Передаем координаты поля, длину ячейки, кол-во ячеек
		  */

		var fieldEnemy = function(x, y, countCell, lengthCell, game)
		{
			var self = this ;  
			
			self.block = true ; 
			
			self.game = game ;
			
			
			self.x = x ; self.y = y ;
			
			self.countCell = countCell ;
			
			self.lengthCell = lengthCell ;
			
			self.lengthField = countCell * lengthCell ;
			
			self.mask = [] ;
			
			self.cellsFill = new Point(0,0)  ;


			self.hitCell = function(x, y)
			{
				self.drawHitCell(x, y) ;
				self.mask[x][y] = 2 ;
				self.draw() ;
			};
			
			
			self.missCell = function(x, y)
			{
				self.drawMissCell(x, y) ;	
				self.mask[x][y] = 1 ;
				self.draw() ;
			};
			
			self.init = function()
			{
				self.createMask() ;
				self.draw() ;
				
				//Вешаем обработчики на поле
				$(self.game.canvas).on('mousemove', self.hover) ;
				$(self.game.canvas).on('click', self.shot ) ;
			};

            //Блокировка поля
            self.setBlock = function(block)
            {

                if(block)
                    $("#canvas").css("cursor" , "default") ;

                    self.block = block ;
            };

			self.hover = function(e)
			{

				if(self.block)
					return ;

                var coordinateX = e.pageX - $(self.game.canvas).offset().left ;
                var coordinateY = e.pageY - $(self.game.canvas).offset().top ;
					
				//Проверяем находимся ли мы над полем
				if(coordinateX > self.x && coordinateX < self.lengthField + self.x
										&& coordinateY > self.y && coordinateY < self.y + self.lengthField)
				{


                    $("#canvas").css("cursor" , "pointer") ;
					var y = Math.ceil((coordinateY - self.y) / self.lengthCell) ;
					var x = Math.ceil((coordinateX - self.x) / self.lengthCell) ;
							
					//Проверям свободная ли это ячейка?
					if(self.mask[x][y] == null)	 {
                        self.drawFillCell(x, y) ;
                    }
                    else
                        self.draw() ;

				}
				else
				{
					if(self.cellsFill.x != 0 || self.cellsFill.y != 0) {
                        self.draw() ;
                    }
				}
				
			};
			
			
			//Событие бьем по ячейке
			self.shot = function()
			{

				if(self.block)
					return ;
				
				var x = self.cellsFill.x ;
				var y = self.cellsFill.y ;
				
				if(x > 0 || y > 0)
				{				
				
					if(self.mask[x][y] == null)			
						self.game.shot(x, y) ;

				}	

			};
			
			//Убиваем судмарину =(
			self.sudmarineDie = function(cells)
			{
				
				var startX = cells[0].x ;
				var endX = cells[cells.length - 1].x ;
				var startY = cells[0].y ;
				var endY = cells[cells.length - 1].y ;
				
				for(var key in cells)
				{
					var cell = cells[key] ;
					self.mask[cell.x][cell.y] = 2 ;
				
				}
				
				for(var i = startY - 1 ; i <= endY + 1 ; i++)
				{
					for(var j = startX - 1; j <= endX + 1; j++)
					{
						if(j < 0 || j > 10 || i < 0 || i > 10)
							continue ;
						
						if(self.mask[j][i] == null)	
							self.mask[j][i] = 1 ;
											
					}
				}
				
				self.draw() ;
			};
			


			//Функция очищает поле
			self.drawClearField = function()
			{
				 self.cellsFill.x = 0 ; self.cellsFill.y = 0 ;
				 self.game.drawContext.clearRect(self.x - 5, self.y - 5, self.lengthField + 5, self.lengthField + 5);

			};
			
			//Отрисовываем поле
			self.draw = function()
			{
				self.drawClearField() ;
				
				for(var i = 1; i <= self.countCell; i++)
				{
					for(var j = 1 ; j <= self.countCell; j++)
					{
						
						self.game.drawContext.lineWidth = 2;
			
						self.game.drawContext.strokeRect(self.x + self.lengthCell * (j - 1), 
													self.y + self.lengthCell * (i - 1), self.lengthCell, self.lengthCell);
		
						
						if(self.mask[i][j] == 1)
							self.drawMissCell(i, j) ;
						else if(self.mask[i][j] == 2)
							self.drawHitCell(i, j) ;							
					}	
				}	
				
			};
			
			//Окрасить ячейку в темный свет
			self.drawFillCell = function(x, y)
			{	
				if(self.cellsFill.x != x || self.cellsFill.y != y)
				{
					self.draw() ;
					self.game.drawContext.fillRect(self.x + self.lengthCell * (x - 1), 
										  self.y + self.lengthCell * (y - 1), 
										  self.lengthCell, self.lengthCell);
									 
					self.cellsFill = new Point(x, y) ;
				}
			};
			
			//Окраска ячейки попадание
			self.drawHitCell = function(x, y)
			{		
				var coordX = self.x + x * self.lengthCell; var coordY = self.y + y * self.lengthCell;
			
				self.game.drawContext.beginPath() ;			
				self.game.drawContext.moveTo(coordX, coordY) ;
				self.game.drawContext.lineTo(coordX - self.lengthCell, coordY - self.lengthCell) ;
				self.game.drawContext.moveTo(coordX , coordY - self.lengthCell) ;
				self.game.drawContext.lineTo(coordX - self.lengthCell, coordY) ;
				self.game.drawContext.stroke();
			};
			
			
			//Окраска ячейки промах
			self.drawMissCell = function(x, y)
			{
				
				var centerX = self.x + x * self.lengthCell - self.lengthCell / 2 ;
				var centerY = self.y + y * self.lengthCell - self.lengthCell / 2 ;
				var radius = self.lengthCell / 8 ;
				
				self.game.drawContext.beginPath();
				self.game.drawContext.arc(centerX, centerY, radius, 0, 2*Math.PI, true);	
				self.game.drawContext.fill();
				self.game.drawContext.stroke(); 		
			}
					
		};


        util.inherits(fieldEnemy, fieldBase) ;



		function createCloneObject(o) 
		{
			if(!o || "object" !== typeof o) 
			{
				return o;
			}
			var c = "function" === typeof o.pop ? [] : {};
			var p, v;
			for(p in o) 
			{
				if(o.hasOwnProperty(p)) 
				{
					v = o[p];
					if(v && "object" === typeof v) 
					{
						c[p] = createCloneObject(v);
					}
					else c[p] = v;
				}
			}
			return c;
		}


		
		//Обьект корабль
		var sudmarine = function(countCells)
		{
			var self = this;

			self.countCells = countCells ;
			
			self.cells = [] ;

            self.lastCells = [] ;

		};

        sudmarine.prototype.draw = function(x, y, lengthCell, drawContext)
        {

            var lengthX = (Math.abs(this.cells[0].x - this.cells[this.countCells - 1].x) + 1) * lengthCell;

            var lengthY = (Math.abs(this.cells[0].y - this.cells[this.countCells - 1].y ) + 1) * lengthCell ;

            drawContext.lineWidth = 5;

            drawContext.strokeRect(x + lengthCell  * (this.cells[0].x - 1), y + lengthCell * (this.cells[0].y  - 1), lengthX, lengthY);

        };


		return waterWar ;
		
	}) 	;
		
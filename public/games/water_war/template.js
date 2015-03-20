define("games/water_war/template", [], function(){
    var template = '<button  class="btn btn-primary exitGame" id="exitGameWater">Выйти </button>'+
                        '<div id = "wrapGame">' +
                        '<div id="containerWaterGame" class="col-sm-9  col-md-10  main">' +

                        '<div id = "gameMessage">  <h2>Сообщение игры !! </h2> </div>' +
                        '<canvas height="320" width="860" id="canvas">   </canvas>' +
                        '</div>' +
                        '<div id = "panel"> <button id="sendSudmarines"> Готов </button></div>' +
                        '<div id = "leftSideBar">'+
                        '<div>Вы - {{login}}</div>'+
                        '<div>Оппонент - {{opponent}}</div>'+
                        '<div class="chat" id="chat">'+
                        '</div>'+
                    '</div>' ;
    return template ;

});



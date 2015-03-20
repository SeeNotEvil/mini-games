define("games/tic_tac_toe/template", [], function(){
    var template = '<button  class="btn btn-primary exitGame" id="exitGameWater">Выйти </button>'+
        '<div id = "wrapGame">' +
            '<div id="containerGame" class="col-sm-9  col-md-10  main">' +

                '<div id = "gameMessage">  <h2>Сообщение игры !! </h2> </div>' +
                    '<canvas height="480" width="760" id="canvas">   </canvas>' +
                '</div>' +
                '<div id = "leftSideBar">'+
                    '<div>Вы - {{login}}</div>'+
                    '<div>Оппонент - {{opponent}}</div>'+
                    '<div class="chat" id="chat">'+
                    '</div>' +
                '</div>'+
            '</div>'+
        '</div>' ;
    return template ;

});



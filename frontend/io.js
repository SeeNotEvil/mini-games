define(function(){	
	
	var Io =
	{
		socket : null ,

		init : function()
        {
			Io.socket = io.connect(window.location.hostname);
		}
	};

	return Io ;

})	;
		
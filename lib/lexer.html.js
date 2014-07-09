'use strict';

(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		WHITE         : -1,
		TAG           : 0,
		EOL           : 1,
		EOF           : 2,
		COMMENT       : 3,
		LANGLE        : 4,
		RANGLE        : 5,
		ATTRIBUTE     : 6,
		VALUE         : 7,
		CLOSETAG      : 8
	};

	Token.map = (function(types) {
		var ret = {};
		for (var name in types) {
			ret[types[name]] = name.toLowerCase();
		}
		return ret;
	}(Token.type));

	var State = {
		START: 0,
		INTAG: 1,
		INATTRIBUTE: 2,
		INVALUE: 3,
		INCOMMENT: 4,
		INCLOSETAG: 5,
		INDOCTYPE: 6
	};

}(lighter));
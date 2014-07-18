'use strict';

(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		EOF           : -2,  // equal to $.Stream.EOF
		EOL           : -1,  // equal to $.Stream.EOL ! important
		WHITE         : 0,
		UNIT          : 1,
		COMMENT       : 2,
		SIMBOL        : 3,
		NUMBER        : 4,
		PROPERTY      : 5,
		VALUE         : 6,
		SELECTOR      : 7,
		UNKNOWN       : 8
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
		INNUM: 1,
		INCOMMENT: 2,
		COMMENTBEGIN: 3,
		COMMENTEND: 4,
		INSELECTOR: 5,
		PROPERTYEND: 6,
		INPROPERTY: 7,
		INQUOTATION: 8,
		INSINGLEQUOTATION: 9,
		INBRACKET: 10,
		INBRACE: 11,
		INWHITE: 12,
		INVALUEAREA: 13,
		INPROPERTYVALUE: 14,
		INUNIT: 15,
		DONE: 16
	};

	function States(startup) {
		this.states = [startup];
	}

	States.prototype.push = function(state) {
		this.states.push(state);
	};

	States.prototype.change = function(state) {
		this.states.pop();
		this.states.push(state);
	};

	States.prototype.pop = function() {
		return this.states.pop();
	};

	States.prototype.top = function() {
		return this.states[this.states.length - 1];
	};

	States.prototype.popUntil = function(state) {
		while (this.pop() !== state) {}
	};

	var scan = function (stream, opt) {
		var currentToken = null,
			tokens       = [],
			c            = '',
			buffer       = '',
			state        = new States(State.START),
			tabSpace     = 4,
			save         = true,
			_saveToken   = false,
			ignore       = false;

		if (opt !== undefined) {
			tabSpace = opt.tabSpace;
		}

		var intent = '';
		for (var i = 0; i < tabSpace; i++) {
			intent += ' ';
		}

		function addToken (buffer, token) {
			tokens.push({text: buffer, type: token});
			_saveToken = false;
		}

		function saveToken(token) {
			currentToken = token;
			_saveToken = true;
		}

		function putBack(){
			stream.putBack();
			save = false;
		}

		while (state.top() !== State.DONE) {

			c = stream.read();
			save = true;
			switch (state.top()) {

				case State.START:
					if ($.type.isAlpha(c) || c === '.' || c === '#' || c === '*' || c === '$' || c === ':') {
						state.push(State.INSELECTOR);
					} else if ($.type.isWhite(c)) {
						state.push(State.INWHITE);
					} else if (c === ',' || c === '[' || c === ']' || c === '>') {
						saveToken(Token.type.SIMBOL);
					} else if (c === '{'){
						saveToken(Token.type.SIMBOL);
						state.push(State.INBRACKET);
					}else if (c === $.Stream.EOL) {
						saveToken(Token.type.EOL);
					}else if (c === $.Stream.EOF) {
						putBack();
						state.change(State.DONE);
					} else if (c === '/') {
						if (stream.pick() === '*') {
							state.push(State.INCOMMENT);
						} else {
							saveToken(Token.type.UNKNOWN);
						}
					} else {
						saveToken(Token.type.UNKNOWN);
					}
					break;

				case State.INWHITE:
					if (!$.type.isWhite(c) ) {
						putBack();
						saveToken(Token.type.WHITE);
						state.pop();
					}
					break;

				case State.INSELECTOR:
					if (!$.type.isAlpha(c) && !$.type.isNum(c) && c !== '-') {
						putBack();
						state.pop();
						saveToken(Token.type.SELECTOR);
					}
					break;

				case State.INBRACKET:
					if (c === '}') {
						state.pop();
						saveToken(Token.type.SIMBOL);
					} else if ($.type.isWhite(c)) {
						state.push(State.INWHITE);
					} else if ($.type.isAlpha(c) || c === '-') {
						state.push(State.INPROPERTY);
					} else if (c === '/') {
						if (stream.pick() === '*') {
							state.push(State.INCOMMENT);
						} else {
							saveToken(Token.type.UNKNOWN);
						}
					} else if (c === $.Stream.EOL) {
						saveToken(Token.type.EOL);
					} else if (c === $.Stream.EOF) {
						putBack();
						state.change(State.DONE);
					} else {
						saveToken(Token.type.UNKNOWN);
					}
					break;

				case State.INPROPERTY:
					if ($.type.isAlpha(c) || c === '-') {

					} else {
						putBack();
						saveToken(Token.type.PROPERTY);
						state.change(State.PROPERTYEND);
					}
					break;

				case State.PROPERTYEND:
					if ($.type.isWhite(c)) {
						state.push(State.INWHITE);
					} else if (c === ':') {
						saveToken(Token.type.SIMBOL);
						state.change(State.INVALUEAREA);
					} else if (c === '/') {
						if (stream.pick() === '*') {
							state.push(State.INCOMMENT);
						} else {
							saveToken(Token.type.UNKNOWN);
						}
					} else if (c === ';') {
						state.pop();
						saveToken(Token.type.SIMBOL);
					} else if (c === '}') {
						saveToken(Token.type.SIMBOL);
						state.popUntil(State.INBRACKET);
					} else {
						saveToken(Token.type.UNKNOWN);
					}
					break;

				case State.INVALUEAREA:
					if ($.type.isWhite(c)) {
						state.push(State.INWHITE);
					} else if (c === ';') {
						state.pop();
						saveToken(Token.type.SIMBOL);
					} else if ($.type.isNum(c) || c === '.') {
						state.push(State.INNUM);
					} else if ($.type.isAlpha(c) || c === '#') {
						state.push(State.INPROPERTYVALUE);
					} else if (c === '}') {
						state.popUntil(State.INBRACKET);
						saveToken(Token.type.SIMBOL);
					} else if (c === '/') {
						if (stream.pick() === '*') {
							state.push(State.INCOMMENT);
						} else {
							saveToken(Token.type.UNKNOWN);
						}
					} else if (c === '('){
						saveToken(Token.type.SIMBOL);
						state.push(State.INBRACE);
					} else if (c === '\''){
						state.push(State.INSINGLEQUOTATION);
					} else if (c === '"'){
						state.push(State.INQUOTATION);
					} else if (c === '!'){
						saveToken(Token.type.SIMBOL);
					} else if (c === $.Stream.EOF) {
						putBack();
						state.change(State.DONE);
					} else {
						saveToken(Token.type.UNKNOWN);
					}
					break;

				case State.INPROPERTYVALUE:
					if (!$.type.isAlpha(c) && c !== '-') {
						saveToken(Token.type.VALUE);
						putBack();
						state.pop();
					} 
					break;

				case State.INBRACE:
					if ($.type.isNum(c) || c === '.') {
						state.push(State.INNUM);
					} else if (c === ',') {
						saveToken(Token.type.SIMBOL);
					} else if (c === ')') {
						saveToken(Token.type.SIMBOL);
						state.pop();
					} else if ($.type.isAlpha(c) || c === '#'){
						putBack();
						state.push(State.INVALUEAREA);
					} else if (c === '\''){
						state.push(State.INSINGLEQUOTATION);
					} else if (c === '"'){
						state.push(State.INQUOTATION);
					} else if (c === $.Stream.EOL) {
						saveToken(Token.type.EOL);
					} else if (c === '}') {
						saveToken(Token.type.SIMBOL);
						state.popUntil(State.INBRACKET);
					} else if ($.type.isWhite(c)) {
						state.push(State.INWHITE);
					} else if (c === $.Stream.EOF) {
						putBack();
						state.change(State.DONE);
					}
					break;

				case State.INNUM:
					if (!$.type.isNum(c) && c !== '.') {
						if ($.type.isAlpha(c) || c === '%') {
							state.change(State.INUNIT);
						} else {
							state.pop();
						}
						putBack();
						saveToken(Token.type.NUMBER);
					}
					break;

				case State.INUNIT:
					if (!$.type.isAlpha(c)) {
						state.pop();
						putBack();
						saveToken(Token.type.UNIT);
					}
					break;

				case State.INSINGLEQUOTATION:
					if (c === '\'') {
						state.pop();
						saveToken(Token.type.VALUE);
					} else if (c === $.Stream.EOL){
						saveToken(Token.type.EOL);
					} else if (c === $.Stream.EOF) {
						state.change(State.DONE);
						saveToken(Token.type.VALUE);
						putBack();
					}
					break;

				case State.INQUOTATION:
					if (c === '"') {
						state.pop();
						saveToken(Token.type.VALUE);
					} else if (c === $.Stream.EOL){
						c = '\n';
					} else if (c === $.Stream.EOF) {
						state.change(State.DONE);
						saveToken(Token.type.VALUE);
						putBack();
					}
					break;

				case State.COMMENTBEGIN:
					if (buffer.length === 4) {
						state.change(State.INCOMMENT);
					}
					break;

				case State.INCOMMENT:
					if (c === '*') {
						if (stream.pick() === '/') {
							state.change(State.COMMENTEND);
							putBack();
						}
					} else if (c === $.Stream.EOF) {
						state.change(State.DONE);
						putBack();
						saveToken(Token.type.COMMENT);
					}
					break;

				case State.COMMENTEND:
					if (c === '/') {
						state.pop();
						saveToken(Token.type.COMMENT);
					}
				default :
					//never reaches here;
			}

			if (save === true) {
				if (c === '\t') {
					buffer += intent;
				} else {
					buffer += c;
					if (buffer.length > 100) {
						return tokens;
					}
				}
			}


			if (_saveToken) {
				addToken(buffer, currentToken);
				if (tokens.length > 1000) {
					console.log('bug');
					return tokens;
				}
				buffer = '';
			}
		}

		return tokens;
	};

	$.lexer['css'] = {
		scan: scan,
		map: Token.map
	};

}(lighter));
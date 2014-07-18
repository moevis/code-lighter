'use strict';

(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		EOF           : -2,  // equal to $.Stream.EOF
		EOL           : -1,  // equal to $.Stream.EOL ! important
		WHITE         : 0,
		TAG           : 1,
		COMMENT       : 2,
		LANGLE        : 3,
		RANGLE        : 4,
		ATTRIBUTE     : 5,
		VALUE         : 6,
		EQUAL         : 7,
		NUMBER        : 8,
		PLAINTEXT     : 9,
		UNKNOWN       : 10
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
		TAGBEGIN: 2,
		TAGNAME: 3,
		TAGCLOSE: 4,
		INATTRIBUTE: 5,
		INNUM: 6,
		INQUOTATION: 7,
		INSINGLEQUOTATION: 8,
		INCOMMENT: 9,
		COMMENTBEGIN: 10,
		COMMENTEND: 11,
		INDOCTYPE: 12,
		INWHITE: 13,
		DONE: 14
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
		this.states.pop();
	};

	States.prototype.top = function() {
		return this.states[this.states.length - 1];
	};

	var scan = function (stream, opt) {
		var currentToken = null,
			tokens       = [],
			c            = '',
			buffer       = '',
			state        = new States(State.START),
			tabSpace     = 4,
			save         = true,
			saveToken    = false,
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
			saveToken = false;
		}

		while (state.top() !== State.DONE) {

			c = stream.read();
			save = true;
			switch (state.top()) {

				case State.START:
					if (c === '<') {
						var next = stream.pick();
						if ($.type.isAlpha(next) || next === '_' || next === '$' || next === '/') {
							// detetmine last char '<' stands for the begin of tag
							if (buffer.length === 0) {
								// no plain text in buffer
								// switch state to TAG BEGIN
								stream.putBack();
								save = false;
								state.push(State.TAGBEGIN);
							} else {
							//put back '<', save the plain text first
								stream.putBack();
								save         = false;
								currentToken = Token.type.PLAINTEXT;
								saveToken    = true;
							}
						} else if (stream.match('!--')) {
							// if it comes '<!--'
							if (buffer.length === 0) {
								// no plain text in buffer
								// switch state to COMMENT BEGIN
								stream.putBack();
								save = false;
								state.push(State.COMMENTBEGIN);
							} else {
								stream.putBack();
								saveToken    = true;
								currentToken = Token.type.COMMENTBEGIN;
								save         = false;
							}
						} else if (c === $.Stream.EOF) {
							saveToken = true;
							save = false;
							currentToken = Token.type.UNKNOWN;
							state.change(State.DONE);
						} else {
							// just nothing, save plain text
						}
					} else if (c === $.Stream.EOL) {
						if (buffer.length === 0) {
							// no plain text in buffer
							currentToken = Token.type.EOL;
							saveToken = true;
							save = false;
						} else {
							stream.putBack();
							saveToken    = true;
							currentToken = Token.type.PLAINTEXT;
							save         = false;
						}
					} else if (c === $.Stream.EOF) {
						saveToken = true;
						save = false;
						currentToken = Token.type.UNKNOWN;
						state.change(State.DONE);
					} else {
						// just nothing, save plain text
					}
					break;

				case State.TAGBEGIN:
					// c must be '<'
					if (c === '<') {
						if (stream.pick() === '/') {

						} else {
							saveToken    = true;
							currentToken = Token.type.LANGLE;
							state.change(State.TAGNAME);
						}
					} else {
						saveToken    = true;
						currentToken = Token.type.LANGLE;
						state.change(State.TAGNAME);
					}
					break;

				case State.TAGNAME:
					if ($.type.isAlpha(c) || c === '_' || c === '$') {

					} else {
						// tag name finished
						save = false;
						saveToken = true;
						currentToken = Token.type.TAG;
						state.change(State.INTAG);
						stream.putBack();
					}
					break;

				case State.INTAG:
					if ($.type.isAlpha(c) || c === '_' || c === '$') {
						state.push(State.INATTRIBUTE);
					} else if ($.type.isWhite(c)) {
						state.push(State.INWHITE);
					} else if (c === '\'') {
						state.push(State.INSINGLEQUOTATION);
					} else if (c === '"') {
						state.push(State.INQUOTATION);
					} else if (c === '=') {
						saveToken = true;
						currentToken = Token.type.EQUAL;
					} else if ($.type.isNum(c)) {
						state.push(State.INNUM);
					} else if (c === '/') {
						if (stream.pick() === '>') {
							save = false;
							stream.putBack();
							state.change(State.TAGCLOSE);
						} else {
							saveToken = true;
							currentToken = Token.type.UNKNOWN;
						}
					} else if (c === '>') {
						save = false;
						stream.putBack();
						state.change(State.TAGCLOSE);
					} else if (c === $.Stream.EOF) {
						saveToken = true;
						save = false;
						currentToken = Token.type.UNKNOWN;
						state.change(State.DONE);
					} else {
						saveToken = true;
						currentToken = Token.type.UNKNOWN;
					}
					break;

				case State.INATTRIBUTE:
					if (!$.type.isAlpha(c) && !$.type.isNum(c) && c!== '_' && c !== '$') {
						state.pop();
						stream.putBack();
						save = false;
						saveToken = true;
						currentToken = Token.type.ATTRIBUTE;
					}
					break;

				case State.INWHITE:
					if (!$.type.isWhite(c)) {
						stream.putBack();
						state.pop();
						save         = false;
						currentToken = Token.type.WHITE;
					}
					break;

				case State.INSINGLEQUOTATION:
					if (c === '\'') {
						if (!ignore) {
							state.pop();
							saveToken = true;
							currentToken = Token.type.VALUE;
						}
						ignore = false;
					} else if (c === '\\') {
						// if c == '\\', we will ignore the meaning of next char
						if (ignore) {
							ignore = false;
						} else {
							ignore = true;
						}
					} else if (c === $.Stream.EOL){
						c = '\n';
					} else if (c === $.Stream.EOF) {
						ignore = false;
						state.change(State.DONE);
						currentToken = Token.type.VALUE;
						saveToken = true;
						save = false;
						stream.putBack();
					}
					break;

				case State.INQUOTATION:
					if (c === '"') {
						if (!ignore) {
							state.pop();
							saveToken = true;
							currentToken = Token.type.VALUE;
						}
						ignore = false;
					} else if (c === '\\') {
						// if c == '\\', we will ignore the meaning of next char
						if (ignore) {
							ignore = false;
						} else {
							ignore = true;
						}
					} else if (c === $.Stream.EOL){
						c = '\n';
					} else if (c === $.Stream.EOF) {
						ignore = false;
						state.change(State.DONE);
						currentToken = Token.type.VALUE;
						saveToken = true;
						save = false;
						stream.putBack();
					}
					break;

				case State.INNUM:
					if (!$.type.isNum(c)) {
						save = false;
						saveToken = true;
						currentToken = Token.type.NUMBER;
						state.pop();
					}
					break;

				case State.TAGCLOSE:
					if (c === '/') {
					} else if (c === '>') {
						saveToken = true;
						currentToken = Token.type.RANGLE;
						state.pop();
					}
					break;

				case State.COMMENTBEGIN:
					if (buffer.length === 4) {
						state.change(State.INCOMMENT);
					}
					break;

				case State.INCOMMENT:
					if (c === '-') {
						if (stream.match('->')) {
							state.change(State.COMMENTEND);
							save = false;
							stream.putBack();
						}
					} else if (c === $.Stream.EOF) {
						state.change(State.DONE);
						save = false;
						saveToken = true;
						currentToken = Token.type.COMMENT;
					}
					break;

				case State.COMMENTEND:
					if (c === '>') {
						state.pop();
						saveToken = true;
						currentToken = Token.type.COMMENT;
					}
				default :
					//never reaches here;
			}

			if (save === true) {
				if (c === '\t') {
					buffer += intent;
				} else {
					buffer += c;
				}
			}


			if (saveToken) {
				addToken(buffer, currentToken);
				buffer = '';
			}
		}

		return tokens;
	};

	$.lexer['html'] = {
		scan: scan,
		map: Token.map
	};

}(lighter));
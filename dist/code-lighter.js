/*! blog - v0.0.1 - 2014-07-08 */
'use strict';

var lighter = (function () {

	var $ = {};

	function Event(e) {
		this.e = e;
	}

	Event.prototype.preventDefault = function () {
		if (this.e.preventDefault) {
			this.e.preventDefault();
		}
		this.e.returnValue = false;
	};

	Event.prototype.stopPropagation = function () {
		if (this.e.stopPropagation) {
			this.e.stopPropagation();
		}
		this.e.cancelBubble = true;
	};

	Event.prototype.target = function () {
		return this.e.target || this.e.srcElement || document;
	};

	Event.prototype.postion = function() {
		var pos = [0, 0];
		if (this.e.pageX || this.e.pageY) {
			pos[0] = this.e.pageX;
			pos[1] = this.e.pageY;
		} else if (this.e.clientX || this.e.clientY) {
			pos[0] = this.e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			pos[1] = this.e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return pos;
	};

	Event.prototype.relatedTarget = function() {
		return this.e.relatedTarget || this.e.fromElement || this.e.toElement;
	};

	Event.prototype.which = function() {
		if (!this.e.which && this.e.button) {
			if (this.e.button & 1) return 0;      // Left
			else if (this.e.button & 4) return 1; // Middle
			else if (this.e.button & 2) return 2; // Right
		}
	};

	$.addEventHandler = (function () {
		if (window.addEventListener) {
			return function (el, ev, fn) {
				el.addEventListener(ev, fn, false);
            };
        } else if (window.attachEvent) {
            return function (el, ev, fn) {
				el.attachEvent('on' + ev, function () {
					fn(new Event(window.e));
				});
			};
        } else {
            return function (el, ev, fn) {
				el['on' + ev] =  function () {
					fn(new Event(window.e));
				};
			};
		}
	}());

	$.addClass = function  (element, classStyle) {
		// body...
	};


	//start create editor

	$.code = function (opt) {

		/*
			opt:
				target: element contains code
				language: javascript etc.
				tabSpace: change Tab to spaces. default 4.
				pre: a bool value indicate wether if the target element is wrapped by <pre> tag.
		*/

		opt.tabSpace = opt.tabSpace || 4;
		opt.language = opt.language || 'javascript';
		opt.pre      = opt.pre || true;

		return {
			code: opt.target.innerHTML,
			opt: opt,
			on: function () {
				var stream      = new $.Stream($.unescapeHTML(this.code)),
					lexer       = $.lexer[this.opt.language],
					tokens      = lexer.scan(stream, this.opt),
					htmlContent = '',
					pre			= this.opt.pre;

				tokens.forEach(function (token, i) {
					htmlContent += $.spanStyle(token.text, lexer.map[token.type], pre);
				});

				this.opt.target.innerHTML = htmlContent;
			},
			off: function () {
				this.opt.target.innerHTML = this.code;
			}
		};

	};

	$.Line = function(text, state) {
        this.text   = text;
        this.state  = state;
    };

    $.Stream = function(text) {
        this.number = 0;
        this.pos = 0;
        this.lines = this.splitLines(text);
    };

    $.Stream.EOL = -1;
    $.Stream.EOF = -2;

    $.Stream.prototype.read = function() {
        if (this.number < this.lines.length) {
            if (this.pos < this.lines[this.number].length) {
                return this.lines[this.number][this.pos++];
            } else {
                // reset to line start and move to next line
                this.pos = 0;
                this.number++;
                return $.Stream.EOL;
            }
        } else {
            return $.Stream.EOF;
        }
    };

    $.Stream.prototype.putBack = function() {
        if (this.pos === 0) {
            this.pos = this.lines[--this.number].length;
        } else {
            this.pos--;
        }
    };

    $.Stream.prototype.pick = function() {
		if (this.number < this.lines.length) {
			if (this.pos < this.lines[this.number].length) {
				return this.lines[this.number][this.pos];
			} else {
				return $.Stream.EOL;
			}
		} else {
			return $.Stream.EOF;
		}
	};

	$.Stream.prototype.setLine = function(text, number) {
		this.lines[number] = text;
	};

	$.Stream.prototype.addLine = function(text, number) {
		if (number === undefined) {
			this.lines.push(new $.Line(text , null));
		}else{
			this.lines.splice(number,0, new $.Line(text, null));
		}
	};

	$.Stream.prototype.getLine = function(number) {
		if (number < this.lines.length) {
			return this.lines[number];
		}else{
			return null;
		}
	};

	$.Stream.prototype.setCursor = function(number) {
		
	};

	$.Stream.prototype.splitLines = function (text) {
		return text.split(/\r\n?|\n/g);
	};

	$.spanStyle = function (text, classStyle, pre) {
		if (!pre) {
			text = $.escapeHTML(text);
		}
		return (classStyle !== "WHITE")? '<span class="' + classStyle + '">' + text + '</span>': text;
	};

	$.prepareLayer = function () {

	};

	$.type = {};

	$.type.inRange = function (num, min, max) {
		return (num >= min && num <= max);
	};

	$.type.isNum = function (c) {
		return ($.type.inRange(c, '0', '9'));
	};

	$.type.isAlpha = function (c) {
		return ($.type.inRange(c, 'a', 'z') || $.type.inRange(c, 'A', 'Z'));
	};

	$.type.isWhite = function (c) {
		return (c === '\t' || c === ' ');
	};

	$.escapeHTML = function (content) {
		return content
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/ /g, "&nbsp;")
		.replace(/>/g, "&gt;");
	};

	$.unescapeHTML = function (content) {
		return content
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&nbsp;/g, ' ')
		.replace(/&gt;/g, '>');
	};

	return $;

}());

(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		WHITE: -1,
		NUMBER: 0,
		BRACKET: 1,
		OPERATION: 2,
		STRING: 3,
		BRACE: 4,
		SIMBOL: 5,
		EOL: 6,
		EOF: 7,
		VAR: 8,
		COMMENT: 9,
		KEYS: 10,
		UNKNOWN: 11
	};

	Token.map = (function(types) {
		var ret = {};
		for (var name in types) {
			ret[types[name]] = name;
		}
		return ret;
	}(Token.type));

	var State = {
		START: 0,
		INNUM: 1,
		INID: 2,
		INCOMMENT: 3,
		INASSIGN: 4,
		INOBJECTS: 5,
		INBLOCK: 6,
		INOPERATION: 7,
		INGEATER: 8,
		INLESS: 9,
		INPLUS: 10,
		INMINUS: 11,
		INTIMES: 12,
		INDIV: 13,
		INEQ: 14,
		INSTRING: 15,
		INMULTICOMMENT: 16,
		INMULTICOMMENTEND: 17,
		INQUOTATION: 18,
		INSINGLEQUOTATION: 19,
		INWHITE: 20,
		DONE: 21
	};

	var keyValues = {
		if: 0,
		then: 0,
		else: 0,
		function: 0,
		var: 0,
		switch: 0,
		case: 0,
		return: 0,
		do: 0,
		while: 0,
		Date: 0,
		Math: 0,
		new: 0,
		Regex: 0,
		in: 0,
		null: 0,
		typeof: 0,
		instanceof: 0
	};

	var scan = function (stream, opt) {

		var tokens       = [],
			state        = 0,
			currentToken = null,
			buffer       = '',
			c            = '',
			tabSpace     = 4;

		if (opt !== undefined) {
			tabSpace = opt.tabSpace;
		}

		var intent = '';
		for (var i = 0; i < tabSpace; i++) {
			intent += ' ';
		}

		while (state !== State.DONE) {

			c = stream.read();
			var save = true;

			switch (state) {
				case State.START:
					if ($.type.isNum(c)) {
						state = State.INNUM;
					}else if ($.type.isAlpha(c) || c == '_') {
						state = State.INID;
					}else if ($.type.isWhite(c)) {
						state = State.INWHITE;
					}else if (c === '{' || c === '}') {
						currentToken = Token.type.BRACKET;
						state        = State.DONE;
					}else {
						switch(c) {
							case $.Stream.EOF:
								state = State.DONE;
								save = false;
								currentToken = Token.type.EOF;
								break;
							case $.Stream.EOL:
								state = State.DONE;
								save = false;
								currentToken = Token.type.EOL;
								break;
							case '=':
								state = State.INEQ;
								break;
							case '<':
								state = State.INLESS;
								break;
							case '>':
								state = State.INGEATER;
								break;
							case '+':
								state = State.INPLUS;
								break;
							case '-':
								state = State.INMINUS;
								break;
							case '*':
								state = State.INTIMES;
								break;
							case '/':
								state = State.INDIV;
								break;
							case '%':
								state = State.INMOD;
								break;
							case ',':
							case ':':
							case '[':
							case ']':
							case ';':
							case '.':
								state        = State.DONE;
								currentToken = Token.type.SIMBOL;
								break;
							case '(':
								state        = State.DONE;
								currentToken = Token.type.BRACE;
								break;
							case ')':
								state        = State.DONE;
								currentToken = Token.type.BRACE;
								break;
							case '\'':
								state = State.INSINGLEQUOTATION;
								break;
							case '"':
								state = State.INQUOTATION;
								break;
							default:
								state        = State.DONE;
								currentToken = Token.type.UNKNOWN;
								break;
						}
					}
					break;

				case State.INSINGLEQUOTATION:
					if (c === '\'') {
						state = State.DONE;
						currentToken = Token.type.STRING;
					}
					break;

				case State.INQUOTATION:
					if (c === '"') {
						state = State.DONE;
						currentToken = Token.type.STRING;
					}
					break;

				case '"':
					state = State.INQUOTATION;
					break;

				case State.INNUM:
					if (!$.type.isNum(c) && c !== '.') {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.NUMBER;
					}
					break;

				case State.INID:
					if (!$.type.isAlpha(c) && !$.type.isNum(c) && c!== '_') {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.VAR;
					}
					break;

				case State.INWHITE:
					if (!$.type.isWhite(c)) {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.WHITE;
					}
					break;

				case State.INEQ:
					if (c === '=') {
						// equal
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// assign
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}

					break;

				case State.INLESS:
					if (c === '=') {
						// less and equal
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// less
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}

					break;

				case State.INGEATER:
					if (c === '=') {
						// greater and equal
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// greater
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}

					break;

				case State.INPLUS:
					if (c === '=') {
						// plugs itself
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else if (c === '+'){
						// plus plus
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// plus
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}

					break;

				case State.INMINUS:
					if (c === '=') {
						// minus itself
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					} else if (c === '-'){
						// minus minus
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// minus
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					}

					break;

				case State.INTIMES:
					if (c === '=') {
						// times itsefl
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// times
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					}

					break;

				case State.INDIV:
					if (c === '=') {
						// divide
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					} else if (c === '/'){
						state = State.INCOMMENT;
					} else if (c === '*') {
						state = State.INMULTICOMMENT;
					} else {
						// divide
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					break;

				case State.INCOMMENT:
					if (c === $.Stream.EOL) {
						stream.putBack();
						state = State.DONE;
						save = false;
						currentToken = Token.type.COMMENT;
					}
					break;

				case State.INMULTICOMMENT:
					if (c === '*') {
						if (stream.pick() === '/') {
							state = State.INMULTICOMMENTEND;
						}
					} else if (c === State.EOL) {
						if (stream.pick() === $.Stream.EOF) {
							state = State.DONE;
							save = false;
							stream.putBack();
						}
					}
					break;

				case State.INMULTICOMMENTEND:
					state        = State.DONE;
					currentToken = Token.type.COMMENT;
					break;

				default:
					//never reach
					break;
			}

			if (save === true) {
				if (c === '\t') {
					buffer += intent;
				} else {
					buffer += c;
				}
				
			}

			if (state == State.DONE) {
				if (currentToken === Token.type.VAR) {
					if (buffer in keyValues) {
						currentToken = Token.type.KEYS;
					}
				}
				tokens.push({text: buffer, type: currentToken});
				if (currentToken !== Token.type.EOF) {
					state = State.START;
					buffer = '';
				} else {
					state = State.DONE;
				}
			}
		}

		return tokens;
	};

	$.lexer['javascript'] = {
		scan: scan,
		map: Token.map
	};

}(lighter));


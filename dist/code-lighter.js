/*! code-lighter - v0.0.1 - 2014-09-03 */
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

	$.addClass = (function () {
		if (document.documentElement.classList) {
			return function (el, classStyle) {
				el.classList.add(classStyle);
			};
		}else{
			return function (el, classStyle) {
				var c = ' ' + el.className + ' ';
				if (c.indexOf(' ' + classStyle + ' ') == -1) {
					el.className += ' ' + classStyle;
				}
			};
		}
	}());

	$.removeClass = (function () {
		if (document.documentElement.classList) {
			return function (el, classStyle) {
				el.classList.remove(classStyle);
			};
		}else{
			return function (el, classStyle) {
				el.className = el.className.replace(new RegExp('\\b' + classStyle + '\\b','g'), '');
			};
		}
	}());

	$.classStyle = (function() {
		if (document.getElementsByClassName) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.getElementsByClassName(classStyle);
			};
		} else if (document.querySelector) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.querySelectorAll('.' + classStyle);
			};
		} else return function(classStyle, scope) {
			var result = [],
				dom = scope || document,
				elements = dom.getElementsByTagName('*');
			for (var i = 0, len = elements.length; i < len; i++) {
				if ((' ' + elements[i].className + ' ').indexOf(classStyle) !== -1) {
					result.push(elements[i]);
				}
			}
			return result;
		};
	}());

	//start create editor

	$.code = function (opt) {

		/*
			opt:
				target: element contains code
				language: javascript etc.
				tabSpace: change Tab to spaces. default 4.
				pre: a bool value indicate whether if the target element is wrapped by <pre> tag.
				lineNumber: determine whether to show line number
		*/
		opt.tabSpace   = opt.tabSpace || 4;
		opt.language   = opt.language || 'javascript';
		opt.pre        = opt.pre || true;
		opt.lineNumber = opt.lineNumber || true;
		opt.style      = opt.style || 'dark';

		return {
			code: opt.target.innerHTML,
			opt: opt,
			on: function () {
				var stream      = new $.Stream($.unescapeHTML(this.code)),
					lexer       = $.lexer[this.opt.language],
					tokens      = lexer.scan(stream, this.opt),
					htmlContent = '<div class="code">',
					pre			= this.opt.pre;

				for (var i = 0, len = tokens.length; i < len; i++) {
					var token = tokens[i];
					htmlContent += (token.type === $.Stream.EOL)?'<br />':$.spanStyle(token.text, lexer.map[token.type], pre);
				};
				this.opt.target.innerHTML = htmlContent + '</div>';
				if (this.opt.lineNumber) {
					$.addLineNumber(this.opt.target, stream.lines.length);
				}
				var code = $.classStyle('code', this.opt.target)[0];
				$.addClass(code, this.opt.language);
				$.addClass(this.opt.target, this.opt.style);
				$.addClass(this.opt.target, 'code-lighter');
			},
			off: function () {
				$.removeClass(this.opt.target, this.opt.style);
				$.removeClass(this.opt.target, 'code-lighter');
				// for ie6/7/8, line breaks '\n' will be ignored so there will be only one line
				// var t = document.createElement('div');
				// t.innerHTML = '\n';

				//if ( t.innerHTML === '\n' ){
				this.opt.target.innerHTML = this.code;
				//}
			}
		};

	};

	var autoFlag = false;
	$.auto = function (opt) {
		opt = opt || {};
		opt.tabSpace   = opt.tabSpace || 4;
		opt.pre        = opt.pre || true;
		opt.lineNumber = opt.lineNumber || true;
		opt.style      = opt.style || 'dark';

		var language;
		var elements = document.getElementsByTagName('*');
		for (var i = elements.length - 1; i >= 0; i--) {
			language = elements[i].getAttribute('codelighter');
			if (language) {
				var stream      = new $.Stream($.unescapeHTML(elements[i].innerHTML)),
					lexer       = $.lexer[language],
					tokens      = lexer.scan(stream, opt),
					htmlContent = '<div class="code">',
					pre			= opt.pre;

				for (var j = 0, len = tokens.length; j < len; j++) {
					var token = tokens[j];
					htmlContent += (token.type === $.Stream.EOL)?'<br />':$.spanStyle(token.text, lexer.map[token.type], pre);
				};
				elements[i].innerHTML = htmlContent + '</div>';
				if (opt.lineNumber) {
					$.addLineNumber(elements[i], stream.lines.length);
				}
				var code = $.classStyle('code', elements[i])[0];
				$.addClass(code, language);
				$.addClass(elements[i], opt.style);
				$.addClass(elements[i], 'code-lighter');
			}

		}
	}

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
                return this.lines[this.number].charAt(this.pos++);
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
				return this.lines[this.number].charAt(this.pos);
			} else {
				return $.Stream.EOL;
			}
		} else {
			return $.Stream.EOF;
		}
	};

	$.Stream.prototype.match = function(matchString) {
		return this.lines[this.number].indexOf(matchString,this.pos) === this.pos;
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

	$.Stream.prototype.splitLines = (function(){
		return ('\n\nb'.split(/\n/).length != 3)? function(string) {
		    var pos = 0, result = [], l = string.length;
			while (pos <= l) {
				var nl = string.indexOf('\n', pos);
				if (nl == -1) {
					nl = string.length;
				}
				var line = string.slice(pos, string.charAt(nl - 1) == '\r' ? nl - 1 : nl);
				var rt = line.indexOf('\r');
				if (rt != -1) {
					result.push(line.slice(0, rt));
					pos += rt + 1;
				} else {
					result.push(line);
					pos = nl + 1;
				}
			}
    		return result;
    	} : function(string){
    		return string.split(/\r\n?|\n/);
    	};
    }());

	$.spanStyle = function (text, classStyle, pre) {
		// if (!pre) {
		// 	text = $.escapeHTML(text);
		// }
		return '<span class="' + classStyle + '">' + $.escapeHTML(text) + '</span>';
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

	$.addLineNumber = function (target, n) {
		var html = [];
		for (var i = 1; i <= n; i++) {
			html.push('<span class="line-number">' + i + '</span>');
		}
		var doc = document.createElement("div");
		$.addClass(doc, 'aside');
		doc.innerHTML = html.join("");

		target.insertBefore(doc, target.firstChild);
	};

	$.classStyle = (function() {
		if (document.getElementsByClass) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.getElementsByClass(classStyle);
			};
		} else if (document.querySelector) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.querySelectorAll('.' + classStyle);
			};
		} else return function(classStyle, scope) {
			var result = [],
				dom = scope || document,
				elements = dom.getElementsByTagName('*');
			for (var i = 0, len = elements.length; i < len; i++) {
				if ((' ' + elements[i].className + ' ').indexOf(classStyle) !== -1) {
					result.push(elements[i]);
				}
			}
			return result;
		};
	}());

	return $;

}());

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
(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		EOF           : -2,  // equal to $.Stream.EOF
		EOL           : -1,  // equal to $.Stream.EOL ! important
		BRACKET       : 0,
		OPERATION     : 1,
		STRING        : 2,
		LBRACE        : 3,
		RBRACE        : 4,
		SIMBOL        : 5,
		WHITE         : 6,
		NUMBER        : 7,
		VAR           : 8,
		COMMENT       : 9,
		KEYS          : 10,
		BUILDINOBJECT : 11,
		FUNCTION      : 12,
		BUILDINMETHOD : 13,
		DOT           : 14,
		UNKNOWN       : 15
	};

	Token.map = (function(types) {
		var ret = {};
		for (var name in types) {
			ret[types[name]] = name.toLowerCase();
		}
		return ret;
	}(Token.type));

	var State = {
		START             : 0,
		INNUM             : 1,
		INID              : 2,
		INCOMMENT         : 3,
		INASSIGN          : 4,
		INOBJECTS         : 5,
		INBLOCK           : 6,
		INOPERATION       : 7,
		INGEATER          : 8,
		INLESS            : 9,
		INPLUS            : 10,
		INMINUS           : 11,
		INTIMES           : 12,
		INDIV             : 13,
		INEQ              : 14,
		INSTRING          : 15,
		INMULTICOMMENT    : 16,
		INMULTICOMMENTEND : 17,
		INQUOTATION       : 18,
		INSINGLEQUOTATION : 19,
		INWHITE           : 20,
		DONE              : 21
	};

	var keyValues = {
		'if'         : 0,
		'then'       : 0,
		'else'       : 0,
		'var'        : 0,
		'switch'     : 0,
		'case'       : 0,
		'return'     : 0,
		'do'         : 0,
		'while'      : 0,
		'new'        : 0,
		'try'        : 0,
		'in'         : 0,
		'null'       : 0,
		'typeof'     : 0,
		'instanceof' : 0,
		'prototype'  : 0
	};

	var buildInObject = {
		'Date'     : Token.type.BUILDINOBJECT,
		'Regex'    : Token.type.BUILDINOBJECT,
		'document' : Token.type.BUILDINOBJECT,
		'windows'  : Token.type.BUILDINOBJECT,
		'console'  : Token.type.BUILDINOBJECT,
		'Math'     : Token.type.BUILDINOBJECT,
		'String'   : Token.type.BUILDINOBJECT,
		'function' : Token.type.BUILDINOBJECT
	};

	var scan = function (stream, opt) {

		var tokens       = [],
			state        = 0,
			currentToken = null,
			buffer       = '',
			c            = '',
			tabSpace     = 4,
			ignore       = false;

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
					}else if ($.type.isAlpha(c) || c === '_' || c === '$') {
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
								state        = State.DONE;
								currentToken = Token.type.SIMBOL;
								break;
							case '.':
								state        = State.DONE;
								currentToken = Token.type.DOT;
								break;
							case '(':
								state        = State.DONE;
								currentToken = Token.type.LBRACE;
								break;
							case ')':
								state        = State.DONE;
								currentToken = Token.type.RBRACE;
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
						if (!ignore) {
							state = State.DONE;
							currentToken = Token.type.STRING;
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
							state = State.DONE;
							urrentToken = Token.type.STRING;
							save = false;
							stream.putBack();
					}
					break;

				case State.INQUOTATION:
					if (c === '"') {
						if (!ignore) {
							state = State.DONE;
							currentToken = Token.type.STRING;
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
							state = State.DONE;
							urrentToken = Token.type.STRING;
							save = false;
							stream.putBack();
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
					if (!$.type.isAlpha(c) && !$.type.isNum(c) && c!== '_' && c !== '$') {
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
						save         = false;
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
						save         = false;
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
						save         = false;
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
						save         = false;
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
						save = false;
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
						save = false;
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
						save = false;
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
					} else if (c === $.Stream.EOL) {
						if (stream.pick() === $.Stream.EOF) {
							state = State.DONE;
							save = false;
							stream.putBack();
						} else {
							c = '\n';
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

			if (state === State.DONE) {
				if (currentToken === Token.type.VAR) {
					if (buffer in keyValues) {
						currentToken = Token.type.KEYS;
					} else if (buffer in buildInObject) {
						currentToken = Token.type.BUILDINOBJECT;
					} else if (tokens.length > 1) {
						var current = tokens.length;
						if (tokens[current - 1].type === Token.type.DOT && tokens[current - 2].type === Token.type.BUILDINOBJECT) {
							currentToken = Token.type.BUILDINMETHOD;
						}
					}
				} else if (currentToken === Token.type.LBRACE) {
					if (tokens.length > 0) {
						if (tokens[tokens.length - 1].type === Token.type.VAR) {
							tokens[tokens.length - 1].type = Token.type.FUNCTION;
						}
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


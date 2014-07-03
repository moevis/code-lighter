/*! blog - v0.0.1 - 2014-07-03 */
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
		if (this.e.pageX || this.e.pageY) 	{
			pos[0] = this.e.pageX;
			pos[1] = this.e.pageY;
		} else if (this.e.clientX || this.e.clientY) 	{
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


	//start create editor

	$.on = function (opt) {
		var editor = {
			target: opt.target,
			language: opt.language
		};

		var stream = new Stream(editor.target.value);

		var displayLayer = document.createElement('div');

		editor.target.parentNode.insertBefore(displayLayer,editor.target);

		$.addEventHandler(editor.target, 'click', function (e) {
			console.log(e);
		});

		$.addEventHandler(editor.target, 'keyup', function (e) {
			console.log(e);
		});
	};

	function Line(text,state) {
		this.text   = text;
		this.state  = state;
	}

	function Stream(text) {
		this.number = 0;
		this.pos = 0;
		this.lines = this.splitLines(text);
	}

	Stream.EOL = -1;
	Stream.EOF = -2;

	Stream.prototype.read = function() {
		if (this.number < this.lines.length) {
			if (this.pos < this.lines[this.number].length) {
				return this.lines[this.number][this.pos++];
			} else {
				// reset to line start and move to next line
				this.pos = 0;
				this.number++;
				return Stream.EOL;
			}
		} else {
			return Stream.EOF;
		}
	};

	Stream.prototype.setLine = function(text, number) {
		this.lines[number] = text;
	};

	Stream.prototype.addLine = function(text, number) {
		if (number === undefined) {
			this.lines.push(new Line(text , null));
		}else{
			this.lines.splice(number,0, new Line(text, null));
		}
	};

	Stream.prototype.getLine = function(number) {
		if (number < this.lines.length) {
			return this.lines[number];
		}else{
			return null;
		}
	};

	Stream.prototype.setCursor = function(number) {
		
	};

	Stream.prototype.splitLines = function (text) {
		return text.split(/\r\n?|\n/g);
	};

	$.prepareLayer = function () {

	};

	return $;

}());

(function($) {
	$.lexer = $.lexer || {};
	$.lexer['javascript'] = function () {
		
	};
}(lighter));


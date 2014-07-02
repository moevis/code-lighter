/*! blog - v0.0.1 - 2014-07-02 */
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

	$.on = function (opt) {
		var editor = {
			target: opt.target,
			language: opt.language
		};

		$.addEventHandler(editor.target, 'click', function (e) {
			console.log(e);
		});

		$.addEventHandler(editor.target, 'keyup', function (e) {
			console.log(e);
		});
	};

	return $;

}());

lighter.lexer = lighter.lexer || {};
lighter.lexer['js'] = function () {
	
};
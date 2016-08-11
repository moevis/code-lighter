code-lighter
============

This is an extremely lightweight tool for code heighlighting.

You can go to <a href="http://moevis.github.io/code-lighter/">Example Page</a> to see demos.

Currently support highlighting for:

* javascript
* html
* css

And all of above have both a light theme and a dark theme.

No dependencies on other javascript libraries. It uses lexical analysis instead of regex matching.

preview
![alt tag](https://raw.githubusercontent.com/moevis/code-lighter/master/preview.png)

## Simple usage

First, include the css and code-lighter.js.

HTML code

```html
<pre><div id="area">
	//comment
	function helloworld() {
		for (var i = 0; i < 10; i++) {
			console.log(i);
		}
		alert("hello");
	}
</div></pre>
```

javascript initializing:
```js
var option = {
	target: document.querySelector('#area'),	// target element
	language: 'javascript',
	tabSpace: 4,					// change a '\t' char to spaces, default is 4 spaces.
	lineNumber: true				// add line number to the code
}

var code = lighter.code();
```

Then, Using `code.on()` to highlight the code. Using `code.off()` to disable highlighting.

In a more convenient way, using `lighter.auto()` when page is loaded, code-lighter will highlight the code which has the attribute "codelighter", like below.
```html
<pre>
	<div codelighter='javascript'>
	function(){
	
	}
	</div>
</pre>
```


## License

MIT License

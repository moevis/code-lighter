code-lighter
============

This is an extremely lightweight tool for code heighlighting.

Currently support highlighting for :

* javascript

No dependencies for other javascript library. Using token analysing instead of regex matching.

## Simple usage

first, include the css and code-lighter.js.

HTML code

```
		<div id="area">
			//comment
			function helloworld() {
				for (var i = 0; i < 10; i++) {
					console.log(i);
				}
				alert("hello");
			}
		</div>
```

javascript initializing:
```
var code = lighter.code({target:document.querySelector('#area'),language:'javascript'});
```

Then, Using `code.on()` to highlight the code. Using `code.off()` to disable highlight.

## Lisense

MIT Lisense

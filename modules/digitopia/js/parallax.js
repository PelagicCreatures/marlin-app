// digitopia/parallax.js - digitopia.js parallax controller
// status: experimental - api likely to change
// version: 2.0

/*
    Copyright (C) 2013 Michael Rhodes

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import $ from "jquery";
import {
	GetJQueryPlugin
}
from './controller';

var pendingAnimationFrame = undefined;
var animationQueue = [];

function flushAnimationQueue() {
	if (pendingAnimationFrame) {
		cancelAnimationFrame(pendingAnimationFrame);
		pendingAnimationFrame = undefined;
	}
	animationQueue = [];
}

function queueAnimation(frame) {
	animationQueue.push(frame);
	if (!pendingAnimationFrame) {
		pendingAnimationFrame = requestAnimationFrame(processAnimationQueue);
	}
}

function processAnimationQueue() {
	pendingAnimationFrame = undefined;
	var toProcess = animationQueue;
	animationQueue = [];
	for (var i = 0; i < toProcess.length; i++) {
		toProcess[i]();
	}
}

// parallax scrolling

function selectScene(id) {
	$('#parallax-wrapper').data('parallaxWrapper').scrollTo(id);
}

function parallaxWrapper(elem, options) {
	this.element = $(elem);
	var self = this;

	this.settings = $.extend({
		naturalHeight: $(this.element).data('no-min-height') ? true : false,
		sceneOffsetY: $(this.element).data('scene-offset-y') ? $(this.element).data('scene-offset-y') : 0,

	}, options || {});

	this.currentScene = undefined;

	this.lastScroll = {
		top: -1,
		left: -1
	}

	this.currentScroll = {
		top: 0,
		left: 0
	}

	this.nextScroll = {
		top: 0,
		left: 0
	}

	this.direction = $(this.element).data('direction') ? $(this.element).data('direction') : 'y'; // ??? unused

	this.start = function () {
		if (this.element.children('.parallax-actor')) {
			$(this.element).parallaxScene({
				wrapper: this,
				background: true
			}); // make this the background scene
		}
		this.canvas = $(this.element).find('.parallax-act');
		this.scenes = $(this.element).find(".parallax-scene").parallaxScene({
			wrapper: this
		});

		this.element.on('DigitopiaDidResize', function (e) {
			e.stopPropagation();
			if (e.target === self.element[0]) {
				self.recalculate();
			}
		});

		this.recalculate();

		this.watchScroll();
	};

	this.stop = function () {
		flushAnimationQueue();
		this.element.off('DigitopiaDidResize');
	};

	this.recalculate = function () {
		//console.log(this.element.attr('id') + ' recalc');

		var h = this.getViewportHeight();
		var w = this.element.parent().innerWidth();

		var pos = this.element.position();

		$(this.element).width(w);

		this.scenes.each(function () {
			if (self.naturalHeight) {
				$(this).width(w);
			}
			else {
				$(this).css({
					'min-height': h + 'px'
				}).width(w);
			}
		});

		//this.canvas.css({top:pos.top,left:pos.left});

		this.element.children('.parallax-actor').each(function () {
			$(this).width(w); //.css({top:pos.top,left:pos.left});
		});

		this.element.find('.DigitopiaInstance').trigger('ParallaxRecalculate');
	};

	this.recalculateDone = function () {
		//console.log(this.element.attr('id') + ' recalc done');
		$(this.element).css({
			'min-height': $(this.canvas).height()
		});
	};

	this.watchScroll = function () {

		this.currentScroll = {
			top: $(window).scrollTop(),
			left: $(window).scrollLeft()
		}


		if (this.currentScroll.top != this.lastScroll.top || this.currentScroll.left != this.lastScroll.left) {
			this.scrollMoved(this.currentScroll.left, this.currentScroll.top);
			this.lastScroll = this.currentScroll;
		}

		queueAnimation(function () {
			self.watchScroll();
		});
	};

	this.scrollMoved = function (x, y) {
		queueAnimation(
			function (instance, x, y) {
				return function () {
					$(instance.canvas).css({
						top: (y * -1) + 'px',
						left: (x * -1) + 'px'
					});
					for (var i = 0; i < instance.scenes.length; i++) {
						$(instance.scenes[i]).data('parallaxScene').watchParallax(x, y);
					}
					if (instance.element.data('parallaxScene')) {
						instance.element.data('parallaxScene').watchParallax(x, y);
					}
				}
			}(this, x, y)
		);
	};

	this.getViewportHeight = function () {
		return $(window).height();
	};

	this.getViewportWidth = function () {
		return $(window).width();
	};

	this.scrollTo = function (element, duration) {
		if (!duration) {
			duration = 3000;
		}
		$('html,body').stop().animate({
			scrollTop: $(element).offset().top - this.settings.sceneOffsetY
		}, duration, 'swing');
	};
}

function parallaxScene(elem, options) {
	this.element = $(elem);

	var self = this;

	//console.log('scene ' + elem.id + ' wrapper ', options.wrapper);

	this.wrapper = options.wrapper;
	this.background = options.background;

	this.inScene = false;
	this.actors;

	this.lastScrollX = -1;
	this.lastScrollY = -1;

	this.sceneOffsetY = $(this.element).data('scene-offset-y') ? $(this.element).data('scene-offset-y') : 0;

	var starts = $(this.element).data('viewport-starts');

	if (!starts) {
		starts = 'bottom,right';
	}

	var startsxy = starts.split(',');

	this.startsY = startsxy[0];
	this.startsX = startsxy[1];
	this.initialized = false;

	this.start = function () {
		if (this.background) {
			this.actors = $(this.element).children(".parallax-actor");
		}
		else {
			this.actors = $(this.element).find(".parallax-actor");
		}

		this.actors.each(function () {
			$(this).parallaxActor({
				scene: self
			});
		});

		this.element.on('ParallaxRecalculate', function (e) {
			e.stopPropagation();
			self.recalculate();
		});
	};

	this.stop = function () {
		this.element.off('ParallaxRecalculate');
	};

	this.recalculate = function () {
		//console.log(this.element.attr('id') + ' recalc');

		var h = this.wrapper.getViewportHeight();
		var w = this.wrapper.getViewportWidth();

		$(this.element).find('.parallax-placeholder').each(
			function () {
				var heightPct = $(this).data('height');
				var widthPct = $(this).data('width');

				if (heightPct) {
					heightPct = parseFloat(heightPct) / 100;
				}
				else {
					heightPct = 1
				};
				if (widthPct) {
					widthPct = parseFloat(widthPct) / 100;
				}
				else {
					widthPct = 1
				};

				$(this).css({
					'height': h * heightPct + 'px',
					'width': w * widthPct + 'px'
				});

			}
		);

		this.wrapper.recalculateDone();
	};

	this.watchParallax = function (left, top) {

		if (top < 0) {
			top = 0;
		}
		if (left < 0) {
			left = 0;
		}

		var pos = $(this.element).position();

		var viewportHeight = this.wrapper.getViewportHeight();
		var viewportWidth = this.wrapper.getViewportWidth();

		var sceneDurationY, sceneStartY, sceneEndY, relativeY, sceneDurationX, sceneStartX, sceneEndX, relativeX, nowInScene;

		sceneDurationY = $(this.element).height();
		sceneDurationX = $(this.element).width();

		if (this.startsY === 'top') {
			sceneStartY = pos.top;
		}
		else if (this.startsY === 'bottom') {
			sceneStartY = pos.top - viewportHeight;
		}

		if (this.startsX === 'left') {
			sceneStartX = pos.left;
		}
		else if (this.startsX === 'right') {
			sceneStartX = pos.left - viewportWidth;
		}

		if (this.sceneOffsetY) {
			sceneStartY -= this.sceneOffsetY;
		}

		sceneEndY = sceneStartY + sceneDurationY;
		sceneEndX = sceneStartX + sceneDurationX;

		relativeY = top - sceneStartY;
		relativeX = left - sceneStartX;

		nowInScene = (top >= sceneStartY - viewportHeight && top <= sceneEndY + viewportHeight) && (left >= sceneStartX - viewportWidth && left <= sceneEndX + viewportWidth);

		var scrollState = {
			relativeY: relativeY,
			scenePercentY: (relativeY / sceneDurationY),
			directionY: top >= this.lastScrollY ? 1 : -1,
			relativeX: relativeX,
			scenePercentX: (relativeX / sceneDurationX),
			directionX: left >= this.lastScrollX ? 1 : -1,
		}


		if (this.wrapper.backgroundScene != this) {
			if ((scrollState.scenePercentY >= 0 && scrollState.scenePercentY <= 1)) {
				this.wrapper.currentScene = this;
				//console.log('currentScene: ' + $(this.element).attr('id') + ' ' + scrollState.scenePercentY);
			}
		}

		//console.log('scene ' + $(this.element).attr('id') + ' nowInScene:' + nowInScene + ' ' + scrollState.scenePercentY + '%');

		if (!this.inScene && nowInScene) {
			this.action('startScene', scrollState);
			this.element.trigger('DigitopiaLazy');
		}

		if (nowInScene) {
			this.action('act', scrollState);
		}

		if (this.inScene && !nowInScene) {
			this.action('endScene', scrollState);
		}

		this.lastScrollY = top;
		this.lastScrollX = left;
		this.inScene = nowInScene;
	};

	this.action = function (action, scrollState) {
		if (action != 'act') {
			//console.log('scene ' + this.element.attr('id') + ' ' + action + ' ' + scrollState.scenePercentY);
		}
		for (var i = 0; i < this.actors.length; i++) {
			//console.log('scene ' + $(this.element).attr('id') + ' ' + scrollState.scenePercentY + '%' + ' actor:' + $(this.actors[i]).attr('id'));
			$(this.actors[i]).data('parallaxActor').act(scrollState);
		}
	};
}

function parallaxActor(e, options) {
	this.element = $(e);

	var self = this;

	//console.log('actor ' + e.id + ' scene ', options.scene);

	this.scene = options.scene;

	this.qList = ['start'];

	if ($(this.element).data('q-list')) {
		this.qList = $(this.element).data('q-list').split(',');
	}

	this.Qs = {};
	this.performingQ = -1;
	this.reverse = false;

	this.start = function () {
		this.element.on('ParallaxRecalculate', function (e) {
			e.stopPropagation();
			self.recalculate();
		});
	};

	this.stop = function () {
		this.element.off('ParallaxRecalculate');
	};

	this.parseCSS = function (cssString) {
		var css = {};
		if (cssString) {
			var styles = cssString.split(';');
			for (var i = 0; i < styles.length; i++) {
				var regexCSS = /^\s*([a-z\-]+)\s*:\s*(.+)\s*$/gi;
				var found = regexCSS.exec(styles[i]);
				if (found && found.length) {
					css[found[1]] = found[2];
				}
			}
		}
		return css;
	}

	this.recalculate = function () {
		//console.log(this.element.attr('id') + ' recalc');

		var sceneHeight = $(this.scene.element).height();
		var viewportHeight = this.scene.wrapper.getViewportHeight();
		var sceneWidth = $(this.scene.element).width();
		var viewportWidth = this.scene.wrapper.getViewportWidth();

		for (var i = 0; i < this.qList.length; i++) {
			var q = this.qList[i];

			var direction = $(this.element).data('q-' + q + '-direction') ? $(this.element).data('q-' + q + '-direction') : 'y';
			var start = $(this.element).data('q-' + q + '-starts') ? $(this.element).data('q-' + q + '-starts') : '0%';
			var end = $(this.element).data('q-' + q + '-ends') ? $(this.element).data('q-' + q + '-ends') : '100%';
			var startCSS = this.parseCSS($(this.element).data('q-' + q + '-start-css'));
			var endCSS = this.parseCSS($(this.element).data('q-' + q + '-end-css'));
			var onStart = $(this.element).data('q-' + q + '-on-start');
			var onEnd = $(this.element).data('q-' + q + '-on-end');
			var easing = $(this.element).data('q-' + q + '-easing') ? $(this.element).data('q-' + q + '-easing') : 'linear';

			if (direction === 'x') {
				if (start) {
					if (typeof (start) == 'string' && start.indexOf('%') > -1) {
						start = parseFloat(start) / 100;
					}
					else if (typeof (start) == 'string' && start.indexOf('@') > -1) {
						var p = start.split('@');
						if (p[0] == 'left') {
							if (p[1] == 'left') {
								start = (viewportWidth / sceneWidth);
							}
							else if (p[1] == 'right') {
								start = 0;
							}
						}
						else if (p[0] == 'right') {
							if (p[1] == 'left') {
								start = (1 + (viewportWidth / sceneWidth));
							}
							else if (p[1] == 'right') {
								start = 1;
							}
						}
					}
					else {
						start = start / $(this.scene.element).width();
					}
				}

				if (end) {
					if (typeof (end) == 'string' && end.indexOf('%') > -1) {
						end = parseFloat(end) / 100;
					}
					else if (typeof (end) == 'string' && end.indexOf('@') > -1) {
						var p = end.split('@');
						if (p[0] == 'left') {
							if (p[1] == 'left') {
								end = (viewportWidth / sceneWidth);
							}
							else if (p[1] == 'right') {
								end = 0;
							}
						}
						else if (p[0] == 'right') {
							if (p[1] == 'left') {
								end = (1 + (viewportWidth / sceneWidth));
							}
							else if (p[1] == 'right') {
								end = 1
							}
						}
					}
					else {
						end = end / $(this.scene.element).width();
					}
				}
			}
			else {
				if (start) {
					if (typeof (start) == 'string' && start.indexOf('%') > -1) {
						start = parseFloat(start) / 100;
					}
					else if (typeof (start) == 'string' && start.indexOf('@') > -1) {
						var sceneTop = $(this.scene.element).position().top;
						var top = $(this.element).offset().top - sceneTop;
						var bottom = top + $(this.element).height();
						//console.log(start + ' top: ' + top + ' bottom: ' + bottom + ' sceneHeight: ' + sceneHeight);
						var p = start.split('@');
						if (p[0] == 'top') {
							if (p[1] == 'top') {
								start = ((top + viewportHeight) / sceneHeight);
							}
							else if (p[1] == 'middle') {
								start = ((top + (viewportHeight / 2)) / sceneHeight);
							}
							else if (p[1] == 'bottom') {
								start = (top / sceneHeight);
							}
						}
						else if (p[0] == 'bottom') {
							if (p[1] == 'top') {
								start = ((bottom + viewportHeight) / sceneHeight);
							}
							else if (p[1] == 'middle') {
								start = ((bottom + (viewportHeight / 2)) / sceneHeight);
							}
							else if (p[1] == 'bottom') {
								start = (bottom / sceneHeight);
							}
						}
					}
					else {
						start = start / $(this.scene.element).height();
					}
				}

				if (end) {
					if (typeof (end) == 'string' && end.indexOf('%') > -1) {
						end = parseFloat(end) / 100;
					}
					else if (typeof (end) == 'string' && end.indexOf('@') > -1) {
						var sceneTop = $(this.scene.element).position().top;
						var top = $(this.element).offset().top - sceneTop;
						var bottom = top + $(this.element).height();
						//console.log(start + ' top: ' + top + ' bottom: ' + bottom + ' sceneHeight: ' + sceneHeight);
						var p = end.split('@');
						if (p[0] == 'top') {
							if (p[1] == 'top') {
								end = ((top + viewportHeight) / sceneHeight);
							}
							else if (p[1] == 'middle') {
								end = ((top + (viewportHeight / 2)) / sceneHeight);
							}
							else if (p[1] == 'bottom') {
								end = (top / sceneHeight);
							}
						}
						else if (p[0] == 'bottom') {
							if (p[1] == 'top') {
								end = ((bottom + viewportHeight) / sceneHeight);
							}
							else if (p[1] == 'middle') {
								end = ((bottom + (viewportHeight / 2)) / sceneHeight);
							}
							else if (p[1] == 'bottom') {
								end = (bottom / sceneHeight);
							}
						}
					}
					else {
						end = end / $(this.scene.element).height();
					}
				}
			}

			this.Qs[q] = {
				'id': $(this.element).attr('id') + '.' + q,
				'direction': direction,
				'starts': start,
				'ends': end,
				'easing': easing,
				'startCSS': startCSS,
				'endCSS': endCSS,
				'onStart': onStart,
				'onEnd': onEnd,
				'running': false,
				'progress': 0.0,
				'index': 1
			}

			//console.log(this.Qs[q].id + ' direction:' + this.Qs[q].direction + ' starts:' + this.Qs[q].starts + ' ends:' + this.Qs[q].ends);
		}

		this.scene.wrapper.recalculateDone();
	};

	this.startScene = function (scrollSate) {
		this.act(scrollSate);
	};

	this.endScene = function (scrollSate) {
		this.act(scrollSate);
	};

	this.performingQs = function (scrollState) {

		var inQs = [];

		var ql = this.qList.slice(0);
		if (scrollState.directionY < 0) {
			ql.reverse();
		}

		for (var i = 0; i < ql.length; i++) {
			var theQ = ql[i];

			var q = this.Qs[theQ];

			var inQ = false;

			if (q.direction === 'x') {
				inQ = (scrollState.scenePercentX >= q.starts && scrollState.scenePercentX <= q.ends);
			}
			else {
				inQ = (scrollState.scenePercentY >= q.starts && scrollState.scenePercentY <= q.ends);
			}

			//console.log(q.id + ' ' + inQ);

			if (inQ) {
				inQs.push(q);
				if (!q.running) {
					this.enterQ(q, scrollState)
					q.running = true;
				}
			}
			else {
				if (q.running) {
					inQs.push(q);
					this.exitQ(q, scrollState)
					q.running = false;
				}
				else {
					// check for teleportation
					if (q.direction === 'x') {
						if (scrollState.directionX < 0 && scrollState.scenePercentX < q.starts && q.progress != 0) {
							//console.log('-teleport? ' + q.id + ' ' + scrollState.scenePercentX + '<' + q.starts + ' progress: ' + q.progress);
							inQs.push(q);
						}
						if (scrollState.directionX > 0 && scrollState.scenePercentX > q.ends && q.progress != 1) {
							//console.log('+teleport? ' + q.id + ' ' + scrollState.scenePercentX + '>' + q.ends + ' progress: ' + q.progress);
							inQs.push(q);
						}
					}
					else {
						if (scrollState.directionY < 0 && scrollState.scenePercentY < q.starts && q.progress > 0) {
							//console.log('-teleport? ' + q.id + ' ' + scrollState.scenePercentY + '<' + q.starts + ' progress: ' + q.progress);
							inQs.push(q);
						}
						if (scrollState.directionY > 0 && scrollState.scenePercentY > q.ends && q.progress < 1) {
							//console.log('+teleport? ' + q.id + ' ' + scrollState.scenePercentY + '>' + q.ends + ' progress: ' + q.progress);
							inQs.push(q);
						}
					}
				}
			}
		}

		return inQs;
	};

	this.enterQ = function (q, scrollState) {
		var doit = q.onStart;
		if (doit) {
			var callback;
			var s = 'callback = function() {' + doit + '}';
			eval(s);
			callback.apply(this);
		}
	};

	this.exitQ = function (q, scrollState) {
		var doit = q.onEnd;
		if (doit) {
			var callback;
			var s = 'callback = function() {' + doit + '}';
			eval(s);
			callback.apply(this);
		}
	};

	this.act = function (scrollState) {
		//console.log('act ' + $(this.element).attr('id'));
		var newCSS = {};

		var inQs = this.performingQs(scrollState);

		for (var i = 0; i < inQs.length; i++) {
			this.performQ(inQs[i], newCSS, scrollState);
		}

		var frame = function (element, css) {
			return function () {
				element.css(css)
			}
		}($(this.element), newCSS);

		queueAnimation(frame);
	};

	this.performQ = function (performingQ, newCSS, scrollState) {
		var scenePercent, direction, qPercent, qDuration;

		if (performingQ.direction === 'y') {
			if (performingQ.starts || performingQ.ends) {
				scenePercent = scrollState.scenePercentY;
				direction = scrollState.directionY;
				qPercent = scenePercent;
				qDuration = performingQ.ends - performingQ.starts;
				qPercent = (scenePercent - performingQ.starts) / qDuration;
			}
		}
		else {
			if (performingQ.starts || performingQ.ends) {
				scenePercent = scrollState.scenePercentX;
				direction = scrollState.directionX;
				qPercent = scenePercent;
				qDuration = performingQ.ends - performingQ.starts;
				qPercent = (scenePercent - performingQ.starts) / qDuration;
			}
		}

		if (qPercent < 0) {
			qPercent = 0;
		}
		if (qPercent > 1) {
			qPercent = 1;
		}

		if (qPercent === 1) {
			//console.log('performQ ' + performingQ.id + ' ' + qPercent);
		}

		if (qPercent === 0) {
			//console.log('performQ ' + performingQ.id + ' ' + qPercent);
		}

		performingQ.progress = qPercent;

		for (var property in performingQ.startCSS) {

			var regexNumeric = /[\-+]?[\d]*\.?[\d]+/g;
			var startvals = [];
			var endvals = [];
			var format;

			var format = performingQ.startCSS[property].replace(regexNumeric, function (n) {
				startvals.push(+n);
				return '{?}';
			});
			format = performingQ.endCSS[property].replace(regexNumeric, function (n) {
				endvals.push(+n);
				return '{?}';
			});

			var regexPlaceholder = /\{\?\}/;
			var result = format;
			for (var j = 0; j < startvals.length; j++) {
				var delta = endvals[j] - startvals[j];
				var origin = parseFloat(startvals[j]);

				qPercent = $.easing[performingQ.easing](qPercent, qPercent * qDuration, 0, 1, qDuration);

				var value = origin + (delta * qPercent);

				if (performingQ.startCSS[property].match(/rgb\(/)) {
					value = Math.ceil(value);
				}

				result = result.replace(regexPlaceholder, value);
			}

			newCSS[property] = result;

			//console.log(property + ':' + result);
		}

		if (this.attachedTo && this.attachedTo.act) {
			this.attachedTo.act(qPercent, direction);
		}
	}
};

$.fn.parallaxWrapper = GetJQueryPlugin('parallaxWrapper', parallaxWrapper);
$.fn.parallaxScene = GetJQueryPlugin('parallaxScene', parallaxScene);
$.fn.parallaxActor = GetJQueryPlugin('parallaxActor', parallaxActor);

export {
	parallaxWrapper, parallaxScene, parallaxActor
}

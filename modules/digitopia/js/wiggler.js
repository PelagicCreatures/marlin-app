// digitopia/wiggler.js - digitopia.js element animation controller
// status: api stable
// version: 2.0

/*
    Copyright (C) 2014 Michael Rhodes

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

function wiggler(elem, motion) {
	this.element = $(elem);

	this.options = undefined;

	this.animation = motion;
	this.pcnt = 0;
	this.lastpcnt = 0;
	var self = this;
	this.cached = false;

	var paused = true;

	var animationQueue = [];
	var pendingAnimationFrame = undefined;

	function queueAnimation(frame) {
		if (!paused) {
			requestAnimationFrame(frame);
		}
	};

	this.newAnimation = function (motion) {
		this.animation = motion;
		this.cached = false;
		this.prepare();
	};

	this.start = function () {
		this.prepare();

		$(window).focus(function () {
			if (self.pcnt < 1) {
				if (self.options) {
					paused = false;
					queueAnimation(function () {
						self.starts = Date.now() - (self.options.duration * self.pcnt);
						queueAnimation(function () {
							self.timer();
						});
					});
				}
			}
		});

		$(window).blur(function () {
			paused = true;
		});

		this.element.on('play', function (e, options) {
			if (e.target == this) {
				self.options = options;
				self.resume();
			}
		});

		this.element.on('pause', function (e, options) {
			if (e.target == this) {
				paused = true;
			}
		});


		this.element.on('scrub', function (e, options) {
			if (e.target == this) {
				self.options = options;
				self.pcnt = self.options.time / self.options.duration;
				self.pcnt = Math.round(self.pcnt * 10000) / 10000;
				if (self.pcnt != self.lastpcnt) {
					self.action();
					self.lastpcnt = self.pcnt;
				}
			}
		});
	};

	this.stop = function () {
		paused = true;
		this.element.off('play');
		this.element.off('pause');
		this.element.off('scrub');
	};

	this.resume = function () {
		paused = false;
		queueAnimation(function () {
			self.pcnt = 0;
			self.cached = false;
			self.prepare();
			self.starts = Date.now();
			queueAnimation(function () {
				self.timer();
			});
		});
	};

	this.timer = function () {
		if (!paused) {
			var now = Date.now();
			this.pcnt = (now - this.starts) / this.options.duration;
			if (this.options.direction == -1) {
				this.pcnt = 1 - this.pcnt;
			}
			if (this.pcnt < 0) {
				this.pcnt = 0;
			}
			if (this.pcnt > 1) {
				this.pcnt = 1;
			}

			this.pcnt = Math.round(this.pcnt * 10000) / 10000;

			if (this.pcnt != this.lastpcnt) {
				this.action();
				this.lastpcnt = this.pcnt;

				//console.log(this.pcnt);
			}

			if (this.pcnt > 0 && this.pcnt < 1) {
				queueAnimation(function () {
					self.timer();
				});
			}
			else {
				if (this.options.onComplete) {
					this.options.onComplete();
				}
				if (this.options.loop) {
					this.options.direction = this.options.direction * -1;
					this.start();
				}
			}
		}
	};

	this.action = function () {
		//console.log('action ' + this.pcnt);
		for (var q = 0; q < this.animation.quelist.length; q++) {
			this.performQue(this.animation.quelist[q]);
		}
	};

	this.prepare = function () {
		if (!this.cached) {
			this.cached = true;
			var regexNumeric = /[\-+]?[\d]*\.?[\d]+/g;
			for (q = 0; q < this.animation.quelist.length; q++) {
				var que = this.animation.quelist[q];
				que.frame_in_progress = undefined;
				if (que.keyframes) {
					for (var i = 0; i < que.keyframes.length; i++) {
						que.keyframes[i].cached = {};
						for (var property in que.keyframes[i].css) {
							que.keyframes[i].cached[property] = {
								vals: []
							};
							var format = que.keyframes[i].css[property].replace(regexNumeric, function (n) {
								que.keyframes[i].cached[property].vals.push(+n);
								return '{?}';
							});

							que.keyframes[i].cached[property].format = format;
						}
					}
				}
			}
		}
	};

	this.doTrigger = function (element, trigger) {
		if (!paused) {
			if (trigger.css) {
				$(element).css(trigger.css);
			}

			if (trigger.callback) {
				trigger.callback.call();
			}
		}
	};


	this.performQue = function (que) {
		if (que.triggers && que.triggers.length) {
			for (var i = 0; i < que.triggers.length; i++) {
				var trigger = que.triggers[i];
				if (self.options.direction == -1) {
					if (this.pcnt <= trigger.percent / 100) {
						if (!trigger.firedReverse) {
							trigger.firedReverse = true;
							trigger.firedForward = false;
							self.doTrigger(que.element, trigger.reverse);
						}
					}
				}
				else {
					if (this.pcnt >= trigger.percent / 100) {
						if (!trigger.firedForward) {
							trigger.firedForward = true;
							trigger.firedReverse = false;
							self.doTrigger(que.element, trigger.forward);
						}
					}
				}
			}
		};

		if (que.keyframes && que.keyframes.length) {
			var start = que.keyframes[0].percent / 100;
			var end = que.keyframes[que.keyframes.length - 1].percent / 100;
			var duration = (end - start) * this.options.duration;
			var easing = que.easing;
			var target_frame = undefined;
			var origin_frame = undefined;

			if (this.pcnt >= start && this.pcnt <= end) {
				if (self.options.direction == -1) {
					for (var i = que.keyframes.length - 1; i >= 1; i--) {
						if (this.pcnt <= que.keyframes[i].percent / 100) {
							target_frame = i - 1;
							origin_frame = i;
						}
					}
				}
				else {
					for (var i = 1; i < que.keyframes.length; i++) {
						if (this.pcnt <= que.keyframes[i].percent / 100) {
							target_frame = i;
							origin_frame = i - 1;
							break;
						}
					}
				}


				if (que.keyframes[target_frame].easing) {
					easing = que.keyframes[target_frame].easing;
				}

				var qpcnt = ((this.pcnt * 100) - que.keyframes[origin_frame].percent) / (que.keyframes[target_frame].percent - que.keyframes[origin_frame].percent);
				qpcnt = Math.round(qpcnt * 100) / 100;

				//console.log(this.pcnt, origin_frame, target_frame, qpcnt );

				var newCSS = {};

				var regexNumeric = /[\-+]?[\d]*\.?[\d]+/g;

				for (var property in que.keyframes[origin_frame].css) {

					var format;

					var regexPlaceholder = /\{\?\}/;

					var result = que.keyframes[target_frame].cached[property].format;

					for (var j = 0; j < que.keyframes[target_frame].cached[property].vals.length; j++) {

						var origin = parseFloat(que.keyframes[origin_frame].cached[property].vals[j]);
						var target = que.keyframes[target_frame].cached[property].vals[j];
						var delta = target - origin;

						var value = undefined;

						if (easing) {
							value = $.easing[easing](qpcnt, qpcnt * duration, origin, delta, duration);
						}
						else {
							value = origin + (delta * qpcnt);
						}

						result = result.replace(regexPlaceholder, value);
					}

					newCSS[property] = result;
				}

				var frame = function (element, css) {
					return function () {
						element.css(css)
					}
				}($(que.element), newCSS);

				queueAnimation(frame);

			}

			if (que.frame_in_progress != undefined && target_frame != que.frame_in_progress) { // set final frame state if needed
				//console.log('final',que.keyframes[que.frame_in_progress]);
				var newCSS = que.keyframes[que.frame_in_progress].css;
				que.frame_in_progress = undefined;
				var frame = function (element, css) {
					return function () {
						element.css(css)
					}
				}($(que.element), newCSS);
				queueAnimation(frame);
			}

			que.frame_in_progress = target_frame;
		}
	};
}

$.fn.wiggler = GetJQueryPlugin('wiggler', wiggler);

export {
	wiggler
}

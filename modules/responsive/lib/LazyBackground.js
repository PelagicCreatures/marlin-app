/*
	Responsive images using background-image which always fits image within its container's dimensions

	The image is not loaded until visible in viewport

	<div class="my-container">
		div class="my-responsive-image" data-responsive-class="LazyBackground" data-src="/path-to-image.jpg"></div>
	</div>

	.my-container { width: 30vw; height: 30vh; }

	Style to make background entire image fit within the frame:
	.my-responsive-image {
		width:100%;height:100%;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center center;
	}

	Style to make background image crop to fill the frame:
	.my-responsive-image {
		width:100%;height:100%;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center center;
	}
*/

import {
	ResponsiveElement, registerClass
}
	from './ResponsiveElement'

class LazyBackground extends ResponsiveElement {
	constructor (element, options = {}) {
		super(element, {
			watchViewport: true
		})
	}

	enterViewport () {
		const frame = () => {
			this.element.style.backgroundImage = 'url(' + this.element.getAttribute('data-src') + ')'
			this.destroy() // we're done. That was easy.
		}
		this.queueFrame(frame)
	}
}

registerClass('LazyBackground', LazyBackground)

export {
	LazyBackground
}

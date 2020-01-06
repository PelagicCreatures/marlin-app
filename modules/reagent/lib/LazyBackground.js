/*
	Responsive images impelmented as a background-image which always
	fits image within its container's dimensions

	The image is not loaded until visible in viewport

	<div class="my-container">
		div class="my-responsive-image" data-responsive-class="LazyBackground" data-src="/path-to-image.jpg"></div>
	</div>

	.my-container { width: 30vw; height: 30vh; }
	.my-responsive-image {
		width:100%; height:100%;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center center;
	}

	To make image crop to fill the frame use:
		background-size: cover;

*/

import {
	Reagent, registerReagentClass
}
	from './Reagent'

class LazyBackground extends Reagent {
	constructor (element, options = {}) {
		super(element, {
			watchViewport: true
		})
	}

	enterViewport () {
		super.enterViewport()
		const frame = () => {
			this.element.style.backgroundImage = 'url(' + this.element.getAttribute('data-src') + ')'
			this.destroy() // We're done. That was easy.
		}
		this.queueFrame(frame)
	}
}

registerReagentClass('LazyBackground', LazyBackground)

export {
	LazyBackground
}

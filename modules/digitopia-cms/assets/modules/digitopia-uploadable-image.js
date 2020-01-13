import $ from 'jquery'

import {
	Sargasso, registerSargassoClass
}
	from '@pelagiccreatures/sargasso'

class uploadableImage extends Sargasso {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)
		this.columnName = this.jqElement.data('column-name')
		this.maxHeight = this.jqElement.data('max-height') ? this.jqElement.data('max-height') : 200
		this.maxWidth = this.jqElement.data('max-width') ? this.jqElement.data('max-width') : 200
		this.sendResized = this.jqElement.data('send-resized')
		this.input = $(this.jqElement.data('target'))

		this.previewElement = $('[data-name="' + this.columnName + '-preview"]')
		this.widthElement = $('[data-name="' + this.columnName + '-width"]')
		this.heightElement = $('[data-name="' + this.columnName + '-height"]')
		this.metadata = this.jqElement.closest('.form-group').find('.metadata')
	}

	start () {
		super.start()
		this.jqElement.on('change', (e) => {
			this.processImage(e.target.files[0])
		})
	};

	sleep () {
		this.jqElement.off('change')
		super.sleep()
	};

	processImage (file) {
		var reader = new FileReader()

		// make a thumbnail once data is loaded
		reader.onload = (readerEvent) => {
			var image = new Image()
			image.onload = (imageEvent) => {
				var canvas = document.createElement('canvas')
				var w = image.width
				var h = image.height
				if (w > h) {
					if (w > this.maxWidth) {
						h *= this.maxWidth / w
						w = this.maxWidth
					}
				} else {
					if (h > this.maxHeight) {
						w *= this.maxHeight / h
						h = this.maxHeight
					}
				}
				canvas.width = w
				canvas.height = h
				canvas.getContext('2d').drawImage(image, 0, 0, w, h)
				var dataURL = canvas.toDataURL('image/jpeg', 1.0)
				this.previewElement.empty().append('<img src="' + dataURL + '">')
				this.metadata.empty().html('<strong><em>New image</em></strong> w: <strong>' + this.naturalWidth + '</strong> h: <strong>' + this.naturalHeight + '</strong>')

				if (this.sendResized) {
					this.input.val(dataURL)
					this.widthElement.val(w)
					this.heightElement.val(h)
				} else {
					this.widthElement.val(this.naturalWidth)
					this.heightElement.val(this.naturalHeight)
				}
			}

			// pipe the file data into the image
			image.src = readerEvent.target.result

			if (!this.sendResized) {
				this.input.val(readerEvent.target.result)
			}
		}

		// start reading the file
		reader.readAsDataURL(file)
	}
}

registerSargassoClass('uploadableImage', uploadableImage)

export {
	uploadableImage
}

import {
	ResponsiveElement, registerClass
}
	from './ResponsiveElement'

class HijaxLoader extends ResponsiveElement {
	constructor (element, options = {}) {
		options.watchDOM = true
		super(element, options)
		this.mortal = false
		this.excludeRegex = new RegExp('^(//|http|javascript|mailto|#)', 'i')
	}

	start () {
		super.start()
		window.addEventListener('popstate', (e) => {
			this.watchPopState(e)
		}, false)
	}

	DOMChanged () {
		super.DOMChanged()
		this.hijaxLinks()
	}

	watchPopState (e) {
		this.loadPage(location.pathname + location.search)
	}

	hijaxLinks () {
		const links = this.element.getElementsByTagName('a')
		for (let i = 0; i < links.length; i++) {
			const link = links[i]
			const href = link.getAttribute('href')
			if (href &&
				!link.getAttribute('data-hijaxed') &&
				!link.getAttribute('target') &&
				!link.getAttribute('data-no-hijax') &&
				!this.excludeRegex.exec(href)
			) {
				link.setAttribute('data-hijaxed', true)
				link.addEventListener('click', (e) => {
					e.preventDefault()
					this.setPage(href)
				}, false)
			}
		}
	}

	setPage (url) {
		this.notifyElement(document.body, 'newPage', [location.pathname + location.search, url])
		history.pushState(null, null, url)
		this.watchPopState()
	}

	loadPage (url) {
		if (this.options.onExitPage) {
			this.options.onExitPage()
		}
		var xhr = new XMLHttpRequest()
		xhr.open('GET', url)
		xhr.onreadystatechange = this.options.onLoading
		xhr.onload = () => {
			if (xhr.status === 301 || xhr.status === 302 || xhr.getResponseHeader('x-digitopia-hijax-location')) {
				var location = xhr.getResponseHeader('x-digitopia-hijax-location')
				this.setPage(location)
			} else if (xhr.status === 200) {
				scrollTo(0, 0)
				this.mergePage(xhr.responseText)
			} else {
				var flashLevel = xhr.getResponseHeader('x-digitopia-hijax-flash-level') || 'danger'
				var flashMessage = xhr.getResponseHeader('x-digitopia-hijax-flash-message') || xhr.statusText
				if (!flashMessage) {
					flashMessage = 'Could not connect to server.'
				}
				if (this.options.onError) {
					this.options.onError(flashLevel, flashMessage)
				} else {
					alert('Error loading page: ' + flashMessage)
				}
			}
		}
		xhr.send()
	}

	mergePage (html) {
		var doc = html.split(/(<body[^>]*>|<\/body>)/ig)
		var fragment = makeFragment(doc[2])
		var containers = document.querySelectorAll('[data-hijax]')
		for (let i = 0; i < containers.length; i++) {
			const container = containers[i]
			const id = containers[i].getAttribute('id')
			const replace = fragment.getElementById(id)
			const frame = () => {
				container.parentNode.replaceChild(replace, container)
				if (this.options.onExitPage) {
					this.options.onEnterPage()
				}
			}
			this.queueFrame(frame)
		}
	}
}

registerClass('HijaxLoader', HijaxLoader)

// shims for borked browsers
// =========================

const makeFragment = (html) => {
	if (document.createRange && document.createRange().createContextualFragment) {
		return document.createRange().createContextualFragment(html)
	}
	const fragment = document.createDocumentFragment()
	const div = document.createElement('div')
	div.insertAdjacentHTML('afterBegin', html)
	fragment.appendChild(div)
	return fragment
}

export {
	HijaxLoader
}

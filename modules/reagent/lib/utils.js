const _hasClass = (element, cssClass) => {
	const className = element.className || ''
	const classes = className.split(' ')
	return classes.indexOf(cssClass) !== -1
}

const _addClass = (element, cssClass) => {
	const className = element.className || ''
	const classes = className.split(' ')
	if (classes.indexOf(cssClass) === -1) {
		classes.push(cssClass)
		element.className = classes.join(' ')
	}
}

const _removeClass = (element, cssClass) => {
	const className = element.className || ''
	const classes = className.split(' ')
	if (classes.indexOf(cssClass) !== -1) {
		classes.splice(classes.indexOf(cssClass), 1)
		element.className = classes.join(' ')
	}
}

const _isVisible = (element) => {
	return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
}

const _inViewPort = (element) => {
	const rect = element.getBoundingClientRect()
	const visible = _isVisible(element)
	const aboveTheTop = (rect.bottom < 0)
	const belowTheFold = (rect.top > (window.innerHeight || document.documentElement.clientHeight))

	return (visible && !belowTheFold && !aboveTheTop)
}

const elementTools = {
	hasClass: _hasClass,
	addClass: _addClass,
	removeClass: _removeClass,
	isVisible: _isVisible,
	inViewPort: _inViewPort
}

export {
	elementTools
}

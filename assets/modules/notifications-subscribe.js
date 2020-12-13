import {
	Sargasso, utils
}
	from '@pelagiccreatures/sargasso'

import * as CMSUtils from '@pelagiccreatures/marlin/assets/modules/utils'

const saveSubscription = async subscription => {
	const response = await fetch('/notifications/subscribe', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(subscription)
	})

	const res = await response.json()

	return res
}

class NotificationsSubscribe extends Sargasso {
	constructor (element, options) {
		super(element, options)
		this.notificationService = null

		this.enabled = false
	}

	start () {
		super.start()
		navigator.serviceWorker.getRegistration('/').then(reg => {
			if (reg && reg.pushManager) {
				if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
					this.setup(reg)
				}
			}
		})
	}

	setup (reg) {
		this.addClass('shown')
		this.clickHandler = async (e) => {
			const permission = await window.Notification.requestPermission()
			if (permission === 'granted') {
				reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: publicOptions.NOTIFICATIONS_PK
				}).then((sub) => {
					try {
						saveSubscription(sub).then((response) => {
							console.log(response)
							CMSUtils.flashAjaxStatus('info', 'Notifications Enabled')
						}).catch((err) => {
							console.log(err)
							CMSUtils.flashAjaxStatus('info', 'Could not save subscription')
						})
					} catch (err) {
						console.log(err)
						CMSUtils.flashAjaxStatus('info', 'Could not Subscribe')
					}
				})
			} else {
				CMSUtils.flashAjaxStatus('info', 'Notifications Disabled')
			}
		}
		this.element.addEventListener('click', this.clickHandler)
	}

	sleep () {
		if (this.clickHandler) {
			this.element.removeEventListener('click', this.clickHandler)
		}
		super.sleep()
	}
}

utils.registerSargassoClass('NotificationsSubscribe', NotificationsSubscribe)

export {
	NotificationsSubscribe
}

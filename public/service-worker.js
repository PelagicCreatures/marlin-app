const namespace = 'assets-v2'

importScripts('/dist/js/workbox-sw.js')

self.addEventListener('install', (event) => {
	console.log('service worker install')
	self.skipWaiting()
	event.waitUntil(
		caches.open(namespace).then((cache) => {
			return cache.addAll(
				[
					'/dist/css/marlinapp.min.css',
					'/dist/js/marlinapp.iife.js'
				]
			)
		})
	)
})

self.addEventListener('activate', function (event) {
	console.log('service worker activate')
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (namespace !== cacheName && cacheName.startsWith('assets-v')) {
						return caches.delete(cacheName)
					}
				})
			)
		})
	)
})

workbox.setConfig({
	debug: false,
	modulePathPrefix: '/dist/js/'
})

workbox.routing.registerRoute(
	/\/$/,
	new workbox.strategies.NetworkFirst({
		cacheName: namespace
	})
)

workbox.routing.registerRoute(
	/\.(js|css|eot|ttf|woff|woff2)$/,
	new workbox.strategies.NetworkFirst({
		cacheName: namespace
	})
)

workbox.routing.registerRoute(
	/\.(png|jpg|jpeg|svg|gif|ico)$/,
	new workbox.strategies.CacheFirst({
		cacheName: namespace,
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 150,
				maxAgeSeconds: 7 * 24 * 60 * 60,
				purgeOnQuotaError: true
			})
		]
	})
)

self.addEventListener('push', (event) => {
	console.log('push event', event)
	const title = 'Bandages for the Bleeding Edge'
	const options = {
		body: event.data.text(),
		icon: 'http://localhost:3000/icons/icon-72x72.png'
	}
	event.waitUntil(self.registration.showNotification(title, options))
})

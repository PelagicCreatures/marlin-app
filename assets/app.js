// import any ES6 modules you need here and they will get bundled in

import {
	boot,
	jQuery,
	Cookies,
	async
}
from '../modules/digitopia-cms/assets/app'

// export any ES6 modules you need in your ES5 scripts
// webpack will expose things exported here
// as App.XXX in the global namespace
export {
	boot,
	jQuery,
	Cookies,
	async
}

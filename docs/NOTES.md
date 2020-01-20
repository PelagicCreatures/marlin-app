## using this project as a template
git remote add template https://github.com/antiSocialNet/user-boilerplate.git
git fetch --all
git merge template/master --allow-unrelated-histories

Any changes to files in this project can then be merged into your project

# aws instance
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_12.x | sudo -E bash -
sudo yum install -y nodejs
sudo yum install -y git
sudo yum install -y sqlite-devel
clone repository
npm install
npm run test

## Development
rollup -c rollup.config.js (experimental es6 bundle)

npm run watch
define config/local.js (see config/config-example.js)
npm run debug
http://localhost:3000

NOTE: the first user created will have superuser admin permissions

As you make changes in assets/*  webpack and grunt will recompile the client side bundles so all you have to do is reload the page to see changes

PORT=80 BASIC_AUTH_USER_NAME=LGBT BASIC_AUTH_PASSWORD=dot nohup npm run local &

### Environment Variables
NODE_ENV:
PORT:
DB_DIALECT:
DB_HOST:
DB_USER:
DB_PASSWD:
DB_DBNAME:
COOKIE_DOMAIN:
PUBLIC_HOST:
RECAPTCHA_PUBLIC:
RECAPTCHA_SECRET:
STRIPE_PUBLIC:
STRIPE_SECRET:
STRIPE_YEARLY:
STRIPE_MONTHLY:
BASIC_AUTH_USER_NAME:
BASIC_AUTH_PASSWORD:


### Testing stripe webook (stripe cli https://github.com/stripe/stripe-cli)
stripe listen --forward-to localhost:3000/api/users/stripe-webhook

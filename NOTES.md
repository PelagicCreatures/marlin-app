# aws instance
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_12.x | sudo -E bash -
sudo yum install -y nodejs
sudo yum install -y git
sudo yum install -y sqlite-devel
clone repository
npm install
npm run test
npm run watch
npm run debug
http://localhost:3000

## Development
install mysql and create tables (see below)
`npm install` install packages
`npm run watch &` run webpack in watch mode
`grunt devel &` run grunt in watch mode
`NODE_ENV=localdev DEBUG=antisocial* npm start` start web services

got to http://localhost:3000 in your browser and create a login

NOTE: the first user created will have superuser admin permissions

As you make changes in assets/ css and js grunt and webpack will recompile client side bundles.

### Environment Variables
NODE_ENV:
TESTING:
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

### client side pug
```
pug --client --no-debug --pretty --out working/templates --name pugTemplate  views/shared/test.pug

pug --client --no-debug --pretty --out working/templates --name confirmDialogTemplate  views/shared/confirm-dialog.pug
```

### Testing stripe webook (stripe cli https://github.com/stripe/stripe-cli)
stripe listen --forward-to localhost:3000/api/users/stripe-webhook

### Testing DB - mysql running on localhost

```
NODE_ENV=local npx sequelize-cli db:migrate
NODE_ENV=local npx sequelize-cli db:seed:all
```

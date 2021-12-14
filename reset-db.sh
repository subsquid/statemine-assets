set -e
yarn run build
rm -rf db/migrations/*.js
npm run db:reset
npm run db:create-migration -n "statemine" 
npm run db:migrate

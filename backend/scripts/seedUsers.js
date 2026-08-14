require('dotenv').config();

const { runSeed } = require('./seedData');

runSeed({ usersOnly: true });

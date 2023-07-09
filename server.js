
'use strict'

require('module-alias/register');
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cron = require('node-cron');
const {updateInProgressTasks} = require('./src/utils/tasks-functions.js')

cron.schedule('* * * * *', async () => {
  console.log('Checking task state every minute...');  
  await updateInProgressTasks();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const routes = require('./src/routes/index.js')(app);

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
});
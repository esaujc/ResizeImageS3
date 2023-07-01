
'use strict'

require('module-alias/register');
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const routes = require('./src/routes/index.js')(app);

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
});
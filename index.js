
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/api', (req, res) => {
    res.send('Hello World');
});

app.get('/api/task', (req, res) => {
    let resp = {
       taskId: '10',
       createDate: new Date(),
       url: req.url
   };

   res.send(resp);
});
 

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
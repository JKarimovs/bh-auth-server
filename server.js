// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Define port number the server will be running on
const PORT = process.env.PORT || 3000;

// We specify the routes file
const api = require('./routes/api');

// Instantiate the Express Server
const app = express();

// Use Cors middleware
app.use(cors());

// We specify body parser to use Json data
app.use(bodyParser.json());

// Now we use the API route we created in api.js file
app.use('/api', api);

// Now lets test a GET request
app.get('/', function(req, res){
    res.send("Hello From Server");
})

// Now we listen to requests on the specified port
app.listen(PORT, function(){
    console.log("Server running on localhost:" + PORT);
})
/*
NODE REST API
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const config = require('./config');
const fs = require('fs');

// Instantiate HTTP server
var httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort}`)
});

// Instantiate HTTPS server
var httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort}`);
});

const unifiedServer = (req, res) => {
  // Get the URL and parse it
  const parsedURL = url.parse(req.url, true);

  // Get the path from URL
  const path = parsedURL.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedURL.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload
  const decoder = new StringDecoder('utf8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found use the 'Not Found' handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to handler
    var data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler or default to 404
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // Use the payload called back by the handler or default to an empty object
      payload = typeof(payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('Returning this response: ', statusCode, payloadString);
    });
  });
}

// Define the handlers
const handlers = {};

// Hello World Handler
handlers.hello = (data, callback) => {
  // callback an HTTP status code and a payload object
  callback(200, {'Hello': 'Hello World'})
}

handlers.notFound = (data, callback) => {
  callback(404);
}

// Define the request router

const router = {
  hello: handlers.hello
}
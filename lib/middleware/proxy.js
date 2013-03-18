'use strict';

var fork = require('child_process').fork
  , net = require('net');

// Factory function for the middleware.
module.exports = function (options) {
  // Give name to middleware factory.
  return function Proxy(irc) {

    // Save client settings.
    options.remoteAddress = irc.config.address;
    options.remotePort = irc.config.port;

    // Tell client to connect to proxy.
    irc.set('address', options.address);
    irc.set('port', options.port);

    // Run the proxy.
    var cp = fork(__filename, ['child'], {
      stdio: 'ignore'
      //detached: true
    });
    cp.unref();

    cp.send({type: 'config', config: options});

    return {
      name: 'Proxy',
      command:'PROXY',
      output: function (message, next) {
        switch (message.args[0]) {
        case 'PASS':
          irc.net.write(options.password);
          break;
        case 'SUCCESS':
          console.log('Successfully authenticated with proxy.');
          break;
        case 'FAILURE':
          throw Error('Failed to connect to proxy!');
        }
      }
    };
  };
};


function IRCProxy() {
  var self = this;

  process.on('message', function (message) {
    if (message.type === 'config') {
      self.config = message.config;
      self.listen();
    }
  });

  self.irc = new net.Socket();
}

IRCProxy.prototype.listen = function () {
  console.log('Proxy connecting...');
  var self = this;

  self.server = net.createServer(function (client) {
    if (self.client) { client.end(':NONE PROXY BUSY'); }
    self.client = client;
    client.setEncoding('utf8');
    client.authenticated = false;
    client.on('data', function (data) {
      if (!client.authenticated) {
        if (data === self.config.password) {
          client.authenticated = true;
          client.write(':NONE PROXY SUCCESS');
          self.irc.pipe(client);
          self.connect();
        } else {
          client.write(':NONE PROXY FAILURE');
        }
      }
    });
    client.write(':NONE PROXY PASS');
  });
  self.server.listen(self.config.port, self.config.address);
};

IRCProxy.prototype.connect = function () {
  // Connect to IRC.
  this.irc.connect(this.config.remotePort, this.config.remoteAddress);

  this.irc.setEncoding('utf8');

  this.irc.on('data', function (data) {
    console.log('PROXY', data);
  });
};

// This is a forked process.
if (process.argv.length > 2) {
  var proxy = new IRCProxy();
}
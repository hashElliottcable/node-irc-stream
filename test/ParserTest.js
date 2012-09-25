'use strict';

var parser = require('../lib/middleware/parse')
  , assert = require('assert')
  , crypto = require('crypto');

module.exports = {
  'A Parser': {
    topic: parser,
    'parsing 001 message': {
      topic: function (parser) {
        var cb = this.callback;
        parser.once('data', function (data) {
          cb(null, data);
        });
        parser.write(':lindbohm.freenode.net 001 streamBot1337 :Welcome to the freenode Internet Relay Chat Network streamBot1337\r\n');
      },
      'parses 001 message': function (data) {
        assert.deepEqual(data, {
          prefix: 'lindbohm.freenode.net',
          server: 'lindbohm.freenode.net',
          command: '001',
          rawCommand: '001',
          commandType: 'normal',
          args: [ 'streamBot1337',
                  'Welcome to the freenode Internet Relay Chat Network streamBot1337' ]
        });
      }
    },
    'parsing random message': {
      topic: function (parser) {
        var cb = this.callback;
        parser.once('data', function () {
          cb(null);
        });
        parser.write(crypto.randomBytes(256).toString() + '\r\n');
      },
      'does not crash': function () {
        assert.ok(true);
      }
    }
  }
};
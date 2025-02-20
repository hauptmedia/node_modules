(function() {
  "use strict";
  var create, defaultOrigins, defaultResources, defaults, escapeRegExp, isMSIE, msiePattern, operaPattern, selectNotEmpty, url;
  url = require("url");
  defaults = {
    origins: [],
    methods: ['HEAD', 'GET', 'POST'],
    headers: ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept'],
    credentials: false,
    resources: []
  };
  defaultResources = [
    {
      pattern: '/'
    }
  ];
  defaultOrigins = ['*'];
  msiePattern = /MSIE/i;
  operaPattern = /Opera/i;
  isMSIE = function(req) {
    var agent;
    agent = req.headers['user-agent'];
    if (agent == null) {
      return false;
    }
    if (agent.match(msiePattern) && !agent.match(operaPattern)) {
      return true;
    } else {
      return false;
    }
  };
  selectNotEmpty = function(a, b) {
    if (a != null ? a.length : void 0) {
      return a;
    }
    if (b != null ? b.length : void 0) {
      return b;
    }
    return false;
  };
  escapeRegExp = function(str) {
    return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
  create = function(config) {
    var corsHandler;
    config = config || {};
    config.origins = config.origins || defaults.origins.slice();
    config.methods = config.methods || defaults.methods.slice();
    config.headers = config.headers || defaults.headers.slice();
    config.credentials = config.credentials || false;
    config.resources = config.resources || defaults.resources.slice();
    if (config.origins != null) {
      config.origins.forEach(function(origin, i) {
        return config.origins[i] = origin.toLowerCase();
      });
    }
    corsHandler = function(req, res, next) {
      var origin, resource, resourceHandler, resources;
      origin = (req.headers.origin || '').toLowerCase() || void 0;
      resource = url.parse(req.url).pathname;
      resources = selectNotEmpty(config.resources, defaultResources);
      resourceHandler = function(obj, i) {
        var headers, matchOrigin, methods, origins, pattern;
        pattern = obj.pattern;
        methods = selectNotEmpty(obj.methods, config.methods);
        headers = selectNotEmpty(obj.headers, config.headers);
        origins = selectNotEmpty(obj.origins, config.origins) || defaultOrigins;
        origin = req.headers.origin;
        matchOrigin = function(originPattern, i) {
          if (typeof originPattern === 'string') {
            if (originPattern === '*') {
              return true;
            }
            originPattern = RegExp('^' + escapeRegExp(originPattern) + '(:|$)');
            origins[i] = originPattern;
          }
          if (origin.match(originPattern)) {
            return true;
          } else {
            return false;
          }
        };
        if (typeof pattern === 'string') {
          pattern = RegExp('^' + escapeRegExp(pattern));
          resources[i].pattern = pattern;
        }
        if (!resource.match(pattern)) {
          return false;
        }
        if (!origins.some(matchOrigin)) {
          return false;
        }
        if (methods.indexOf(String(req.headers['access-control-request-method'] || req.method).toUpperCase()) === -1) {
          if (req.method.toUpperCase() !== 'OPTIONS') {
            return false;
          }
        }
        if (isMSIE(req)) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        } else {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
        if (typeof credentials !== "undefined" && credentials !== null) {
          res.setHeader('Access-Control-Allow-Credentials', "true");
        }
        if (headers.length) {
          res.setHeader('Access-Control-Allow-Headers', headers.join(', '));
          res.setHeader('Access-Control-Expose-Headers', headers.join(', '));
        }
        if (methods.length) {
          res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
        }
        return true;
      };
      if (typeof origin === 'undefined') {
        return next();
      }
      if (!resources.some(resourceHandler)) {
        return next();
      }
      if (req.method.match(/^OPTIONS$/i)) {
        return res.end();
      }
      return next();
    };
    return corsHandler;
  };
  module.exports = create;
}).call(this);

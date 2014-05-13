var http = require('http'),
	url = require('url');

var middleware = exports = module.exports;

middleware.createServer = function() {
	
	/**
	 * app object will be used to create the underlined http server
	 */
	function app(req, res, next) {
		app.handler(req, res, next);
	}
	
	/**
	 * function to specify a middleware. 
	 *
	 * Binds the particular middleware 'handler' to the particular 'route'.
	 * A middleware is invoked for a request only if route is part of 
	 * the request path. If no value is provided for route, it is assumed to be '/'.
	 *
	 * @param {String|Function} route or handler
	 * @param {Function} handler
	 * @return app
	 */
	app.use = function(route, handler) {
		if ('string' != typeof route) {
			handler = route;
			route = '/';
		}
		if ('/' === route[route.length -1]) {
			route = route.slice(0, -1);
		}
		this.layers.push({route: route, handler: handler});
		return this;
	};
	
	/**
	 * function to handle server requests. 
	 * This in turn invokes all the applicable middleware 
	 * handlers for the given request path
	 */
	app.handler = function(req, res, out) {
		
		var index = 0, layers = this.layers;
		
		function next(err) {
			
			var layer;
			
			layer = layers[index++];
			
			if (!layer) {
				if (out) {
					return out(err);
				}
				if (err) {
					res.statucCode = 500;
					var msg = http.STATUS_CODES[res.statusCode];
					res.setHeader('Content-Type', 'text/html');
					res.setHeader('Content-Length', Buffer.byteLength(msg));
					res.end(msg);
				}
				return;
			}
			
			try {
				var path = url.parse(req.url).pathname;
				if (undefined == path) {
					path = '/';
				}

				if (0 != path.toLowerCase().indexOf(layer.route.toLowerCase()) 
					|| (path.length > layer.route.length && '/' != path[layer.route.length])) {
					return next(err);
				}

				var layerArgLength = layer.handler.length;
				if (err) {
					if (layerArgLength === 4) {
						layer.handler(err, req, res, next);
					} else {
						next(err);
					}
				} else {
					layer.handler(req, res, next);
				}
			} catch (e) {
				next(e);
			}
		}
		next();
	};
	
	/**
	 * Listen for connections
	 */
	app.listen = function() {
		var server = http.createServer(this);
		return server.listen.apply(server, arguments);
	};
	
	app.layers = [];
	
	return app;
};

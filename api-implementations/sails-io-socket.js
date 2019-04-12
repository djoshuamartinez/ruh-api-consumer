const socketIOClient = require("socket.io-client");
const sailsIOClient = require("sails.io.js");
let io;
let configured = false;

function configure(configuration) {
    io = sailsIOClient(socketIOClient);
    io.reconnection = true;
    io.sails.url = configuration.url;

    // Disables a method for getting cookie for
    // cross domains that uses 'window', triggering an
    // error on react native. It defaults to send a JSONP
    // request to the CORS enabled server.
    // (Not sure how they inject script tags here, though)
    io.sails.useCORSRouteToGetCookie = false;
    configured = true;
}

module.exports = {
    caller: (url, method, args, configuration) => {
        return new Promise((resolve, reject) => {
            if (configuration) {
                if (typeof (configuration.url) !== 'string') {
                    reject(new TypeError("sails-io-socket url configuration is not a string."));
                }
            } else {
                reject(new ReferenceError("sails-io-socket configuration wasn't supplied with a url."));
            }
            //const io = sailsIOClient(socketIOClient/*, {pingTimeout: 3000}*/);
            if (!configured) {
                configure(configuration);
            }

            // The sails socket autoconnects when instantiated,
            // any request is queued until connection is available,
            // so we can start our calls without fear.
            io.socket[method](url, args, (data, jwr) => resolve({data, jwr}));
        });
    }
};

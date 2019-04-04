const socketIOClient = require("socket.io-client");
const sailsIOClient = require("sails.io.js");


module.exports = {
    caller: (url, method, args, configuration) => {
        return new Promise((resolve, reject) => {
            if(configuration){
                if(typeof(configuration.url)!=='string') {
                    throw new TypeError("sails-io-socket url configuration is not a string.");
                }
            }
            else{
                throw new ReferenceError("sails-io-socket configuration wasn't supplied with a url.");
            }
            const io = sailsIOClient(socketIOClient);
            io.sails.url = configuration.url;

            // Disables a method for getting cookie for the
            // cross domain that uses 'window', triggering an
            // error on react native. It defaults to send a JSONP
            // request to the CORS enabled server.
            // (Not sure how they inject script tags here, though)
            io.sails.userCORSRouteToGetCookie = false;

            // The sails socket autoconnects when instantiated,
            // any request is queued until connection is available,
            // so we can start our calls without fear.
            io.socket[m](url, args, (data, jwr) => resolve({data, jwr}));
        });
    }
};
const axios = require('axios');

let axiosCaller;
let configured = false;

function configure(configuration) {
    axiosCaller = axios.create({
        ...configuration
    });
    configured = true;
}

module.exports = {
    caller: async (url, method, args, configuration) => {
        if (!configured) {
            configure(configuration);
        }
        if (method === 'get') {
            args = {params: args};
        }
        const response = await axiosCaller[method](url, args);
        return response.data;
    }
};

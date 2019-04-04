const axios = require('axios');

let axiosCaller;

function configure(configuration) {
    axiosCaller = axios.create({
        ...configuration
    });
}

module.exports = {
    caller: async (url, method, args, configuration) => {
        configure(configuration);
        if (method === 'get') {
            args = {params: args};
        }
        const response = await axiosCaller[method](url, args);
        return response.data;
    }
};

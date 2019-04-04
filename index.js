const _ = require('lodash');
let configuration = {};

const apiImplementations = {
    'http': require('./api-implementations/http'),
    'sails-io-socket': require('./api-implementations/sails-io-socket')
};


module.exports = {
    configure: settings => {
        if (!settings) {
            return;
        }
        if (typeof (settings) !== 'object') {
            throw new TypeError('Configuration invalid, object expected.')
        }

        if(typeof settings.configurations!=='object'||typeof settings.routes!=='object'){
            throw new TypeError('Invalid api-consumer configuration. Must have properties "configurations" and "routes" as objects.');
        }
        configuration = chain({
            // defaults
            implementation: 'http',
            method: 'GET',
            inFn: i=>i,
            outFn: i=>i,

            routes: settings.routes,
            implementations: _.merge(
                {
                    // Out of the box implementations
                    ...apiImplementations,

                    // User specified or overriden implementations.
                    ...(settings.implementations && {implementations: settings.implementations}),
                },
                // We merge the given configuration
                _.mapValues(settings.configurations, v => {
                    return {configuration: v};
                })
            ),

        });
    },
    call: async (route, ...args) => {
        let routeSettings;
        try {
            routeSettings = getToLink(configuration, `routes.${route}`);
        } catch (e) {
            throw new ReferenceError(`Couldn't find route ${route} on the configuration.`);
        }
        const implementationName = routeSettings.implementation;
        let implementation;
        try {
            implementation = getToLink(configuration, `implementations.${implementationName}`);
        } catch (e) {
            throw new ReferenceError(`Couldn't find ${implementationName} on the configured implementations.`);
        }
        let implementationConfiguration;
        try {
            implementationConfiguration = getToLink(configuration, `implementations.${implementationName}.configuration`);
        } catch (e) {
            implementationConfiguration = {};
        }
        let routeConfiguration = routeSettings.configuration;
        if(typeof(routeConfiguration) === 'function'){
            routeConfiguration = await routeConfiguration(...args);
        }
        if(! routeConfiguration){
            routeConfiguration = {};
        }

        let url = routeSettings.url;
        if (typeof (url) === 'function') {
            url = url(...args);
        }
        if (typeof (url) !== 'string') {
            throw new TypeError('Given url is not a string or a string returning function.');
        }
        let method = routeSettings.method.toLowerCase();

        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            throw new TypeError(`${method} method not recognized`);
        }

        const rawResult = await implementation.caller(
            url,
            method,
            routeSettings.inFn(...args),
            { ...implementationConfiguration, ...routeConfiguration}
        );

        return routeSettings.outFn(rawResult);
    }
};

const chain = (value, parent = null) => {
    if (typeof value !== 'object' || !value) {
        return value;
    }
    let r = Object.create(parent);
    Object.entries(value).forEach(([k, v]) => r[k] = chain(v, r));
    return r;
};

const getToLink = (object, route) => {
    if (route === '') {
        return object;
    }
    const path = route.split('.');

    try {
        return getToLink(object[path[0]], path.slice(1).join('.'))
    } catch (e) {
        throw new ReferenceError('Requested link unaccesible.');
    }
};

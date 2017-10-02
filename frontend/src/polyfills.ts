import 'core-js/es6';
import 'core-js/es7/reflect';
require('zone.js/dist/zone');

if (process.env.ENV === 'production') {
    // Production
} else {
    // Development and test
    Error.stackTraceLimit = Infinity;
    require('zone.js/dist/long-stack-trace-zone');
}

Object.defineProperty(String.prototype, 'replaceAll', {
    value: function(search: string, replacement: string) {
        const target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    },
});

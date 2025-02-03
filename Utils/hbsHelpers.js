const hbs = require('hbs');
const moment = require('moment');

hbs.registerHelper('multiply', (a, b) => a * b);

hbs.registerHelper('getStatusClass', (status) => {
    if (status === 'Processing') {
        return 'text-bg-warning';
    } else if (status === 'Delivered') {
        return 'text-bg-success';
    } else if (status === 'Cancelled') {
        return 'text-bg-danger';
    } else {
        return 'text-bg-secondary';
    }
});

hbs.registerHelper('map', function (array, options) {
    return array.map(item => options.fn(item)).join('');
});

hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
});

hbs.registerHelper('firstArrayItem', function (array, options) {
    if (Array.isArray(array) && array.length > 0) {
        return array[0];
    }
    return null;
});

hbs.registerHelper('inc', function (value, options) {
    return parseInt(value) + 1;
});

hbs.registerHelper('dec', function (value, options) {
    return parseInt(value) - 1;
});

hbs.registerHelper('not', function (value, options) {
    return !value;
});

hbs.registerHelper('select', function (value, options) {
    return options.fn(this).split('\n').map(function (v) {
        var t = 'value="' + value + '"';
        return !RegExp(t).test(v) ? v : v.replace(t, t + ' selected="selected"');
    }).join('\n');
});

hbs.registerHelper('formatDateForInput', function (date) {
    if (!date) return ''; 
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); 
    const day = String(d.getDate()).padStart(2, '0');        
    return `${year}-${month}-${day}`; 
});

hbs.registerHelper('or', (a, b, c, d, e) => {
    if (a || b || c || d || e) {
        return true;
    }
    return false;
});

hbs.registerHelper('moment', (date, format) => {
    return moment(date).format(format);
});

hbs.registerHelper('noteq', (a, b) => {
    return a !== b;
});

hbs.registerHelper('formatDateTime', (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;
    return `${day}/${month}/${year} ${hours12}:${minutes} ${ampm}`;
});

hbs.registerHelper('formatDate', (date) => {
    return new Date(date).toLocaleDateString('en-GB'); 
});

hbs.registerHelper('ifEquals', function (arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('ifEqualCategory', function (arg1, arg2, options) {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});


hbs.registerHelper('add', (a, b) => a + b);
hbs.registerHelper('subtract', (a, b) => a - b);
hbs.registerHelper('lt', (a, b) => a < b);
hbs.registerHelper('gte', (a, b) => a >= b);
hbs.registerHelper('range', (start, end) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

hbs.registerHelper('if_eq', function (a, b, opts) {
    if (a === b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

hbs.registerHelper('length', function (array) {
    return array ? array.length : 0;
});

hbs.registerHelper('incrementedIndex', function (index) {
    return index + 1;
});

hbs.registerHelper('getFirstImage', function (images) {
    return images && images.length > 0 ? images[0] : '';
});

hbs.registerHelper('chunkedProducts', function (products, chunkSize) {
    const chunks = [];
    let chunk = [];

    products.forEach((product, index) => {
        chunk.push(product);
        if (chunk.length === chunkSize) {
            chunks.push(chunk);
            chunk = [];
        }
    });

    if (chunk.length > 0 && chunk.length < chunkSize) {
        chunk = [...chunk, ...products.slice(0, chunkSize - chunk.length)];
        chunks.push(chunk);
    }

    return chunks;
});

hbs.registerHelper('firstLine', function (description) {
    return description.split('\n')[0];
});

hbs.registerHelper('paragraph', function (description) {
    const sentences = description.match(/([^.!?]+[.!?]+[\s]*){1,4}/);
    return sentences ? sentences[0] : '';
});

hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('gt', (a, b) => a > b);

hbs.registerHelper('typeof', function (value) {
    return typeof value;
});

module.exports = hbs;

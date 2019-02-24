'use strict';
const fs = require('fs');
const { fileName } = require('../config');

module.exports.index = function (req, res, next) {

    fs.stat('./files/'+fileName, (err, stats) => {
        if (err) {
            console.error('No file')
            console.error(err)
            res.render('index', {fileinfo: 'No info'});
        } else {
            const size = (stats.size * 0.000001).toFixed(3) + 'Mb';
            const newDate = new Date(stats.mtimeMs);
            const date = (newDate.getDate()) + '';
            const month = (newDate.getMonth() + 1) + '';
            const year = newDate.getFullYear();
            const hour = newDate.getHours()+'';
            const minute = newDate.getMinutes()+'';
            const dateString = date.padStart(2, '0') + '.' + month.padStart(2, '0') + '.' + year + ' '+ hour.padStart(2, '0') + ':' + minute.padStart(2, '0');
            console.log(dateString, ' ', hour, ':', minute);
            const info = fileName + ' ' + size + ' ' + dateString;
            res.render('index', { info: info });
        }
    })

}

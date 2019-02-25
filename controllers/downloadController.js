const zlib = require('zlib');
const gzip = zlib.createGzip();
const fs = require('fs');
const path = require("path");
const {fileName} = require("../config");

function download(req, res) {
    try {
        console.log("downloadFile!");
        const file = path.join(__dirname, "..", "files", fileName);
        const fileGz = path.join(__dirname, "..", "files", fileName + ".gz");

/*        const read = fs.createReadStream(file);
        const write = fs.createWriteStream(fileGz);
        read.pipe(gzip).pipe(write);
        write.once('finish', () => {
            console.log('download   finish');
            setTimeout( () => {

            } ,2000);
        }); */

        res.download(file);
     /*   write.on('error', (req, res, next) => {
            console.log("Write Error !");
            res.render('error.twig', {message: 'Error download file'});
        });
        read.on('error', function (req, res, next) {
            console.log("Read Error !");
            res.render('index', {message: 'Error download file'});
        });*/
    } catch (err) {
        console.log("Error !");
        res.render('error.twig', {message: 'Error download file'});
    }
}

module.exports.downloadFile = download;

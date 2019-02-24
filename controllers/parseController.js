'use strict'
const request = require('request-promise');
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio');
const { app_secret, urlFilters, urlCategories, fileName } = require('../config');

const south_west_latitude = 34;
let south_west_longitude = -11;
const north_east_latitude = 71;
const north_east_longitude_max = 75;
const numberSplit = 250; //
let north_east_longitude_delta_1 = (north_east_longitude_max - south_west_longitude) / numberSplit;
let north_east_longitude_delta_5 = ((north_east_longitude_max - south_west_longitude) / numberSplit) * 5;
let north_east_longitude_delta_10 = ((north_east_longitude_max - south_west_longitude) / numberSplit) * 10;
let north_east_longitude_delta = north_east_longitude_delta_1; // после разработки поставить 10
let north_east_longitude = south_west_longitude + north_east_longitude_delta;

const pathFile = path.join('files', fileName);
//const URL = 'https://app.truckparkingeurope.com/api/v3/parking_places/clusters/?mode=cluster&south_west_latitude=31.57003499701794&south_west_longitude=-19.193319273027896&north_east_latitude=34.37147763114022&north_east_longitude=-14.848226499590396&map_ratio=1.300986842105263&map_width=791&map_height=608&app_secret=e483f0be16bf4aad7ec4e40cc8139e54e86378b6&language=en&layout=bare';
let results = [],
    ids = [];
let countAllPoints = 0;
let count_groups = 0;
const getImageName = (url) => {
    let result = '';
    try {
        const array = url.split('/');
        result = array[array.length - 1].split('?')[0];
    } catch (e) {
        console.log(e);
    }
    return result;
}

function getFiltersName() {
    return new Promise(async (resolve, reject) => {
        try {

            let response = await request(urlFilters);
            const json = JSON.parse(response);
            let allFilters = [];
            for (let typeFilters of json.response) {
                for (let filters of typeFilters.filters) {
                    let filter = {};
                    filter.id = filters.id;
                    filter.name = filters.name;
                    filter.type = typeFilters.name;
                    //filter.icon_unknown = getImageName(filters.icon_unknown);
                    //filter.icon_unavailable = getImageName(filters.icon_unavailable);
                    let link = filters.icon_available.split('?')[0] ? filters.icon_available.split('?')[0] : filters.icon_available;
                    filter.link_icon_available = 'https://app.truckparkingeurope.com' + link;
                    filter.icon_available = getImageName(filters.icon_available);
                    allFilters[filters.id] = filter
                }
            }
            resolve(allFilters);

        } catch (e) {
            console.log(e);
            reject(0)
        }
    });
}

async function getCategories() {
    const response = await request(urlCategories);
    const array = JSON.parse(response);
    let category_type = [];
    for (const parking of array.response) {
        category_type.push({
            category_type_id: parking.category_type_id,
            name: parking.name,
            category: parking.category,
            icon_on: getImageName(parking.icon_on),
            icon_off: getImageName(parking.icon_off)
        });
    }
    return category_type;
}

async function getPointContent(id = 0) {
    const urlPoint = `https://app.truckparkingeurope.com/en/parking-places/${id}`;
    const response = await request(urlPoint);
    let result = {};
// set some defaults
    let req = await request.defaults({
        jar: true,                 // save cookies to jar
        rejectUnauthorized: false,
        followAllRedirects: true   // allow redirections
    });
// scrape the page
    req.get({
        url: urlPoint,
        headers: {
            'Cookie': '_ga=GA1.2.1493094986.1549824432; _gid=GA1.2.313199200.1549824432; _fbp=fb.1.1549824432666.2128293542; remember_user_token=BAhbCFsGaQNWDQFJIiIkMmEkMTAkQ2NMS0FaTHo5ZUJTby5kMVdLa1dSdQY6BkVUSSIXMTU0OTgyOTI4My42NjQ0NjA3BjsARg%3D%3D--fcd85e65e850b4f76a9574a1fc2134d8253eaf64; _gat=1; _truck_web_session_1=bVdxK2ZOS1BVZm5nbVVvampDUHlrRW5qcFJJK3FseDJKQmJyTFFyNFJleUpmT0JEMnA3clU2cUJ6ZVZCZDdROWRTQzlFUWZhRlFlTkplYWxqZjlPbENUbm9yQ2tZUjVOUDhEYWt6MVh6dXl6d3VESGNjU29teDJaNFB3U3BPQmtvbmdLTzM0Z0hIMDZyQ0VWKzRyc1A3c0RQenNYeVhLaHhsR0RZNnRJdTRtSmdsd0lDV21IVzlrdU1SWVF2SFBtN1l6OGxGdXc3bWJYQVVnNU51cWczRVpXQzlrV1FZSlZCZkFMS3VwWjJzYkRhTGt0MmFUL3lxWHpOQzBZNklpWmhmbFQ1QkxWVE1BdzMzZXA5UWtiK1E9PS0tK2o4TkxKV2VGaFowT1ErOEJza01HUT09--d6117998314305251086c5a36e96fbaf06ab5ad7' // optional headers
        }
    }, await function (err, resp, body) {
        console.log("66666666666666");
        // load the html into cheerio
        var $ = cheerio.load(body);
        //let $ = cheerio.load(response);
        const selector = `div[title="${id}"] > h1`;
        const title = $(selector).text();
        const reservations_info__title = $('div[class="reservations-info__title"]').text();
        const help_block__danger = $('div[class="help-block help-block__danger"]').text();
        result = {title, reservations_info__title, help_block__danger};
        //console.log(result);
        return result;
    });

    return result;
}

async function getAllPointsFromJs() {
    let allInfo = []
    const filtersInfo = await getFiltersName();
    while (north_east_longitude <= north_east_longitude_max) {
   // while (filtersInfo && north_east_longitude <= -5) {
        try {
            count_groups++;
            const URL = `https://app.truckparkingeurope.com/api/v3/parking_places/search/?south_west_latitude=${south_west_latitude}&south_west_longitude=${south_west_longitude}&north_east_latitude=${north_east_latitude}&north_east_longitude=${north_east_longitude}&app_secret=${app_secret}&language=en&layout=bare`;
            const response = await request(URL);
            const json = JSON.parse(response);
            results = json.response;
            let count = 0;
            for (const result of results) {
                let parking = {};
                const parkingPlace = result.parking_place;
                count++;
                let availableFilters = [];
                for (let filter of parkingPlace.filters) {
                    if (filter.filter_status_id == 1) {
                        for (let filterInfo of filtersInfo) {
                            if (filterInfo && filterInfo.id === filter.filter_id) {
                                availableFilters.push(filterInfo);
                            }
                        }
                    }
                }
                parking.id = parkingPlace.id ? result.parking_place.id : '';
                parking.name = parkingPlace.name ? parkingPlace.name : '';
                parking.address = parkingPlace.address ? parkingPlace.address : '';
                parking.latitude = parkingPlace.latitude ? parkingPlace.latitude : '';
                parking.longitude = parkingPlace.longitude ? parkingPlace.longitude : '';
                parking.verified = parkingPlace.verified + '';
                parking.reviews_rating = parkingPlace.reviews_rating ? parkingPlace.reviews_rating : '';
                parking.reviews_count = parkingPlace.reviews_count ? parkingPlace.reviews_count : '';
                parking.number_of_parking_spots = parkingPlace.number_of_parking_spots ? parkingPlace.number_of_parking_spots : '';
                parking.icon = parkingPlace.icon ? parkingPlace.icon : '';
                parking.category_id = parkingPlace.category_id ? parkingPlace.category_id : '';
                parking.category = parkingPlace.category ? parkingPlace.category : '';
                parking.filters = availableFilters;
               // parking.occupancy = parkingPlace.occupancy ? JSON.stringify(parkingPlace.occupancy) : '';
               // parking.advertisement = parkingPlace.advertisement ? JSON.stringify(parkingPlace.advertisement) : '';
                // parking.distances = result.distances ? JSON.stringify(result.distances) : '';
                // parking.friend_timecards = result.friend_timecards ? JSON.stringify(result.friend_timecards) : '';
                // ids.push(parking.id);
                allInfo.push(parking);

            }

            //let allRecords = JSON.stringify(allInfo, null, 1);
            //fs.appendFileSync(pathFile, allRecords);

            console.log(count_groups, '. count = ', count, count == 1000 ? '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' : '', south_west_longitude, ' ', north_east_longitude);
            console.log(process.memoryUsage().rss / 1000000);
            countAllPoints += count;
            console.log(countAllPoints);

            global.io.emit('countAllPoints', { countAllPoints } );
            if (count_groups < 3) north_east_longitude_delta = north_east_longitude_delta_5;
            if (count_groups >= 3 && count_groups <= 90) north_east_longitude_delta = north_east_longitude_delta_1;
            if (count_groups > 100) north_east_longitude_delta = north_east_longitude_delta_10;
            south_west_longitude = north_east_longitude;
            north_east_longitude = south_west_longitude + north_east_longitude_delta;

        } catch (e) {
            console.log(e);
        }
    }
    return allInfo;

}


async function resultArray(req, res) {
    try {
/*        fs.unlink(pathFile, (err) => {
            if (err) throw err;
            console.log('path/file.txt was deleted');
        });*/
        const allPoints = await getAllPointsFromJs();

        const date = (new Date().getDate()) + '';
        const month = (new Date().getMonth() + 1) + '';
        const year = new Date().getFullYear();
        const dateString = date.padStart(2, '0') + '.' + month.padStart(2, '0') + '.' + year + '_' + allPoints.length;
        //const dateString = (new Intl.DateTimeFormat().format(new Date())) + '_' + allPoints.length;

       //const allRecords = JSON.stringify(allPoints, null, 1);
       // const writeStream = fs.createWriteStream(pathFile);
/*        writeStream.write(allRecords);
        writeStream.on('error', (err) => {
            console.log('Error in WriteableStream')
            console.log(err)
        });*/
        fs.writeFile(pathFile, JSON.stringify(allPoints, null, 0), 'utf8', () => {
            console.log('111111111111111111111111111111111111111111111111111');
            console.log(process.memoryUsage().rss / 1000000);
           // res.send(fileName);
           // res.status(200).end();
            global.io.emit('endParsing', { fileName } );
        });
/*        writeStream.on('finish', () => {
            console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
            //
        });*/
    } catch (err) {
        res.send("Error in getAllPointsFromJs");
        console.log(err)
    }
}

module.exports.result = resultArray;


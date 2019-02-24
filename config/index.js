const parkings = [
    {
        name: '',
        image: 'https://s3.eu-central-1.amazonaws.com/truck.web.production/store/de74b2415fe4727825ed346f4d62ef51.png',
        urlPart: "kieler-strasse"
    }
];
const app_secret = 'e483f0be16bf4aad7ec4e40cc8139e54e86378b6';
module.exports.parkings = parkings;
module.exports.fileName = 'parking.json';
module.exports.app_secret = app_secret;
module.exports.urlFilters = `https://app.truckparkingeurope.com/api/v3/filter_categories/?app_secret=${app_secret}&language=en&layout=bare`;
module.exports.urlCategories = `https://app.truckparkingeurope.com/api/v3/categories/?app_secret=${app_secret}&language=en&layout=bare`;


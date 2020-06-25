const {GOOGLE_MAPS_API_KEY} = require("../tools/environment");
const request = require("request")

class GeocodingController {

  getLocationFromAddress(req, res) {

    request("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURI(req.query.address) + "&key=" + GOOGLE_MAPS_API_KEY,
      (error, response, body) => {
        const parsedBody = JSON.parse(body);
        if (error) return res.status(400).json({error: "Une erreur est survenue pendant la récupération des données", message: error});
        if (parsedBody.results.length === 0) return null;

        let country;
        // Get country
        for (let component of parsedBody.results[0].address_components) {
          if (component.types.indexOf("country") !== -1) {
            country = component.short_name;
            break;
          }
        }

        if (!country) return null;

        return res.json({
          label: req.query.address,
          lat: parsedBody.results[0].geometry.location.lat,
          lng: parsedBody.results[0].geometry.location.lng,
          country: country
        });
      });
  }
}


const geocodingController = new GeocodingController();

module.exports = geocodingController;

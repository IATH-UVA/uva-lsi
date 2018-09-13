const keyGoogle = 'AIzaSyCnjWNFjYyvprkhwWab685Vhnxaq1CZyZw'; //need a new api key for processsing

const fs = require('fs');
const http = require('http');
const axios = require('axios');
const Promise = require("bluebird");
const Iconv  = require('iconv').Iconv;
const { StringDecoder } = require('string_decoder');

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');
const decoder = new StringDecoder('ascii');

const sites = require('../Lists/09sites_preGoogleTng.js');

const sitesSlice = sites.slice();

// so compose google place search (name, country) and google city search (city, country)
// retrieve lat/long for all so generic mapping/errors

/*[ 'siteName',
  'imgCount',
  'subsites',
  'viewTypes',
  'imageIds',
  'creators',
  'tng',
  'dates',
  'aat_style',
  'keywords',
  'loc',
  'tgn_latitude',
  'tgn_longitude' ]*/

var place = [];

//------------------Testing for the initial site---------------------
/*
axios({
        method: 'get',
        url: 'https://maps.googleapis.com/maps/api/geocode/json?address=Belvedere,Vienna,Austria&key=' + keyGoogle,
        name: 'Belvedere',
    })
    .then(function(response) {
        console.log(decodeURI(response.request.path));
    });

const tempResults = { "results":
		[{ "address_components": [
						{ "long_name": "27", "short_name": "27", "types": ["street_number"] },
						{ "long_name": "Prinz Eugen-Straße", "short_name": "Prinz Eugen-Straße", "types": ["route"] },
						{ "long_name": "Landstraße", "short_name": "Landstraße", "types": ["political", "sublocality", "sublocality_level_1"] },
						{ "long_name": "Wien", "short_name": "Wien", "types": ["locality", "political"] },
						{ "long_name": "Wien", "short_name": "Wien", "types": ["administrative_area_level_1", "political"] },
						{ "long_name": "Austria", "short_name": "AT", "types": ["country", "political"] },
						{ "long_name": "1030", "short_name": "1030", "types": ["postal_code"] }
						],
				"formatted_address": "Prinz Eugen-Straße 27, 1030 Wien, Austria",
				"geometry": {
					"location": { "lat": 48.1915585, "lng": 16.3809547 },
					"location_type": "ROOFTOP",
					"viewport": { "northeast": { "lat": 48.1929074802915, "lng": 16.3823036802915 }, "southwest": { "lat": 48.1902095197085, "lng": 16.3796057197085 } }
				},

				"place_id": "ChIJpZ4LAn0HbUcRB3aToFL8ZUo",
				"types": ["establishment", "museum", "point_of_interest", "premise"] }],

			"status": "OK" };

const testObj ={};
	testObj.g_address = tempResults.results[0].formatted_address;
	testObj.g_latitude = tempResults.results[0].geometry.location.lat;
	testObj.g_longitude = tempResults.results[0].geometry.location.lng;
	testObj.g_id = tempResults.results[0].place_id;
	testObj.basic = tempResults.status;

console.log(testObj);
*/

sitesSlice.forEach((site, i)=>{
	//note I've done a find/replace for all non utf-8 characters as 'e'
  /*
  var name, city, country;
  (site.siteName !== undefined)? name = site.siteName : name = '';
  (site.location.city !== undefined)? city = site.location.city : city = '';
  (site.location.country !== undefined)? country = site.location.country : country = '';
	*/

	if (site.type==='site'){



	var gPlace = site.name[0];
	var address = 'https://maps.googleapis.com/maps/api/geocode/json?address='+gPlace+'&key='+keyGoogle;
  var add2 = iconv.convert(address);
  const content = decoder.write(add2)

  //console.log(content);


	place.push(axios({
		  		method:'get',
		  		url: content,

			}).then(function(response) {

				var path = decodeURI(response.request.path).replace('/maps/api/geocode/json?address=', '');
				var name = path.replace('&key='+keyGoogle, '').split(',')[0];

				if (response.data.status === 'OK') {console.log('ok request' /*response.data.results[0].formatted_address, name*/)} else {console.log('failure', response.data.results[0], content)}


				var obj = {};
				obj.siteName = name;

						if (response.data.status === 'OK'){
								obj.g_address = response.data.results[0].formatted_address;
								obj.g_latitude = response.data.results[0].geometry.location.lat;
								obj.g_longitude = response.data.results[0].geometry.location.lng;
								obj.g_id = response.data.results[0].place_id;

						} else if (response.data.status !== 'OK'){
							obj.gPlace_result = response.data.status;
						};

						return obj;
  	// 			//add info here and then return site - which will become a new array... not everythin will geocode nicely.
			})
			)

	}

})

console.log('promise?', place);



Promise.all(place)
	.then(function(responses) {

		responses.forEach(response=>{

        var name = response.siteName;

        sitesSlice.forEach(site=>{
          if (site.name[0] === name){
            site.g_address = response.g_address;
            site.g_latitude = response.g_latitude;
            site.g_longitude = response.g_longitude;
            site.g_id = response.g_id;
            site.gPlace_result = response.gPlace_result;

          }
        })
    })
				//console.log(sitesSlice);
        const stringArray = JSON.stringify(sitesSlice);
        console.log(sitesSlice);
        fs.writeFileSync('../Lists/09geo.js', 'var sites='+stringArray+';\r module.exports=sites');
	})
	.catch(err=>{console.log(err.message)});


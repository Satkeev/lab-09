'use strict'
console.log('test');
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();
const app = express();
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

app.get('/location', locationHandler);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler);
// app.get('/weather', weatherHandler);
// app.get('/trial', trialHandler')

const PORT = process.env.PORT || 3001;
const ERROR404 = 'The page does not exist.';

function locationHandler(request, response){
    let city = request.query.city;
    let url = 'https://us1.locationiq.com/v1/search.php';

    const queryParams = {
      key: process.env.GEOCODE_API_KEY,
      q: city,
      format: 'json', 
      limit: 1
    }
  
    superagent.get(url)
      .query(queryParams)
      .then(data => {
        console.log('results from superagent on GEODATA', data.body);
        const geoData = data.body[0];  // we are taking the first one ...
        const location = new Location(city, geoData);
  
        response.status(200).send(location);
      }).catch()
  };

function movieHandler(request, response) {
  try {
    console.log('inside movieHandler');
  let city = request.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${city}`;
  console.log('location');   
  superagent.get(url).then(resultsFromSuperAgent => {
    
    
     const data =resultsFromSuperAgent.body.results;
     const results = data.map(item => new Movie(item));
     
     response.status(200).send(results);
      })
  } catch(err) {
    console.log('ERROR', err);
    response.status(500).send('sorry, we messed up');
    } 
}

function yelpHandler(request, response){
  let city = request.query.city;
  let url = `https://api.yelp.com/v3/businesses/search`;

  const queryParams = {
    categories: 'restaurants',
    latitude: request.query.latitude,
    longitude: request.query.longitude,
    limit: 10
  }

  superagent.get(url)
    .set({Authorization :`Bearer ${process.env.YELP_API_KEY}` })
    .query(queryParams)
    .then(data => {
      console.log('results from superagent on YELP', data.body);
      const GeoData = data.body.businesses.map(restaurants =>{
      return new Business(restaurants);
      })
      response.status(200).send(GeoData);
       
      } ).catch(err=>console.log(err))
};
function restaurantHandler(request, response){
  console.log('this is our restaurant route', request.query);
  
  const page = request.query.page;
  const numPerPage = 5;
  const start = (page - 1) * numPerPage; // this allows us to start with the 1-5 and then 5-10, and then 10-15 etc...etc...

  const url = 'https://developers.zomato.com/api/v2.1/search';

  const queryParams = {
    lat: request.query.latitude,
    start: start,
    count: numPerPage,
    lng: request.query.longitude
  }

  superagent.get(url)
    .set('user-key', process.env.ZOMATO_API_KEY)
    .query(queryParams)
    .then(data => {
      console.log('data from superagent', data.body);
      let restaurantArray = data.body.restaurants; // this is the array that I want
      console.log('this is my restaurantArray', restaurantArray[0]);

      const finalRestaurants = restaurantArray.map(eatery => {
        return new Restaurant(eatery);
      })

      response.status(200).send(finalRestaurants);
    })
};
app.get('/weather', (request, response) => {
  let city = request.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${process.env.WEATHER_API_KEY}&days=8`;
  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const weatherArray = resultsFromSuperAgent.body.data.map(day => {
        return new Weather(day);
      })
      response.status(200).send(weatherArray);
    }).catch(err => console.log(err))
})

app.get('/trails', (request, response) => {
  let {latitude, longitude} = request.query;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${process.env.TRIAL_API_KEY}`;
  
  superagent.get(url)
    .then(resultsFromSuperAgent => {
      const trailArr = resultsFromSuperAgent.body.trails.map(trail => {
        return new Trail(trail);
      })
      response.status(200).send(trailArr);
    }).catch(err => console.log(err));
})

     function Location(city, geoData){
        this.search_query = city;
        this.formatted_query = geoData.display_name;
        this.latitude = geoData.lat;
        this.longitude = geoData.lon;
     }
    function Movie (movieData){
        this.title = movieData.original_title;
        this.overview = movieData.overview;
        this.average_votes = movieData.vote_average;
        this.total_votes = movieData.vote_count;
        this.popularity = movieData.popularity;
        this.released_on = movieData.release_date;
      }
      function Business (yelpData){
          this.name = yelpData.name;
          this.image_url = yelpData.image_url;
          this.price = yelpData.price;
          this.rating = yelpData.rating;
          this.url = yelpData.url;
      }

      function Restaurant(obj){
        this.restaurant = obj.restaurant.name;
        this.cuisines = obj.restaurant.cuisines;
        this.locality = obj.restaurant.location.locality;
      }
      function Weather(obj) {
        this.forecast = obj.weather.description;
        this.time = obj.valid_date;
      }
      
      function Trail(obj) {
        this.name = obj.name;
        this.location = obj.location;
        this.length = obj.length;
        this.stars = obj.stars;
        this.star_votes = obj.starVotes;
        this.trail_url = obj.url;
        this.conditions = `${obj.conditionStatus} ${obj.conditionDetails}`;
        this.condition_date = obj.conditionDate.slice(0, 10);
        this.condition_date = obj.conditionDate.slice(12, 19);
      }
      

      function errorHandler(error, request, response) {
        response.status(500).send(error);
      }

      client.connect()
      .then(() => {
        app.listen(PORT, () => {
          console.log(`listening on ${PORT}`);
        })
      })



    




















// function yelpHandler(request, response) {
//   const url = `https://api.yelp.com/v3/businesses/search?`;
//     try {
//       console.log('yelp watching');
//     superagent.get(url)
//         .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
//         .then(data => {
//           const yelpObject = data.body.businesses.map( obj => new Business(obj) );
//           response.send(yelpObject);
//         });
//     } catch(error) {
//       errorHandler(error, request, response);
//     }
  // 
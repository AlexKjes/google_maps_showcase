
var droneMarker = null;
var map = null;
var heatmap = null;


var undiscoveredWeed = [
  {x: 59.61124464490302, y: 11.038602492237146},
  {x: 59.61099362962529, y: 11.039683422470148},
  {x: 59.61099362962529, y: 11.039683422470148},
  {x: 59.61077924752505, y: 11.036995849037226},
  {x: 59.61077924752505, y: 11.03711923065191},
  {x: 59.61071411851485, y: 11.037022671127374},
  {x: 59.61063813451005, y: 11.037022671127374},
  {x: 59.61150086023708, y: 11.03746684984094}
];

var discoveredWeed = [];

function initMap(){


    mapHelperLoad();
    latlng = {lat: 59.61124464490302, lng: 11.038602492237146};

    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 18,
      center: latlng,
      mapTypeId: 'satellite'
    });
    multipointMoveDrone();

    map.addListener('click', e => console.log({x: e.latLng.lat(), y: e.latLng.lng()}));

    heatmap = new google.maps.visualization.HeatmapLayer({
      map: map,
      radius: 20
    });

}

// updates the drone marker
function dronePositionChange(pos){
  if (droneMarker == null) {
    let icon = {
      url: "assets/droneMarker.png",
      scaledSize: new google.maps.Size(15, 15)
    };
    droneMarker = new google.maps.Marker({
      position: pos,
      map: map,
      title: "hobo",
      icon: icon
    });
  } else {
    droneMarker.setPosition(pos);
  }
}

function mapHelperLoad() {
  scrpt = document.createElement("script");
  scrpt.setAttribute("src", "mapsHelper.js");
  document.body.appendChild(scrpt);
}

// move drone from one position to another
// speed == refreshrate
// resolve = Promise.resolve()
function moveDrone(from, to, vel, speed, resolve){
  setTimeout(() => {
    let pos = {x: from.x+vel.x, y: from.y+vel.y};
    dronePositionChange({lat: pos.x, lng: pos.y});
    weedAdder(pos);
    if ((Math.sign(pos.x - to.x) == Math.sign(from.x - to.x))  &&
        (Math.sign(pos.y - to.y) == Math.sign(from.y - to.y))){
      setTimeout(_ => moveDrone(pos, to, vel, speed, resolve), speed);
    } else {
      resolve();
    }
  })
}

// calculates velocity of shortest dimension, longest is constant
function calculate_velocity(from, to){
  let VEL = .000009
  let ylo = {x: to.x-from.x, y: to.y-from.y}
  let max;
  if (Math.abs(ylo.x) < Math.abs(ylo.y)) {max = Math.abs(ylo.y)} else {max = Math.abs(ylo.x)}
  let delta = {x: VEL* (ylo.x/max) , y: VEL* (ylo.y/max)};
  return delta
}

// the crippled lovechild of a while and for loop for promises
function promisLoop(counter, condition, internalLoop){
  if (condition(counter)) {
    internalLoop(counter)
    .then( _ => promisLoop(++counter, condition, internalLoop));
  }
}

// loads coordinates from json for drone to follow
function multipointMoveDrone(){

  fetch("coordinates.json")
  .then(response => response.json())
  .then(json => {

    let i = 0;
    let cond = i => {return i<json.length-1};
    let internal = i => {
      return new Promise((res, rej) => {
        let velocity = calculate_velocity(json[i], json[i+1]);
        moveDrone(json[i], json[i+1], velocity, 33, res)})
      }
    promisLoop(i, cond, internal);
    });
}

function weedAdder(pos){

  for (let i=0;i<undiscoveredWeed.length;i++){
    if ((Math.abs(pos.x-undiscoveredWeed[i].x)+Math.abs(pos.y-undiscoveredWeed[i].y) < 1e-4)){
      dp = undiscoveredWeed.splice(i, i+1)[0];
      //console.log(new google.maps.LatLng(dp.x, dp.y).lat());
      discoveredWeed.push(new google.maps.LatLng(dp.x, dp.y));
      heatmap.setData(discoveredWeed);
    }
  }


}

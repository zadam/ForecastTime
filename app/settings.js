import { me } from "appbit";
import * as fs from "fs";
import { weather, fetchWeather } from './weather';
import document from "document";
import * as util from "../common/utils";

let seperatorEndLeft = document.getElementById("seperatorEndLeft");
let seperatorLine = document.getElementById("seperatorLine");
let seperatorEndRight = document.getElementById("seperatorEndRight");
const tempAndConditionLabel = document.getElementById("tempAndConditionLabel");
const weatherImage = document.getElementById("weatherImage");

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

// current in-progress settings
let current;

let runtime = {
    color: "deepskyblue",
    updateInterval: 60,
    updateLocationInterval: 60,
    temperatureUnits: 'c',
    showDataAge: false,
    failCount: 0,
    showFailCount: false,
    showError: false,
    weatherData: null,
    fakeTime: false
};

function applySettings() {
  setUpdateInterval();
  setLocationUpdateInterval();
  setColor();
  setUnit();
  setErrorMessage();
  setFailCount(); 
  setWeatherScroll();
  setLocationScroll();
  runtime.openedWeatherRequest = false;
}

function setUpdateInterval() {
  console.log(`updateInterval is: ${current.updateInterval}`);
  let oldInterval = runtime.updateInterval;
  if (current.updateInterval == "5 minutes")
    runtime.updateInterval = 5;
  else if (current.updateInterval == "15 minutes")
    runtime.updateInterval = 15;
  else if (current.updateInterval == "30 minutes")
    runtime.updateInterval = 30;
  else if (current.updateInterval == "1 hour")
    runtime.updateInterval = 60;
  else if (current.updateInterval == "2 hours")
    runtime.updateInterval = 120;
  if (runtime.updateInterval < oldInterval){
    weather.setMaximumAge(1 * 60 * 1000); 
    if (!openedWeatherRequest){
      console.log("Forcing Update Interval Change");
      runtime.openedWeatherRequest = true;
      weather.fetch();
    }
  }
  weather.setMaximumAge(runtime.updateInterval * 60 * 1000); 
  if (runtime.weatherInterval != null)
    clearInterval(runtime.weatherInterval);
  runtime.weatherInterval = setInterval(fetchWeather, runtime.updateInterval*60*1000);
  //console.log("Acutal Interval: " + weather._maximumAge)
}

function setLocationUpdateInterval() {
  console.log(`locationUpdateInterval is: ${current.updateLocationInterval}`);
  let oldLocationInterval = runtime.updateLocationInterval;
  if (current.updateLocationInterval == "5 minutes")
    runtime.updateLocationInterval = 5;
  else if (current.updateLocationInterval == "15 minutes")
    runtime.updateLocationInterval = 15;
  else if (current.updateLocationInterval == "30 minutes")
    runtime.updateLocationInterval = 30;
  else if (current.updateLocationInterval == "1 hour")
    runtime.updateLocationInterval = 60;
  else if (current.updateLocationInterval == "2 hours")
    runtime.updateLocationInterval = 120;
  if (runtime.updateLocationInterval < oldLocationInterval){
    weather.setMaximumLocationAge(1 * 60 * 1000); 
    if (!runtime.openedWeatherRequest){
    console.log("Forcing Location Update Interval Change");
      runtime.openedWeatherRequest = true;
      weather.fetch();
    }
  }
  weather.setMaximumLocationAge(runtime.updateLocationInterval * 60 * 1000);
}

function setColor() {
  console.log(`Setting Seperator Bar color: ${current.color}`);
  runtime.color = current.color;
  seperatorEndLeft.style.fill = runtime.color;
  seperatorLine.style.fill = runtime.color;
  seperatorEndRight.style.fill = runtime.color;
}

function setUnit() {
  console.log(`Temperature units: ${current.temperatureUnits}`);
  var oldUnits = runtime.temperatureUnits;
  runtime.temperatureUnits = current.temperatureUnits === 'Celsius' ? 'c' : 'f';
  
  if (oldUnits != runtime.temperatureUnits){
    weather.setMaximumAge(0 * 60 * 1000); 
    weather.setUnit(runtime.temperatureUnits);
    if (!runtime.openedWeatherRequest) {
      console.log("Forcing Update Unit Change");
      runtime.openedWeatherRequest = true;
      weather.fetch();
    }
    weather.setMaximumAge(runtime.updateInterval * 60 * 1000); 
  }
  weather.setUnit(runtime.temperatureUnits);
}

function setErrorMessage() {
  console.log(`Show Error: ${current.errorMessageToggle}`);
  runtime.showError = current.errorMessageToggle;
}
 
function setFailCount() {
  console.log(`Fail Count: ${current.failCountToggle}`);
  runtime.showFailCount = current.failCountToggle;
}

function setWeatherScroll() {
  console.log(`Weather Scroll Dissable: ${current.weatherScrollToggle}`);
  if (current.weatherScrollToggle){
    tempAndConditionLabel.state = "disabled"
    tempAndConditionLabel.text = "";
    if (runtime.weatherData)
      tempAndConditionLabel.text = `${runtime.weatherData.temperature}° ${util.shortenText(runtime.weatherData.description)}`;
    else
      tempAndConditionLabel.text = "Updating..."
  } else
    tempAndConditionLabel.state = "enabled"
  
}

function setLocationScroll() {
  console.log(`Weather Scroll Disable: ${current.locationScrollToggle}`);
  if (current.locationScrollToggle){
    weatherLocationLabel.state = "disabled"
    weatherLocationLabel.text = "";
    if (runtime.weatherData){
      if (runtime.showDataAge){
        var timeStamp = new Date(runtime.weatherData.timestamp);
        timeStamp = util.hourAndMinToTime(timeStamp.getHours(), timeStamp.getMinutes());
        weatherLocationLabel.text = `${runtime.weatherData.location} (${timeStamp})`;
      } else {
        weatherLocationLabel.text = `${runtime.weatherData.location}`;
      }
    }
  }
}


me.onunload = saveSettings;

function loadSettings() {
  console.log("Loading Settings!")
  try {
    return fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    // Defaults
    return {
      updateInterval : "1 hour",
      updateLocationInterval : "1 hour",
      temperatureUnits: 'Celsius',
      errorMessageToggle: false,
      failCountToggle : false,
      weatherScrollToggle : false,
      locationScrollToggle : false,
      color : "#004C99",
    }
  }
}

current = loadSettings();

function saveSettings() {
  console.log("Saving Settings");
  current.noFile = false;
  fs.writeFileSync(SETTINGS_FILE, current, SETTINGS_TYPE);
  //fs.unlinkSync(SETTINGS_FILE);  //kill file for testing first run
}

export default {
  runtime,
  current,
  saveSettings,
  setUpdateInterval,
  setLocationUpdateInterval,
  setColor,
  setUnit,
  setErrorMessage,
  setFailCount,
  setWeatherScroll,
  setLocationScroll,
  applySettings
};
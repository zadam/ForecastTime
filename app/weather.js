import Weather from '../common/weather/device';
import document from "document";
import settings from './settings';
import * as messaging from "messaging";
import * as util from "../common/utils";

let openedWeatherRequest = false;

const tempAndConditionLabel = document.getElementById("tempAndConditionLabel");
tempAndConditionLabel.text = "Updating...";
const weatherImage = document.getElementById("weatherImage");

const weather = new Weather();
weather.setProvider("yahoo"); 
weather.setApiKey("");
weather.setMaximumAge(settings.runtime.updateInterval * 60 * 1000); 
weather.setFeelsLike(false);

weather.setUnit(settings.runtime.temperatureUnits);

settings.applySettings();

if (settings.noFile){
  console.log("No Settings File");
  weather.fetch();
}

weather.onsuccess = (data) => {
  settings.runtime.weatherData = data;
  settings.runtime.failCount = 0;
  settings.runtime.openedWeatherRequest = false;
  weather.setMaximumAge(settings.runtime.updateInterval * 60 * 1000); 
  if (settings.runtime.weatherInterval != null)
    clearInterval(settings.runtime.weatherInterval);
  settings.runtimeweatherInterval = setInterval(fetchWeather, settings.runtime.updateInterval * 60 * 1000);
  var time = new Date();
  if (settings.runtime.fakeTime) time = "11:08a";
  var timeStamp = new Date(data.timestamp);
  timeStamp = util.hourAndMinToTime(timeStamp.getHours(), timeStamp.getMinutes());

  console.log("Time: " + time + ", TimeStamp: " + timeStamp);
  
  const location = `${util.shortenText(data.location)} (${timeStamp})`;
  
  tempAndConditionLabel.text = `${data.temperature}° ${util.shortenText(data.description)} (${location})`;
   
  weatherImage.href = util.getWeatherIcon(data);  
}

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
  weather.setMaximumAge(30 * 1000); 
  settings.runtime.openedWeatherRequest = false;
  if (settings.runtime.weatherInterval != null)
    clearInterval(settings.runtime.weatherInterval);
  settings.runtime.weatherInterval = setInterval(fetchWeather,30 * 1000);
  if (error == "No connection with the companion")
       error = "Companion Failure"
  if (JSON.stringify(error) == "{}")
       error = "Unknown"
  if (!settings.runtime.weatherData) {
    weatherImage.href = "";
    
    settings.runtime.failCount++;
    if (settings.runtime.showFailCount)
      tempAndConditionLabel.text = `Updating, try ${settings.runtime.failCount}`;
    else
      tempAndConditionLabel.text = "Updating...";
  } else {
      tempAndConditionLabel.text = `${settings.runtime.weatherData.temperature}° ${util.shortenText(settings.runtime.weatherData.description)}`;

      weatherImage.href = util.getWeatherIcon(settings.runtime.weatherData);  
  }
}

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
  weather.fetch();
  console.log("I Should be Fetching Weather!");
  settings.runtime.openedWeatherRequest = true;
};

function fetchWeather(){
  settings.runtime.openedWeatherRequest = false;
  console.log("auto fetch");
  weather.fetch();
}

if (settings.runtime.weatherInterval != null)
    clearInterval(settings.runtime.weatherInterval);
settings.runtime.weatherInterval = setInterval(fetchWeather, settings.runtime.updateInterval*60*1000);

settings.runtime.openedWeatherRequest = true;

export { weather };
export { fetchWeather };

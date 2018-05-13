import clock from "clock";
import { me } from "appbit";
import document from "document";
import * as fs from "fs";

import * as messaging from "messaging";

import { HeartRateSensor } from "heart-rate";
import { today } from "user-activity";
import { goals } from "user-activity";
import { user } from "user-profile";
import { display } from "display";
import { preferences } from "user-settings";
import { units } from "user-settings";
import { vibration } from "haptics"
import { battery } from "power";

import * as util from "../common/utils";

import { weather } from './weather';

import settings from './settings';

import { me as device } from "device";

if (!device.screen) device.screen = { width: 348, height: 250 };
console.log(`Dimensions: ${device.screen.width}x${device.screen.height}`);
var deviceType = "Ionic";
if (device.screen.width == 300 && device.screen.height == 300)
  deviceType = "Versa";

// Update the clock every minute
clock.granularity = "seconds";

let background = document.getElementById("clickbg");

// Views
let clockView = document.getElementById("clock");
let statsView = document.getElementById("stats");
let forecastView = document.getElementById("forecast");

// Get a handle on the <text> element
// Clock view
let clockLabel = document.getElementById("clockLabel");
let clockSecondsLabel = document.getElementById("clockSecondsLabel");
let dateLabel = document.getElementById("dateLabel");
let batteryLevelLabel = document.getElementById("batteryLevelLabel");
let hrLabel = document.getElementById("hrLabel");
let stepsLabel = document.getElementById("stepsLabel");
if (deviceType == "Versa")
  let calsLabel = document.getElementById("calsLabel");

// Stats View
let stepStatsLabel = document.getElementById("stepStatsLabel");
let distStatsLabel = document.getElementById("distStatsLabel");
let floorsStatsLabel = document.getElementById("floorsStatsLabel");
let activeStatsLabel = document.getElementById("activeStatsLabel");
let calsStatsLabel = document.getElementById("calsStatsLabel");
if (deviceType == "Versa") {
  let stepGoalLabel = document.getElementById("stepGoalLabel");
  let distGoalLabel = document.getElementById("distGoalLabel");
  let floorsGoalLabel = document.getElementById("floorsGoalLabel");
  let activeGoalLabel = document.getElementById("activeGoalLabel");
  let calsGoalLabel = document.getElementById("calsGoalLabel");
}

// Forecast View
let todayDateLabel = document.getElementById("todayDateLabel");
let todayWeatherImage = document.getElementById("todayWeatherImage");
let weatherImage = document.getElementById("weatherImage");
let todayDescriptionLabel = document.getElementById("todayDescriptionLabel");
let todayHighLabel = document.getElementById("todayHighLabel");
let todayHighValLabel = document.getElementById("todayHighValLabel");
let todayLowLabel = document.getElementById("todayLowLabel");
let todayLowValLabel = document.getElementById("todayLowValLabel");

let tomorrowDateLabel = document.getElementById("tomorrowDateLabel");
let tomorrowWeatherImage = document.getElementById("tomorrowWeatherImage");
let weatherImage = document.getElementById("weatherImage");
let tomorrowDescriptionLabel = document.getElementById("tomorrowDescriptionLabel");
let tomorrowHighLabel = document.getElementById("tomorrowHighLabel");
let tomorrowHighValLabel = document.getElementById("tomorrowHighValLabel");
let tomorrowLowLabel = document.getElementById("tomorrowLowLabel");
let tomorrowLowValLabel = document.getElementById("tomorrowLowValLabel");

let day3DateLabel = document.getElementById("day3DateLabel");
let day3WeatherImage = document.getElementById("day3WeatherImage");
let day3Image = document.getElementById("day3Image");
let day3DescriptionLabel = document.getElementById("day3DescriptionLabel");
let day3HighLabel = document.getElementById("day3HighLabel");
let day3HighValLabel = document.getElementById("day3HighValLabel");
let day3LowLabel = document.getElementById("day3LowLabel");
let day3LowValLabel = document.getElementById("day3LowValLabel");

let didVib = false;
let show = "clock";
let weatherInterval = null;

// Heart Rate Monitor
let hrm = new HeartRateSensor();

messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  if (evt.data.key === "updateInterval" && evt.data.newValue) {
    settings.current.updateInterval = JSON.parse(evt.data.newValue).values[0].name
    settings.setUpdateInterval();
  }
  if (evt.data.key === "locationUpdateInterval" && evt.data.newValue) {
    settings.current.updateLocationInterval = JSON.parse(evt.data.newValue).values[0].name
    settings.setLocationUpdateInterval();
  }
  if (evt.data.key === "color" && evt.data.newValue) {
    settings.current.color = JSON.parse(evt.data.newValue);
    settings.setColor();
  }
  if (evt.data.key === "unitToggle" && evt.data.newValue) {
    settings.current.unitToggle = JSON.parse(evt.data.newValue) 
    settings.setUnit();
  }
  if (evt.data.key === "errorMessageToggle" && evt.data.newValue) {
    settings.current.errorMessageToggle = JSON.parse(evt.data.newValue);
    settings.setErrorMessage();
  }
  if (evt.data.key === "failCountToggle" && evt.data.newValue) {
    settings.current.failCountToggle = JSON.parse(evt.data.newValue);
    settings.setFailCount();
  }
  if (evt.data.key === "weatherScrollToggle" && evt.data.newValue) {
    settings.current.weatherScrollToggle = JSON.parse(evt.data.newValue);
    settings.setWeatherScroll();
  }
  if (evt.data.key === "locationScrollToggle" && evt.data.newValue) {
    settings.current.locationScrollToggle = JSON.parse(evt.data.newValue);
    settings.setLocationScroll();
  }
  settings.saveSettings();
};

// Message socket closes
messaging.peerSocket.close = () => {
  console.log("App Socket Closed");
};

//-------------------------------Update Functions-----------------

// Update the <text> element with the current time
function updateClock() {
  let today = new Date();
  let date = today.getDate();
  let day = today.getDay();
  let month = today.getMonth();
  let year = today.getYear()-100+2000;
  let hours = util.monoDigits(today.getHours());
  let mins = util.monoDigits(util.zeroPad(today.getMinutes()));
  let seconds = util.monoDigits(util.zeroPad(today.getSeconds()));

  dateLabel.text = `${util.toDay(day, "short")}, ${util.toMonth(month)} ${date}`;
  
  batteryLevelLabel.style.fill = util.goalToColor(battery.chargeLevel, 90)
  batteryLevelLabel.text = `${battery.chargeLevel}%`
  clockLabel.text = `${hours}:${mins}`;
  clockSecondsLabel.text = ':' + seconds;
}

function updateClockData() {
  if (show == "clock" && display.on) {
    if (deviceType == "Versa") {
      let data = {
        heart: {
          theHeartRate: hrm.heartRate ? hrm.heartRate : 0
        },
        step: {
          steps: today.adjusted.steps ? today.adjusted.steps: 0
        },
        cal: {
          cals: today.adjusted.calories ? today.adjusted.calories: 0
        }
      };
    } else {
      let data = {
        heart: {
          theHeartRate: hrm.heartRate ? hrm.heartRate : 0
        },
        step: {
          steps: today.adjusted.steps ? today.adjusted.steps: 0
        }
      };
    }

    hrLabel.style.fill = 'white';
    stepsLabel.style.fill = 'white';
    if (deviceType == "Versa")
      calsLabel.style.fill = 'white';
    
    
    if (data.heart.theHeartRate == 0) {
        hrLabel.text = `--`;
    } else {
        if (user.heartRateZone(data.heart.theHeartRate) == "out-of-range") {
          hrLabel.style.fill = 'fb-cyan';  // #14D3F5
        } else if (user.heartRateZone(data.heart.theHeartRate) == "fat-burn") {
          hrLabel.style.fill = 'fb-mint'; // #5BE37D
        } else if (user.heartRateZone(data.heart.theHeartRate) == "cardio") {
          hrLabel.style.fill = 'fb-peach'; // #FFCC33
        } else if (user.heartRateZone(data.heart.theHeartRate) == "peak") {
          hrLabel.style.fill = 'fb-red'; // #F83C40
        }
        hrLabel.text = `${data.heart.theHeartRate} bpm`;
    }
    
    stepsLabel.style.fill = util.goalToColor(data.step.steps, goals.steps);
    stepsLabel.text = `${data.step.steps.toLocaleString()} steps`;
    if (deviceType == "Versa") {
      calsLabel.style.fill = util.goalToColor(data.cal.cals, goals.calories);
      calsLabel.text = `${data.cal.cals.toLocaleString()} kcal`;
    }
  }
}

function updateStatsData() {
  if (show == "stats" && display.on) {
    if (deviceType == "Versa") {
      stepStatsLabel.style.fill = util.goalToColor(today.adjusted.steps, goals.steps);
      stepStatsLabel.text = "Steps:";
      stepGoalLabel.style.fill = util.goalToColor(today.adjusted.steps, goals.steps);
      stepGoalLabel.text = `${today.adjusted.steps ? today.adjusted.steps.toLocaleString() : 0} / ${goals.steps.toLocaleString()}`;
      
      distStatsLabel.style.fill = util.goalToColor(today.adjusted.distance, goals.distance);
      distStatsLabel.text = "Distance:";
      distGoalLabel.style.fill = util.goalToColor(today.adjusted.distance, goals.distance);
      if (units.distance == "us")
        distGoalLabel.text = `${today.adjusted.distance ? util.round2(today.adjusted.distance * 0.000621371) : 0 } / ${util.round2(goals.distance*0.000621371)}`;
      else
        distGoalLabel.text = `${today.adjusted.distance ? util.round2(today.adjusted.distance * 0.001) : 0 } / ${util.round2(goals.distance*0.001)}`;
      
      floorsStatsLabel.style.fill = util.goalToColor(today.adjusted.elevationGain, goals.elevationGain);
      floorsStatsLabel.text = "Floors:";
      floorsGoalLabel.style.fill = util.goalToColor(today.adjusted.elevationGain, goals.elevationGain);
      floorsGoalLabel.text = `${today.adjusted.elevationGain ? today.adjusted.elevationGain : 0} / ${goals.elevationGain}`;
      
      activeStatsLabel.style.fill = util.goalToColor(today.adjusted.activeMinutes, goals.activeMinutes);
      activeStatsLabel.text = "Active:";
      activeGoalLabel.style.fill = util.goalToColor(today.adjusted.activeMinutes, goals.activeMinutes);
      activeGoalLabel.text = `${today.adjusted.activeMinutes ? today.adjusted.activeMinutes.toLocaleString() : 0} / ${goals.activeMinutes}`;
 
      calsStatsLabel.style.fill = util.goalToColor(today.adjusted.calories, goals.calories);
      calsStatsLabel.text = "Calories:";
      calsGoalLabel.style.fill = util.goalToColor(today.adjusted.calories, goals.calories);
      calsGoalLabel.text = `${today.adjusted.calories ? today.adjusted.calories.toLocaleString() : 0} / ${parseInt(goals.calories).toLocaleString()}`;
    } 
    else {
      stepStatsLabel.style.fill = util.goalToColor(today.adjusted.steps, goals.steps);
      stepStatsLabel.text = `Steps: ${today.adjusted.steps ? today.adjusted.steps.toLocaleString() : 0} / ${goals.steps.toLocaleString()}`;

      // Multiply by .000621371 to convert from meters to miles
      distStatsLabel.style.fill = util.goalToColor(today.adjusted.distance, goals.distance);
       if (units.distance == "us")
         distStatsLabel.text = `Distance: ${today.adjusted.distance ? util.round2(today.adjusted.distance * 0.000621371) : 0 } / ${util.round2(goals.distance*0.000621371)}`;
       else
         distStatsLabel.text = `Distance: ${today.adjusted.distance ? util.round2(today.adjusted.distance * 0.001) : 0 } / ${util.round2(goals.distance*0.001)}`;

      floorsStatsLabel.style.fill = util.goalToColor(today.adjusted.elevationGain, goals.elevationGain);
      floorsStatsLabel.text = `Floors: ${today.adjusted.elevationGain ? today.adjusted.elevationGain : 0} / ${goals.elevationGain}`;

      activeStatsLabel.style.fill = util.goalToColor(today.adjusted.activeMinutes, goals.activeMinutes);
      activeStatsLabel.text = `Active: ${today.adjusted.activeMinutes ? today.adjusted.activeMinutes.toLocaleString() : 0} / ${goals.activeMinutes}`;

      calsStatsLabel.style.fill = util.goalToColor(today.adjusted.calories, goals.calories);
      calsStatsLabel.text = `Calories: ${today.adjusted.calories ? today.adjusted.calories.toLocaleString() : 0} / ${parseInt(goals.calories).toLocaleString()}`;
    }
  }
}
  
function updateForecastData() {
  if (show == "forecast" && display.on) {
    let today = new Date();
    let day = today.getDay()
    
    todayDateLabel.text  = "Today";
    console.log("Today Code: " + settings.runtime.weatherData.todayCondition)
    todayWeatherImage.href = util.getForecastIcon(settings.runtime.weatherData.todayCondition, 
                                                  settings.runtime.weatherData.tomorrowDescription);
    todayDescriptionLabel.text = util.shortenText(settings.runtime.weatherData.todayDescription);
    todayHighLabel.text = "High:"
    todayHighValLabel.text = settings.runtime.weatherData.todayHigh + "°"
    todayLowLabel.text = "Low:"
    todayLowValLabel.text = settings.runtime.weatherData.todayLow + "°"
    
    tomorrowDateLabel.text = util.toDay(day+1, "long");
    console.log("Tomorrow Code: " + settings.runtime.weatherData.tomorrowCondition)
    tomorrowWeatherImage.href = util.getForecastIcon(settings.runtime.weatherData.tomorrowCondition, 
                                                     settings.runtime.weatherData.tomorrowDescription);
    tomorrowDescriptionLabel.text = util.shortenText(settings.runtime.weatherData.tomorrowDescription);
    tomorrowHighLabel.text = "High:"
    tomorrowHighValLabel.text = settings.runtime.weatherData.tomorrowHigh + "°"
    tomorrowLowLabel.text = "Low:"
    tomorrowLowValLabel.text = settings.runtime.weatherData.tomorrowLow + "°"
    
    day3DateLabel.text = util.toDay(day+2, "long");
    console.log("day3 Code: " + settings.runtime.weatherData.day3Condition)
    day3WeatherImage.href = util.getForecastIcon(settings.runtime.weatherData.day3Condition, 
                                                     settings.runtime.weatherData.day3Description);
    day3DescriptionLabel.text = util.shortenText(settings.runtime.weatherData.day3Description);
    day3HighLabel.text = "High:"
    day3HighValLabel.text = settings.runtime.weatherData.day3High + "°"
    day3LowLabel.text = "Low:"
    day3LowValLabel.text = settings.runtime.weatherData.day3Low + "°"
  }
}

//------------------Event Handling--------------------

background.onclick = function(evt) {
  console.log("Click");
  let today = new Date();
  if (settings.runtime.fakeTime) time = "11:08a";
  if (show == "clock"){           // In Clock -> Switching to Stats
    show = "stats";
    updateStatsData()
    clockView.style.display = "none";
    statsView.style.display = "inline";
    forecastView.style.display = "none";
    console.log("stats Loaded");
    display.poke()
  } else if (show == "stats"){                   // In Stats -> Switching to forcast or schedule    
    if(settings.runtime.weatherData != null) {
      show = "forecast";
      updateClock();
      updateClockData();
      //weather.fetch();
      updateForecastData();
      clockView.style.display = "none";//test
      statsView.style.display = "none";
      forecastView.style.display = "inline";//test
      console.log("forecast Loaded");
    } else {
      show = "clock";
      updateClock();
      updateClockData();
      //weather.fetch();
      clockView.style.display = "inline";//test
      statsView.style.display = "none";
      forecastView.style.display = "none";
      console.log("Clock Loaded");
    } 
  } else {                                  // In Schedule -> Switching to Clock
    show = "clock";
    updateClock();
    updateClockData();
    //weather.fetch();
    clockView.style.display = "inline";//test
    statsView.style.display = "none";
    forecastView.style.display = "none";
    console.log("Clock Loaded");

  }
  //console.log("ShowClock is " + showClock);
}

display.onchange = function() {
  if (display.on) {
    let today = new Date();
    if (settings.runtime.fakeTime) time = "11:08a";
    hrm.start();
    show = "clock";
    updateClock();
    updateClockData();
    weather.fetch();
    clockView.style.display = "inline"; //test
    statsView.style.display = "none";
    forecastView.style.display = "none";
  } else {
    hrm.stop();
  }
}

//-----------------Startup------------------------

// Update the clock every tick event
clock.ontick = () => updateClock();
//clearInterval();
setInterval(updateClockData, 3*1000);


// Don't start with a blank screen
updateClock();
updateClockData();
weather.fetch();
hrm.start();

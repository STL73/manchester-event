import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";

// Manchester city centre on Open-Meteo (free, no key); the current values update every 15 minutes
export const weatherPlace = {
  label: "Manchester, UK",
  url: "https://api.open-meteo.com/v1/forecast?latitude=53.4808&longitude=-2.2426&current=temperature_2m,weather_code,is_day&timezone=Europe%2FLondon",
  refreshMs: 15 * 60 * 1000,
};

// WMO weather codes as Open-Meteo sends them, grouped: [highest code, words, day icon, night icon]
const weatherCodes = [
  [0, "Clear", Sun, Moon],
  [2, "Partly cloudy", CloudSun, CloudMoon],
  [3, "Overcast", Cloud, Cloud],
  [48, "Fog", CloudFog, CloudFog],
  [57, "Drizzle", CloudDrizzle, CloudDrizzle],
  [67, "Rain", CloudRain, CloudRain],
  [77, "Snow", CloudSnow, CloudSnow],
  [82, "Rain showers", CloudRain, CloudRain],
  [86, "Snow showers", CloudSnow, CloudSnow],
  [99, "Thunderstorm", CloudLightning, CloudLightning],
];

// The words and icon for a weather code, by day or night
export function describeWeather(code, isDay) {
  const [, condition, dayIcon, nightIcon] =
    weatherCodes.find(([highest]) => code <= highest) ?? weatherCodes.at(-1);
  return { condition, icon: isDay ? dayIcon : nightIcon };
}

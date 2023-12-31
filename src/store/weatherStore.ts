import { ref } from 'vue';
import { defineStore } from 'pinia';
import { fetch } from '@tauri-apps/api/http';

import { debounce } from '../utils/debounce';

import LocationDataRespons from '../interfaces/Location';
import WeatherDataResponse from '../interfaces/WeatherData';
import { AirPollutionDataResponse } from '../interfaces/AirPollutionData';
import ForecastDataRespose from '../interfaces/ForecastResponse';

const apiKey = '6199dc390cf859e69c70b175df0169a6';
const baseUrl = 'http://api.openweathermap.org';

export const useWeatherStore = defineStore('weather', () => {
  const autocompleteData = ref();
  const weatherData = ref();
  const airPollutionData = ref();
  const forecastDaily = ref();
  const forecastHourly = ref();

  const isLoading = ref(false);

  const handleAutoCompleteData = async (input: string) => {
    try {
      if (input !== '') {
        isLoading.value = true;
        const res = await fetch<LocationDataRespons>(
          `${baseUrl}/geo/1.0/direct?appid=${apiKey}&q=${input}&limit=3`
        );
        autocompleteData.value = res.data;
      } else {
        autocompleteData.value = undefined; // Установка в undefined, когда ввод пуст
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchData = async (lat: number, lon: number, type: string) => {
    try {
      if (type === 'weather') {
        isLoading.value = true;
        const res = await fetch<WeatherDataResponse>(
          `${baseUrl}/data/2.5/${type}?appid=${apiKey}&lat=${lat}&lon=${lon}&lang=ru&units=metric`
        );
        weatherData.value = res.data;
        isLoading.value = false;
      } else if (type === 'air_pollution') {
        isLoading.value = true;
        const res = await fetch<AirPollutionDataResponse>(
          `${baseUrl}/data/2.5/${type}?appid=${apiKey}&lat=${lat}&lon=${lon}&lang=ru&units=metric`
        );
        res.data.list.map((item) => {
          airPollutionData.value = item;
        });
        isLoading.value = false;
      } else if (type === 'forecast') {
        isLoading.value = true;

        const res = await fetch<ForecastDataRespose>(
          `${baseUrl}/data/2.5/${type}?appid=${apiKey}&lat=${lat}&lon=${lon}&lang=ru&units=metric`
        );

        forecastDaily.value = [];
        forecastHourly.value = [];

        for (let i = 7, len = res.data.list.length; i < len; i += 8) {
          forecastDaily.value.push(res.data.list[i]);
        }

        for (const [index, data] of res.data.list.entries()) {
          if (index > 7) break;
          forecastHourly.value.push(data);
        }
        isLoading.value = false;
      }
    } catch (error) {
      const errorMessage = 'Ошибка:';
      console.error(errorMessage, error);
    }
  };

  const debouncedAutoComplete = debounce(handleAutoCompleteData, 400);

  const fetchWeather = (lat: number, lon: number) => {
    fetchData(lat, lon, 'weather');
  };

  const fetchAirPollution = (lat: number, lon: number) => {
    fetchData(lat, lon, 'air_pollution');
  };

  const fetchForecast = (lat: number, lon: number) => {
    fetchData(lat, lon, 'forecast');
  };

  return {
    debouncedAutoComplete,
    fetchWeather,
    fetchAirPollution,
    fetchForecast,
    autocompleteData,
    weatherData,
    airPollutionData,
    forecastDaily,
    forecastHourly,
    isLoading,
  };
});

export interface MapWeatherPoint {
    latitude: number
    longitude: number
}

export interface CurrentWeather {
    requestedPoint: MapWeatherPoint
    dataPoint: MapWeatherPoint

    time: string

    temperature: number
    apparentTemperature: number
    relativeHumidity: number

    precipitation: number

    weatherCode: number
    cloudCover: number

    windSpeed: number
    windDirection: number

    isDay: boolean
}

export interface WeatherHour {
    time: string

    temperature: number
    apparentTemperature: number

    precipitationProbability: number
    precipitation: number

    weatherCode: number
    cloudCover: number

    windSpeed: number
    windDirection: number

    isDay: boolean
}

export interface WeatherDay {
    date: string

    weatherCode: number

    dayTemperature: number
    nightTemperature: number

    maximumTemperature: number
    minimumTemperature: number

    precipitationProbability: number
    precipitation: number

    sunrise: string
    sunset: string
}

export interface WeatherForecast {
    requestedPoint: MapWeatherPoint
    dataPoint: MapWeatherPoint

    timezone: string

    current: CurrentWeather

    days: WeatherDay[]
    hours: WeatherHour[]
}
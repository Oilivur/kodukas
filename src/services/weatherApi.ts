import type {
    CurrentWeather,
    MapWeatherPoint,
    WeatherDay,
    WeatherForecast,
    WeatherHour,
} from '@/types/weather'

const API_URL =
    'https://api.open-meteo.com/v1/forecast'

const CURRENT_FIELDS = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation',
    'weather_code',
    'cloud_cover',
    'wind_speed_10m',
    'wind_direction_10m',
    'is_day',
].join(',')

const HOURLY_FIELDS = [
    'temperature_2m',
    'apparent_temperature',
    'precipitation_probability',
    'precipitation',
    'weather_code',
    'cloud_cover',
    'wind_speed_10m',
    'wind_direction_10m',
    'is_day',
].join(',')

const DAILY_FIELDS = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_probability_max',
    'precipitation_sum',
    'sunrise',
    'sunset',
].join(',')

interface OpenMeteoCurrent {
    time: string

    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number

    precipitation: number

    weather_code: number
    cloud_cover: number

    wind_speed_10m: number
    wind_direction_10m: number

    is_day: number
}

interface OpenMeteoHourly {
    time: string[]

    temperature_2m: number[]
    apparent_temperature: number[]

    precipitation_probability:
        Array<number | null>

    precipitation: number[]

    weather_code: number[]
    cloud_cover: number[]

    wind_speed_10m: number[]
    wind_direction_10m: number[]

    is_day: number[]
}

interface OpenMeteoDaily {
    time: string[]

    weather_code: number[]

    temperature_2m_max: number[]
    temperature_2m_min: number[]

    precipitation_probability_max:
        Array<number | null>

    precipitation_sum: number[]

    sunrise: string[]
    sunset: string[]
}

interface OpenMeteoCurrentResponse {
    latitude: number
    longitude: number

    timezone: string

    current: OpenMeteoCurrent
}

interface OpenMeteoForecastResponse
    extends OpenMeteoCurrentResponse {
    hourly: OpenMeteoHourly
    daily: OpenMeteoDaily
}

function createBaseUrl(
    point: MapWeatherPoint,
): URL {
    const url =
        new URL(API_URL)

    url.searchParams.set(
        'latitude',
        point.latitude.toString(),
    )

    url.searchParams.set(
        'longitude',
        point.longitude.toString(),
    )

    /*
     * This is the behavior we want for map interaction:
     * use the closest available model grid cell.
     */
    url.searchParams.set(
        'cell_selection',
        'nearest',
    )

    url.searchParams.set(
        'timezone',
        'Europe/Tallinn',
    )

    url.searchParams.set(
        'temperature_unit',
        'celsius',
    )

    url.searchParams.set(
        'wind_speed_unit',
        'ms',
    )

    url.searchParams.set(
        'precipitation_unit',
        'mm',
    )

    return url
}

async function fetchJson<T>(
    url: URL,
    signal?: AbortSignal,
): Promise<T> {
    const response =
        await fetch(
            url,
            {
                signal,
            },
        )

    if (!response.ok) {
        throw new Error(
            `Weather request failed (${response.status})`,
        )
    }

    const data =
        await response.json()

    if (
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        data.error === true
    ) {
        throw new Error(
            typeof data.reason === 'string'
                ? data.reason
                : 'Weather API error',
        )
    }

    return data as T
}

function mapCurrentWeather(
    response: OpenMeteoCurrentResponse,
    requestedPoint: MapWeatherPoint,
): CurrentWeather {
    return {
        requestedPoint,

        dataPoint: {
            latitude:
            response.latitude,

            longitude:
            response.longitude,
        },

        time:
        response.current.time,

        temperature:
        response.current
            .temperature_2m,

        apparentTemperature:
        response.current
            .apparent_temperature,

        relativeHumidity:
        response.current
            .relative_humidity_2m,

        precipitation:
        response.current
            .precipitation,

        weatherCode:
        response.current
            .weather_code,

        cloudCover:
        response.current
            .cloud_cover,

        windSpeed:
        response.current
            .wind_speed_10m,

        windDirection:
        response.current
            .wind_direction_10m,

        isDay:
            response.current
                .is_day === 1,
    }
}

function mapHours(
    response: OpenMeteoForecastResponse,
): WeatherHour[] {
    return response.hourly.time.map(
        (time, index) => ({
            time,

            temperature:
                response.hourly
                    .temperature_2m[index],

            apparentTemperature:
                response.hourly
                    .apparent_temperature[index],

            precipitationProbability:
                response.hourly
                    .precipitation_probability[index]
                ?? 0,

            precipitation:
                response.hourly
                    .precipitation[index],

            weatherCode:
                response.hourly
                    .weather_code[index],

            cloudCover:
                response.hourly
                    .cloud_cover[index],

            windSpeed:
                response.hourly
                    .wind_speed_10m[index],

            windDirection:
                response.hourly
                    .wind_direction_10m[index],

            isDay:
                response.hourly
                    .is_day[index] === 1,
        }),
    )
}

function getDayNightTemperatures(
    date: string,
    hours: WeatherHour[],
    fallbackDay: number,
    fallbackNight: number,
) {
    const matchingHours =
        hours.filter(
            (hour) =>
                hour.time.startsWith(
                    date,
                ),
        )

    /*
     * "Day" here means roughly the useful daytime part of the day.
     * Sunrise/sunset-aware periods can replace this later.
     */
    const dayTemperatures =
        matchingHours
            .filter((hour) => {
                const hourNumber =
                    Number(
                        hour.time.slice(
                            11,
                            13,
                        ),
                    )

                return (
                    hourNumber >= 8 &&
                    hourNumber < 20
                )
            })
            .map(
                (hour) =>
                    hour.temperature,
            )

    const nightTemperatures =
        matchingHours
            .filter((hour) => {
                const hourNumber =
                    Number(
                        hour.time.slice(
                            11,
                            13,
                        ),
                    )

                return (
                    hourNumber < 8 ||
                    hourNumber >= 20
                )
            })
            .map(
                (hour) =>
                    hour.temperature,
            )

    return {
        dayTemperature:
            dayTemperatures.length > 0
                ? Math.max(
                    ...dayTemperatures,
                )
                : fallbackDay,

        nightTemperature:
            nightTemperatures.length > 0
                ? Math.min(
                    ...nightTemperatures,
                )
                : fallbackNight,
    }
}

function mapDays(
    response: OpenMeteoForecastResponse,
    hours: WeatherHour[],
): WeatherDay[] {
    return response.daily.time.map(
        (date, index) => {
            const maximumTemperature =
                response.daily
                    .temperature_2m_max[index]

            const minimumTemperature =
                response.daily
                    .temperature_2m_min[index]

            const {
                dayTemperature,
                nightTemperature,
            } =
                getDayNightTemperatures(
                    date,
                    hours,
                    maximumTemperature,
                    minimumTemperature,
                )

            return {
                date,

                weatherCode:
                    response.daily
                        .weather_code[index],

                dayTemperature,

                nightTemperature,

                maximumTemperature,

                minimumTemperature,

                precipitationProbability:
                    response.daily
                        .precipitation_probability_max[
                        index
                        ] ?? 0,

                precipitation:
                    response.daily
                        .precipitation_sum[index],

                sunrise:
                    response.daily
                        .sunrise[index],

                sunset:
                    response.daily
                        .sunset[index],
            }
        },
    )
}

export async function fetchCurrentWeather(
    point: MapWeatherPoint,
    signal?: AbortSignal,
): Promise<CurrentWeather> {
    const url =
        createBaseUrl(point)

    url.searchParams.set(
        'current',
        CURRENT_FIELDS,
    )

    const response =
        await fetchJson<
            OpenMeteoCurrentResponse
        >(
            url,
            signal,
        )

    return mapCurrentWeather(
        response,
        point,
    )
}

export async function fetchWeatherForecast(
    point: MapWeatherPoint,
    signal?: AbortSignal,
): Promise<WeatherForecast> {
    const url =
        createBaseUrl(point)

    url.searchParams.set(
        'current',
        CURRENT_FIELDS,
    )

    url.searchParams.set(
        'hourly',
        HOURLY_FIELDS,
    )

    url.searchParams.set(
        'daily',
        DAILY_FIELDS,
    )

    url.searchParams.set(
        'forecast_days',
        '7',
    )

    const response =
        await fetchJson<
            OpenMeteoForecastResponse
        >(
            url,
            signal,
        )

    const hours =
        mapHours(response)

    const days =
        mapDays(
            response,
            hours,
        )

    return {
        requestedPoint:
        point,

        dataPoint: {
            latitude:
            response.latitude,

            longitude:
            response.longitude,
        },

        timezone:
        response.timezone,

        current:
            mapCurrentWeather(
                response,
                point,
            ),

        days,
        hours,
    }
}
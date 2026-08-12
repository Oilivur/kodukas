export type WeatherIconKind =
    | 'sun'
    | 'moon'
    | 'cloud-sun'
    | 'cloud-moon'
    | 'cloud'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'thunder'

export function weatherIconKind(
    code: number,
    isDay = true,
): WeatherIconKind {
    if (code === 0) {
        return isDay
            ? 'sun'
            : 'moon'
    }

    if (code === 1) {
        return isDay
            ? 'sun'
            : 'moon'
    }

    if (code === 2) {
        return isDay
            ? 'cloud-sun'
            : 'cloud-moon'
    }

    if (code === 3) {
        return 'cloud'
    }

    if (
        code === 45 ||
        code === 48
    ) {
        return 'fog'
    }

    if (
        code === 51 ||
        code === 53 ||
        code === 55 ||
        code === 56 ||
        code === 57
    ) {
        return 'drizzle'
    }

    if (
        code === 61 ||
        code === 63 ||
        code === 65 ||
        code === 66 ||
        code === 67 ||
        code === 80 ||
        code === 81 ||
        code === 82
    ) {
        return 'rain'
    }

    if (
        code === 71 ||
        code === 73 ||
        code === 75 ||
        code === 77 ||
        code === 85 ||
        code === 86
    ) {
        return 'snow'
    }

    if (
        code === 95 ||
        code === 96 ||
        code === 99
    ) {
        return 'thunder'
    }

    return 'cloud'
}

export function weatherCodeLabel(
    code: number,
): string {
    switch (code) {
        case 0:
            return 'Selge'

        case 1:
            return 'Peamiselt selge'

        case 2:
            return 'Vahelduv pilvisus'

        case 3:
            return 'Pilves'

        case 45:
        case 48:
            return 'Udu'

        case 51:
            return 'Kerge uduvihm'

        case 53:
            return 'Uduvihm'

        case 55:
            return 'Tugev uduvihm'

        case 56:
        case 57:
            return 'Jäätuv uduvihm'

        case 61:
            return 'Kerge vihm'

        case 63:
            return 'Vihm'

        case 65:
            return 'Tugev vihm'

        case 66:
        case 67:
            return 'Jäätuv vihm'

        case 71:
            return 'Kerge lumesadu'

        case 73:
            return 'Lumesadu'

        case 75:
            return 'Tugev lumesadu'

        case 77:
            return 'Lumeterad'

        case 80:
            return 'Kerged vihmahood'

        case 81:
            return 'Vihmahood'

        case 82:
            return 'Tugevad vihmahood'

        case 85:
        case 86:
            return 'Lumehood'

        case 95:
            return 'Äike'

        case 96:
        case 99:
            return 'Äike ja rahe'

        default:
            return 'Ilm'
    }
}

export function windDirectionLabel(
    degrees: number,
): string {
    const directions = [
        'N',
        'NE',
        'E',
        'SE',
        'S',
        'SW',
        'W',
        'NW',
    ]

    const normalized =
        ((degrees % 360) + 360) %
        360

    const index =
        Math.round(
            normalized / 45,
        ) % 8

    return directions[index]
}

export function roundTemperature(
    temperature: number,
): string {
    return `${Math.round(temperature)}°`
}

export function formatCoordinate(
    coordinate: number,
): string {
    return coordinate.toFixed(3)
}
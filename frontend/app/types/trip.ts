export type Usage = 'light' | 'normal' | 'heavy';
export interface Member {
    name: string;
    paid: boolean;
    price: number;
}
export interface Stop {
    id: number;
    day: number;
    name: string;
    short: string;
    at: number[];
    time: string;
    stay: string;
    note: string;
    range: number[];
    photo: {
        src: string;
        alt: string;
        source: string;
        credit: string;
        license: string;
        licenseUrl: string;
        objectPosition: string;
    };
}
export interface TripDay {
    area: string;
    english: string;
    stops: Stop[];
}

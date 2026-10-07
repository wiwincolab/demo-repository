export type Usage = 'light' | 'normal' | 'heavy';
export interface Member {
    name: string;
    paid: boolean;
    price: number;
    // 有後端的真實群組：這一列是不是自己（只能替自己按購買）
    me?: boolean;
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
    transit?: string;
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
    lodging?: string;
    transport?: string;
    stops: Stop[];
}

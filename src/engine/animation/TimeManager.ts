type UnitsType = 'months' | 'days' | 'hours';

export default class TimeManager {
    public units: UnitsType;
    public dateBinding: Date = new Date();
    public rangeLen: number = 0;
    public dayStart: number = 0;

    constructor(units : UnitsType) {
        this.units = units;
    }
}
type UnitsType = 'months' | 'days' | 'hours';

export default class TimeManager {
    public units: UnitsType;
    public dateBinding: Date = new Date();
    public rangeLen: number = 0;
    public dayStart: number = 0;

    constructor(units : UnitsType) {
        this.units = units;
    }

    public addDays(days: number) {
        this.dateBinding.setDate(this.dateBinding.getDate() + days);
    }

    public getDateString(): string {
        return this.dateBinding.toLocaleString('default', { day: 'numeric', month: 'numeric', year: 'numeric' });   
    }
}
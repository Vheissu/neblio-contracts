export class AdapterBase {
    constructor() {
        this['client'] = null;
        this['db'] = null;
    }

    protected async create(): Promise<boolean> {
        return true;
    }

    protected async destroy(): Promise<boolean> {
        return true;
    }

    protected async loadState(): Promise<any> {
        throw new Error('Load state method not implemented in adapter');
    }

    protected async saveState(data: any): Promise<boolean | any> {
        throw new Error('Save state method not implemented in adapter');
    }

    protected async processBlock(block: any): Promise<any> {
        return true;
    }
}
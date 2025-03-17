export class stateManager {

    static states = {};
    static mongodb = null;

    static setState(key, data) {
        this.states[key] = data
    }
    static getState(key) {
        return this.states.hasOwnProperty(key) ? this.states[key] : null;
    }

    static init(states) {
        this.states = states
    }
    static setMongoInstance(instance)
    {
        stateManager.mongodb = instance
    }
}
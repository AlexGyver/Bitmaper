export default class Timer {
    #timer;

    start(handler, time) {
        this.stop();
        this.#timer = setTimeout(handler, time);
    }

    stop() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }
}
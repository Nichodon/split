import { Texture } from "./texture.mjs";

class Animated extends Texture {
    constructor(urls, reverse = false, length = 20) {
        super(urls[0], reverse);

        this.urls = urls;
        this.length = length;

        this.frame = 0;
        this.images = { ...urls };
    }

    load() {
        for (let i = 0; i < this.urls.length; i++) {
            this.images[i] = this.generate(this.urls[i], this.reverse);
        }
    }

    start() {
        this.frame = 0;
    }

    draw() {
        this.frame = this.frame === this.length * this.urls.length ? 1 : this.frame + 1;
        return this.images[Math.floor((this.frame - 1) / this.length)];
    }
}

export { Animated };
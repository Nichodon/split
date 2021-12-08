import { Camera } from './camera.mjs';
import { Player } from './player.mjs';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.element.getContext('2d');

        this.camera = new Camera();

        this.players = [];
        this.objects = [];

        this.stage = 'game';
    }

    addObject(object) {
        this.objects.push(object);
    }

    addPlayer(player) {
        this.players.push(player);
        this.addObject(player);
    }

    iter() {
        switch (this.stage) {
            case 'game':
                this.gameTick();
                break;
        }
    }

    gameTick() {
        this.players[0].tag = "P1";
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.input.check();

        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update();
        }

        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i].detectObject) {
                for (let j = 0; j < this.objects.length; j++) {
                    this.objects[i].detectObject(this.objects[j]);
                }
            }
        }

        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].move();
            this.draw(this.objects[i]);
        }

        this.camera.update(this.players);
    }

    draw(object) {
        let real = this.camera.zoom * this.canvas.width / 1000;

        this.context.drawImage(object.image,
            this.canvas.width / 2 + (object.pos.x - object.dim.w / 2 - this.camera.pos.x) * real,
            this.canvas.height / 2 + (object.pos.y - object.dim.h / 2 - this.camera.pos.y) * real,
            object.dim.w * real,
            object.dim.h * real);
        this.context.strokeStyle = object.touch && object.touch.bottom ? 'green' : 'red';
        let x1 = this.canvas.width / 2 + (object.box.left - this.camera.pos.x) * real;
        let x2 = this.canvas.width / 2 + (object.box.right - this.camera.pos.x) * real;
        let y1 = this.canvas.height / 2 + (object.box.top - this.camera.pos.y) * real;
        let y2 = this.canvas.height / 2 + (object.box.bottom - this.camera.pos.y) * real;
        this.context.strokeRect(x1, y1, x2 - x1, y2 - y1);
        this.context.strokeStyle = 'blue';
        return;
        this.context.strokeRect(
            this.canvas.width / 2 + (object.pos.x - object.dim.w / 2 - this.camera.pos.x) * real,
            this.canvas.height / 2 + (object.pos.y - object.dim.h / 2 - this.camera.pos.y) * real,
            object.dim.w * real,
            object.dim.h * real);
    }
}

export { Game, Camera, Player };
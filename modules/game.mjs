import { Camera } from './camera.mjs';
import { Player } from './player.mjs';

class Game {
    constructor(canvas) {
        this.canvas = canvas;

        this.context = canvas.element.getContext('2d');
        this.camera = new Camera();
        this.players = [];
        this.inputs = [];

        this.stage = 'wait';
        this.levels = [];
        this.level = -1;
        this.animate = 15;

        this.debug = false;

        this.combine = true;
    }

    start() {
        this.stage = 'game';
        this.level = -1;
        this.nextLevel();
    }

    addLevel(level) {
        this.levels.push(level);
    }

    resetLevel() {
        this.stage = 'game';
        let level = this.levels[this.level];
        let objects = level.objects.concat(this.players).concat([this.player]);

        for (let i = 0; i < objects.length; i++) {
            objects[i].init();
        }

        for (let i = 0; i < level.dialogues.length; i++) {
            level.dialogues[i].init();
        }

        if (!level.combine) {
            this.players[0].pos = { ...level.spawns[0].pos };
            this.players[1].pos = { ...level.spawns[1].pos };
        } else {
            this.player.pos = { ...level.spawns[0].pos };
        }

        this.combine = level.combine;
    }

    queueLevel() {
        this.stage = 'transition';
        this.animate = 30;
    }

    nextLevel() {
        this.level++;

        if (this.level === this.levels.length) {
            this.stage = 'win';
            return;
        }

        this.resetLevel();
        this.camera.snap(this.players);
    }

    addPlayer(player) {
        this.players.push(player);
    }

    addCombine(player) {
        this.player = player;
    }

    addInput(input) {
        this.inputs.push(input);
    }

    update() {
        switch (this.stage) {
            case 'game':
                this.animate = this.animate === 0 ? 0 : this.animate - 1;
                this.gameTick();
                break;
            case 'transition':
                this.animate--;
                this.refresh(1 - (this.animate - 15) / 15);
                if (this.animate === 15) {
                    this.nextLevel();
                }
                break;
        }
    }

    gameTick() {
        let level = this.levels[this.level];

        if (level.boss && level.boss.state === 'hostile' && this.combine) {
            this.combine = false;
            this.players[0].pos = {
                x: this.player.pos.x - 32,
                y: this.player.pos.y
            };
            this.players[0].vel = { x: -2, y: -16 };
            this.players[1].pos = {
                x: this.player.pos.x + 32,
                y: this.player.pos.y
            };
            this.players[1].vel = { x: 2, y: -16 };
        } else if (level.boss && level.boss.fade === 49 && !this.combine) {
            level.combiner.die(false);
        } else if (level.combiner && level.combiner.player && !this.combine) {
            this.combine = true;
            this.player.pos = { x: 1016, y: 400 };
            this.player.vel = { x: 0, y: 0 };
        }

        let objects = level.objects.concat(!this.combine ? this.players : [this.player]).filter(o => !o.dead);

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.inputs[0].check();
        this.inputs[1].check();
        this.inputs[2].check();
        this.inputs[3].check();

        for (let i = 0; i < objects.length; i++) {
            objects[i].update();
        }

        for (let i = 0; i < objects.length; i++) {
            if (objects[i].detectObject) {
                for (let j = 0; j < objects.length; j++) {
                    objects[i].detectObject(objects[j]);
                }
            }
        }

        for (let i = 0; i < objects.length; i++) {
            objects[i].move();
        }

        for (let i = 0; i < objects.length; i++) {
            if (objects[i].trigger) objects[i].trigger();
        }

        this.camera.update(!this.combine ? this.players : [this.player]);

        this.refresh(this.animate / 15);

        if (!this.combine) {
            if (this.players[0].fade === 0 || this.players[1].fade === 0) {
                this.resetLevel();
            } else if (level.goals[0].player && level.goals[1].player) {
                this.queueLevel();
            }
        } else {
            if (this.player.fade === 0) {
                this.resetLevel();
            } else if (level.goals[0].player) {
                this.queueLevel();
            }
        }

        if (!this.debug) return;

        let f = n => {
            if (Math.abs(n) < 0.001) n = 0;
            return n.toPrecision(4);
        }

        let debugInfo = [
            `SpLit Version 0.5`,
            ``,
            `Canvas Dimensions: ${f(this.canvas.width)}, ${f(this.canvas.height)}`,
            `Level: ${this.level + 1} / ${this.levels.length}`
        ];
        if (!this.combine) {
            debugInfo = debugInfo.concat([
                `Player 1`,
                `    pos: ${f(this.players[0].pos.x)}, ${f(this.players[0].pos.y)}`,
                `    vel: ${f(this.players[0].vel.x)}, ${f(this.players[0].vel.y)}`,
                `    touch`,
                `        top: ${this.players[0].touch.top ? 'true' : 'false'}`,
                `        bottom: ${this.players[0].touch.bottom ? 'true' : 'false'}`,
                `        left: ${this.players[0].touch.left ? 'true' : 'false'}`,
                `        right: ${this.players[0].touch.right ? 'true' : 'false'}`,
                `    state: ${this.players[0].state}`,
                `Player 2`,
                `    pos: ${f(this.players[1].pos.x)}, ${f(this.players[1].pos.y)}`,
                `    vel: ${f(this.players[1].vel.x)}, ${f(this.players[1].vel.y)}`,
                `    touch`,
                `        top: ${this.players[1].touch.top ? 'true' : 'false'}`,
                `        bottom: ${this.players[1].touch.bottom ? 'true' : 'false'}`,
                `        left: ${this.players[1].touch.left ? 'true' : 'false'}`,
                `        right: ${this.players[1].touch.right ? 'true' : 'false'}`,
                `    state: ${this.players[1].state}`
            ]);
        }
        debugInfo = debugInfo.concat([
            `Camera`,
            `    pos: ${f(this.camera.pos.x)}, ${f(this.camera.pos.y)}`,
            `    zoom: ${f(this.camera.zoom)}`,
            ``,
            `Debug Controls`,
            `    [P]: Toggle debug mode`,
            `    [8], [9], [0]: Throttle speed`,
            `    [,]: Restart level`,
            `    [.]: Skip level`
        ]);

        for (let i = 0; i < debugInfo.length; i++) {
            this.context.fillStyle = '#999';
            this.context.fillText(debugInfo[i], 51, i * 15 + 51);
            this.context.fillStyle = 'white';
            this.context.fillText(debugInfo[i], 50, i * 15 + 50);
        }

        this.context.strokeStyle = 'black';
        this.context.strokeRect(this.canvas.width / 2 - 1, this.canvas.height / 2 - 1, 3, 3);
    }

    refresh(screen = 0) {
        let level = this.levels[this.level];
        let objects = level.objects.concat(!this.combine ? this.players : [this.player]).filter(o => !o.dead);
        let ghosts = level.objects.concat(!this.combine ? this.players : [this.player]).filter(o => o.dead);
        let dialogues = level.dialogues.filter(d => d.active);

        this.background(level);

        for (let i = 0; i < objects.length; i++) {
            this.draw(objects[i]);
        }

        for (let i = 0; i < ghosts.length; i++) {
            this.draw(ghosts[i], ghosts[i].dying());
        }

        for (let i = 0; i < dialogues.length; i++) {
            dialogues[i].draw();
            this.draw(dialogues[i]);
        }

        if (screen) {
            this.context.save();
            this.context.globalAlpha = screen;
            this.context.fillStyle = 'black';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.restore();
        }
    }

    background(level) {
        let real = this.camera.zoom * this.canvas.width / 1000;

        let range = {};
        if (!this.combine) {
            range = {
                min: Math.min(this.players[0].pos.x, this.players[1].pos.x),
                max: Math.max(this.players[0].pos.x, this.players[1].pos.x)
            };
        } else {
            range = { min: this.player.pos.x, max: this.player.pos.x };
        }

        for (let x = 1024 * Math.floor(range.min / 1024 - 1);
            x < 1024 * Math.ceil(range.max / 1024 + 1); x += 1024) {
            this.context.drawImage(level.background.texture.draw(),
                this.canvas.width / 2 - this.camera.pos.x * real + x * real,
                this.canvas.height / 2 - this.camera.pos.y * real,
                1024 * real,
                1024 * real);
            this.context.fillStyle = level.background.colors[0];
            this.context.fillRect(
                this.canvas.width / 2 - this.camera.pos.x * real + x * real - 1,
                this.canvas.height / 2 - this.camera.pos.y * real - 1024 * real - 1,
                1024 * real + 3,
                1024 * real + 3);
            this.context.fillStyle = level.background.colors[1];
            this.context.fillRect(
                this.canvas.width / 2 - this.camera.pos.x * real + x * real - 1,
                this.canvas.height / 2 - this.camera.pos.y * real + 1024 * real - 1,
                1024 * real + 3,
                1024 * real + 3);
        }
    }

    draw(object, opacity = 1) {
        let real = this.camera.zoom * this.canvas.width / 1000;

        this.context.save();
        this.context.globalAlpha = opacity;

        this.context.drawImage(object.texture.draw(), 0, 0, object.texture.dim.w, object.texture.dim.h,
            this.canvas.width / 2 + (object.pos.x + object.offset.x - object.texture.dim.w / 2 - this.camera.pos.x) * real,
            this.canvas.height / 2 + (object.pos.y + object.offset.y - object.texture.dim.h / 2 - this.camera.pos.y) * real,
            object.texture.dim.w * real,
            object.texture.dim.h * real);

        this.context.restore();

        if (!this.debug || !object.box) return;

        this.context.strokeStyle = object.touch && object.touch.bottom ? 'green' : 'red';
        let x1 = this.canvas.width / 2 + (object.box.left - this.camera.pos.x) * real;
        let x2 = this.canvas.width / 2 + (object.box.right - this.camera.pos.x) * real;
        let y1 = this.canvas.height / 2 + (object.box.top - this.camera.pos.y) * real;
        let y2 = this.canvas.height / 2 + (object.box.bottom - this.camera.pos.y) * real;
        this.context.strokeRect(x1, y1, x2 - x1, y2 - y1);

        this.context.strokeStyle = 'blue';
        this.context.strokeRect(
            this.canvas.width / 2 + (object.pos.x - object.dim.w / 2 - this.camera.pos.x) * real,
            this.canvas.height / 2 + (object.pos.y - object.dim.h / 2 - this.camera.pos.y) * real,
            object.dim.w * real,
            object.dim.h * real);
    }
}

export { Game, Camera, Player };
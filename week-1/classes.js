class Ball {
    constructor(x, y, inputValue) {
        this.pos = new Vector(x, y);
        this.r = 160;
        this.v = new Vector(0, -1);
        this.message = inputValue;
    }

    fraction() {
        this.v.mult(0.99);
    }

    speedControl() {
        if (this.v.mag() > 1.5) {
            this.v.setMag(1.5);
        }
        if (this.v.mag() < 0.1) {
            this.v.setMag(0.1);
        }
    }

    applyForce(f) {
        this.v.add(f);
    }

    move() {
        this.pos.add(this.v);
    }

    edgeBounce() {
        if (this.pos.y <= this.r / 2) {
            this.v.y -= -0.5;
        }
        if (this.pos.x <= this.r / 2 || this.pos.x >= canvas.width - this.r / 2) {
            this.v.x -= -0.5;
        }
    }

    collide(other) {
        if (this.pos.dist(other.pos) <= this.r) {
            let pushBack = this.pos.sub(other.pos);
            // let heading = pushBack.heading();
            // this.v.setHeading(heading);
            pushBack.setMag(0.01);
            this.applyForce(pushBack);
        }
    }

    show(ctx) {
        ctx.fillStyle = 'none';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r*2/3, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fillText(this.message, this.pos.x-this.message.length*(window.innerWidth/100), this.pos.y+10);
        
    }
}


class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    sub(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    mult(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    div(scalar) {
        this.x /= scalar;
        this.y /= scalar;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    setMag(magnitude) {
        this.normalize();
        this.mult(magnitude);
    }

    normalize() {
        let magnitude = this.mag();
        this.div(magnitude);
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }

    setHeading(angle) {
        let magnitude = this.mag();
        this.x = magnitude * Math.cos(angle);
        this.y = magnitude * Math.sin(angle);
    }

    dist(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }

}
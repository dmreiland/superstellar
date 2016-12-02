import * as Utils from './utils.js';
import HealthBarFilter from './healthBarFilter';
import {globalState, renderer, stage} from './globals.js';
import MoveFilter from './moveFilter.js';

const healthBarRadius = 40;

export default class Spaceship {
  constructor(shipTexture, thrustAnimationFrames, data) {
    this.createHealthBarFilter();
    this.moveFilter = new MoveFilter(data.position, data.velocity);
    this.updateData(data);
    this.container = new PIXI.Container();
    this.sprite = new PIXI.Sprite(shipTexture);
    this.thrustAnimation = new PIXI.extras.MovieClip(thrustAnimationFrames);

    this.thrustAnimation.position.set(-27, 7);
    this.thrustAnimation.animationSpeed = 0.5;

    if (__DEBUG__) {
      this.collisionSphere = new PIXI.Graphics();
      this.collisionSphere.beginFill(0xFF77FF);
      this.collisionSphere.alpha = 0.3;
      this.collisionSphere.drawCircle(this.sprite.width / 2, this.sprite.height / 2, 20);
    }

    this.labelTextStyle = {
      fontFamily: 'Roboto',
      fontSize: '12px',
      fill: '#FFFFFF',
      align: 'center',
    };

    this.label = new PIXI.Text('', this.labelTextStyle);

    stage.addChild(this.container);
    this.container.addChild(this.sprite);
    this.container.addChild(this.thrustAnimation);
    this.addHealthBar();

    if (__DEBUG__) {
      this.container.addChild(this.collisionSphere);
    }

    stage.addChild(this.label);

    this.container.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
  }

  updateData({id, position, velocity, facing, inputThrust, hp, maxHp}) {
    this.id = id;
    this.moveFilter.update(position, velocity);
    this.facing = facing;
    this.inputThrust = inputThrust;
    this.hp = hp;
    this.maxHp = maxHp;
    this.updateHealthBar();
  }

  predict() {
    this.moveFilter.predict()
    this.position = this.moveFilter.position()
  }

  update(viewport) {
    if (this.inputThrust) {
      this.thrustAnimation.visible = true;
      this.thrustAnimation.play();
    } else {
      this.thrustAnimation.visible = false;
      this.thrustAnimation.stop();
    }

    const {x, y} = Utils.translateToViewport(
      this.position.x / 100,
      this.position.y / 100,
      viewport
    );

    this.container.position.set(x, y);

    if (this.isOutOfView(x, y, viewport)) {
      this.disableHealthBarFilter();
    } else {
      this.enableHealthBarFilter(x, y);
    }

    this.container.rotation = this.facing;

    if (globalState.clientId !== this.id) {
      this.label.text = globalState.clientIdToName.get(this.id);

      if (this.id === globalState.killedBy) {
        this.label.style.fill = '#FF0000'
      }

      this.label.position.set(x - (this.label.text.length * 6) / 2, y + this.sprite.height);
    }
  }

  isOutOfView(x, y, viewport) {
    return x - healthBarRadius < 0
      || y - healthBarRadius < 0
      || x + healthBarRadius > viewport.width
      || y + healthBarRadius > viewport.height;
  }

  addHealthBar() {
    this.healthBar = new PIXI.Graphics();
    this.healthBarRectangle = new PIXI.Rectangle(100, 100, healthBarRadius * 2, healthBarRadius * 2);
    this.healthBar.filterArea = this.healthBarRectangle;
    this.container.addChild(this.healthBar);
  }

  enableHealthBarFilter(x, y) {
    this.healthBarRectangle.x = x - healthBarRadius;
    this.healthBarRectangle.y = y - healthBarRadius;
    this.healthBar.filters = [this.healthBarFilter];
  }

  disableHealthBarFilter() {
    this.healthBar.filters = [];
  }

  createHealthBarFilter() {
    this.healthBarFilter = new HealthBarFilter();
  }

  updateHealthBar() {
    this.healthBarFilter.hps = [this.hp, this.maxHp];
  }

  remove() {
    stage.removeChild(this.container);
    stage.removeChild(this.label);
  }

  viewport() {
    return {
      vx: this.position.x / 100,
      vy: this.position.y / 100,
      width: renderer.width,
      height: renderer.height
    };
  }
}

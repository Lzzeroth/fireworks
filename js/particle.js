/**
 * 粒子类 - 表示烟花爆炸后的单个粒子
 */
export class Particle {
    constructor(x, y, color, velocity, config) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.gravity = config.gravity;
        this.friction = 0.98;
        this.fadeSpeed = Math.random() * 0.015 + 0.005;
        this.size = Math.random() * 2 + 2.5;
        
        // 形状模式相关属性
        this.isShapeMode = false;
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * 更新粒子状态
     */
    update() {
        // 应用速度
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 应用重力
        this.velocity.y += this.gravity;

        // 应用摩擦力
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // 渐隐效果
        this.alpha -= this.fadeSpeed;
    }

    /**
     * 绘制粒子
     */
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * 检查粒子是否已消失
     */
    isDead() {
        return this.alpha <= 0;
    }
}
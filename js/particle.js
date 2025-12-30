/**
 * 粒子类 - 表示烟花爆炸后的单个粒子
 */
export class Particle {
    constructor(x, y, color, velocity, config, depth = 1.0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.gravity = config.gravity;
        this.friction = 0.98;
        this.fadeSpeed = Math.random() * 0.015 + 0.005;
        
        // 深度属性 (0.3-1.0, 值越小越远)
        this.depth = depth;
        
        // 根据深度调整粒子大小 (远小近大)
        this.baseSize = Math.random() * 2 + 2.5;
        this.size = this.baseSize * this.depth;
        
        // 形状模式相关属性
        this.isShapeMode = false;
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * 更新粒子状态
     */
    update() {
        // 应用速度 (远处粒子移动速度视觉上更慢)
        this.x += this.velocity.x * this.depth;
        this.y += this.velocity.y * this.depth;

        // 应用重力 (远处粒子重力影响更小)
        this.velocity.y += this.gravity * this.depth;

        // 应用摩擦力
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // 渐隐效果 (远处粒子消失更快)
        this.alpha -= this.fadeSpeed * (1.5 - this.depth * 0.5);
    }

    /**
     * 绘制粒子
     */
    draw(ctx) {
        ctx.save();
        
        // 根据深度调整透明度 (远处更透明)
        ctx.globalAlpha = this.alpha * (0.4 + this.depth * 0.6);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 近景粒子添加光晕效果
        if (this.depth > 0.7) {
            ctx.globalAlpha = this.alpha * 0.3 * this.depth;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * 检查粒子是否已消失
     */
    isDead() {
        return this.alpha <= 0;
    }
}
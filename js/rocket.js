/**
 * 火箭类 - 表示升空的烟花火箭
 */
export class Rocket {
    constructor(startX, startY, targetX, targetY, config) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.config = config;
        
        // 计算飞行方向和速度
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 5; // 火箭速度（降低速度使升空更慢更真实）
        
        this.velocity = {
            x: (dx / distance) * speed,
            y: (dy / distance) * speed
        };
        
        // 火箭颜色（随机选择）
        const colors = ['#FFD700', '#FF6347', '#00CED1', '#FF1493', '#00FF00', '#FF8C00'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // 随机深度 (0.4-1.0)
        this.depth = Math.random() * 0.6 + 0.4;
        
        // 尾迹粒子
        this.trail = [];
        this.maxTrailLength = Math.floor(20 * this.depth); // 远处火箭尾迹更短
        
        // 状态
        this.exploded = false;
        this.reachedTarget = false;
    }

    /**
     * 更新火箭状态
     */
    update() {
        if (this.exploded) return;

        // 保存当前位置用于尾迹
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        
        // 限制尾迹长度
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 更新尾迹透明度
        this.trail.forEach((particle, index) => {
            particle.alpha = (index + 1) / this.trail.length;
        });

        // 更新位置
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 检查是否到达目标位置
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            this.reachedTarget = true;
        }
    }

    /**
     * 绘制火箭
     */
    draw(ctx) {
        if (this.exploded) return;

        // 绘制尾迹
        this.trail.forEach((particle, index) => {
            ctx.save();
            // 根据深度调整尾迹透明度
            ctx.globalAlpha = particle.alpha * 0.6 * (0.5 + this.depth * 0.5);
            ctx.fillStyle = this.color;
            // 根据深度调整尾迹大小
            const size = ((index + 1) / this.trail.length * 3) * this.depth;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 绘制火箭主体
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15 * this.depth;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        // 根据深度调整火箭大小
        ctx.arc(this.x, this.y, 4 * this.depth, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 绘制火箭光晕
        ctx.save();
        // 远处火箭光晕更弱
        ctx.globalAlpha = 0.3 * this.depth;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 * this.depth, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * 检查是否到达目标
     */
    hasReachedTarget() {
        return this.reachedTarget;
    }

    /**
     * 标记为已爆炸
     */
    explode() {
        this.exploded = true;
    }

    /**
     * 检查是否已爆炸
     */
    isExploded() {
        return this.exploded;
    }

    /**
     * 获取当前位置和深度
     */
    getPosition() {
        return { x: this.x, y: this.y, depth: this.depth };
    }
}
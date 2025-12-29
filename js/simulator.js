import { Firework } from './firework.js';
import { Rocket } from './rocket.js';
import { ShapeGenerator } from './shapes.js';

/**
 * 烟花模拟器主类
 */
export class FireworkSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fireworks = [];
        this.rockets = [];
        this.config = {
            particleCount: 80,
            explosionPower: 8,
            gravity: 0.15,
            trailLength: 0.15,
            shapeMode: true,
            customText: '新年快乐'
        };
        this.autoMode = false;
        this.autoModeInterval = null;
        
        // 性能统计
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();

        this.init();
    }

    /**
     * 初始化画布
     */
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * 创建烟花（带升空效果）
     */
    createFirework(x, y) {
        // 从屏幕底部发射火箭
        const startX = x;
        const startY = this.canvas.height;
        const rocket = new Rocket(startX, startY, x, y, this.config);
        this.rockets.push(rocket);
    }

    /**
     * 直接在指定位置创建烟花爆炸（无升空效果）
     */
    createFireworkDirect(x, y) {
        let shapeType = null;
        let customText = '';
        
        // 如果启用了形状模式，随机决定是否使用形状（30%概率）
        if (this.config.shapeMode && Math.random() < 0.3) {
            shapeType = ShapeGenerator.getRandomShape();
            if (shapeType === 'text') {
                customText = this.config.customText || '烟花';
            }
        }
        
        const firework = new Firework(x, y, this.config, shapeType, customText);
        this.fireworks.push(firework);
    }

    /**
     * 创建随机位置的烟花
     */
    createRandomFirework() {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * (this.canvas.height * 0.6) + this.canvas.height * 0.1;
        this.createFirework(x, y);
    }

    /**
     * 开启自动模式
     */
    startAutoMode() {
        if (this.autoMode) return;
        
        this.autoMode = true;
        this.autoModeInterval = setInterval(() => {
            const count = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    this.createRandomFirework();
                }, i * 200);
            }
        }, 1500);
    }

    /**
     * 停止自动模式
     */
    stopAutoMode() {
        this.autoMode = false;
        if (this.autoModeInterval) {
            clearInterval(this.autoModeInterval);
            this.autoModeInterval = null;
        }
    }

    /**
     * 切换自动模式
     */
    toggleAutoMode() {
        if (this.autoMode) {
            this.stopAutoMode();
        } else {
            this.startAutoMode();
        }
        return this.autoMode;
    }

    /**
     * 清空所有烟花和火箭
     */
    clear() {
        this.fireworks = [];
        this.rockets = [];
    }

    /**
     * 更新所有烟花和火箭
     */
    update() {
        // 更新FPS
        this.updateFPS();

        // 更新所有火箭
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            this.rockets[i].update();
            
            // 检查火箭是否到达目标位置
            if (this.rockets[i].hasReachedTarget() && !this.rockets[i].isExploded()) {
                const pos = this.rockets[i].getPosition();
                this.createFireworkDirect(pos.x, pos.y);
                this.rockets[i].explode();
                this.rockets.splice(i, 1);
            }
        }

        // 更新所有烟花
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            this.fireworks[i].update();
            
            // 移除已消失的烟花
            if (this.fireworks[i].isDead()) {
                this.fireworks.splice(i, 1);
            }
        }
    }

    /**
     * 更新FPS统计
     */
    updateFPS() {
        const currentTime = performance.now();
        this.frameCount++;

        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        this.lastFrameTime = currentTime;
    }

    /**
     * 绘制所有烟花和火箭
     */
    draw() {
        // 使用半透明黑色覆盖，创建拖尾效果
        this.ctx.fillStyle = `rgba(10, 10, 26, ${this.config.trailLength})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制所有火箭
        this.rockets.forEach(rocket => {
            rocket.draw(this.ctx);
        });

        // 绘制所有烟花
        this.fireworks.forEach(firework => {
            firework.draw(this.ctx);
        });
    }

    /**
     * 动画循环
     */
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    /**
     * 获取统计信息
     */
    getStats() {
        let totalParticles = 0;
        this.fireworks.forEach(firework => {
            totalParticles += firework.getParticleCount();
        });

        return {
            particleCount: totalParticles,
            fireworkCount: this.fireworks.length,
            rocketCount: this.rockets.length,
            fps: this.fps
        };
    }

    /**
     * 启动模拟器
     */
    start() {
        this.animate();
    }
}
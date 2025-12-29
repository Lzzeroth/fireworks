import { Particle } from './particle.js';
import { ShapeGenerator } from './shapes.js';

/**
 * 烟花类 - 管理单个烟花的爆炸效果
 */
export class Firework {
    constructor(x, y, config, shapeType = null, customText = '') {
        this.x = x;
        this.y = y;
        this.config = config;
        this.particles = [];
        this.exploded = false;
        this.shapeType = shapeType;
        this.customText = customText;
        this.shapeHoldTime = 0;
        this.maxShapeHoldTime = 60; // 形状保持60帧（约1秒）
        
        // 创建爆炸粒子
        this.createParticles();
    }

    /**
     * 创建爆炸粒子
     */
    createParticles() {
        let particleCount = this.config.particleCount;
        const text = this.customText || '烟花';
        
        // 获取屏幕尺寸用于适配
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth < 768;

        // 形状模式下增加粒子数量以保证清晰度
        if (this.shapeType) {
            if (this.shapeType === 'text') {
                // 文字需要更多粒子才能看清细节，根据字数动态调整
                // 基础粒子数 + 每个字额外增加粒子
                const baseParticles = isMobile ? 300 : 500;
                const particlesPerChar = isMobile ? 80 : 120;
                particleCount = Math.max(particleCount, baseParticles + text.length * particlesPerChar);
            } else {
                // 星星和心形也需要较多粒子来勾勒轮廓
                particleCount = Math.max(particleCount, isMobile ? 150 : 200);
            }
        }

        const colors = this.generateColors();
        
        // 如果是形状模式，使用形状生成器
        if (this.shapeType) {
            let positions = [];
            
            // 移动端适配缩放系数
            const baseScale = isMobile ? Math.min(screenWidth / 400, 1) : 1;
            
            switch (this.shapeType) {
                case 'heart':
                    // 调整心形大小
                    positions = ShapeGenerator.generateHeart(this.x, this.y, particleCount, 100 * baseScale);
                    break;
                case 'star':
                    // 调整星形大小
                    positions = ShapeGenerator.generateStar(this.x, this.y, particleCount, 50 * baseScale);
                    break;
                case 'text':
                    // 文字大小需要根据字数动态调整，防止超出屏幕
                    // 估算最大可用宽度 (屏幕宽度的 80%)
                    const maxTextWidth = screenWidth * 0.8;
                    // 基础字体大小
                    let fontSize = isMobile ? 60 : 100;
                    
                    // 估算总宽度 (假设字宽等于字高)
                    const estimatedTotalWidth = fontSize * text.length;
                    
                    // 如果超出最大宽度，缩小字体
                    if (estimatedTotalWidth > maxTextWidth) {
                        fontSize = maxTextWidth / text.length;
                    }
                    
                    positions = ShapeGenerator.generateText(this.x, this.y, text, particleCount, fontSize);
                    break;
            }
            
            // 为每个位置创建粒子
            positions.forEach(pos => {
                const velocity = {
                    x: 0,
                    y: 0
                };
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                const particle = new Particle(pos.x, pos.y, color, velocity, this.config);
                particle.targetX = pos.x;
                particle.targetY = pos.y;
                particle.isShapeMode = true;
                // 形状模式下粒子稍微大一点点
                particle.size = Math.random() * 1.5 + 2;
                this.particles.push(particle);
            });
        } else {
            // 普通圆形爆炸模式
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * this.config.explosionPower + 2;
                
                const velocity = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                };

                const color = colors[Math.floor(Math.random() * colors.length)];
                
                this.particles.push(
                    new Particle(this.x, this.y, color, velocity, this.config)
                );
            }
        }

        this.exploded = true;
    }

    /**
     * 生成随机颜色组合
     */
    generateColors() {
        const colorSchemes = [
            // 彩虹色系
            ['#FF0080', '#FF8C00', '#FFD700', '#00FF00', '#00CED1', '#4169E1', '#9370DB'],
            // 火焰色系
            ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFD700'],
            // 冰蓝色系
            ['#00FFFF', '#00CED1', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB'],
            // 紫粉色系
            ['#FF1493', '#FF69B4', '#DA70D6', '#BA55D3', '#9370DB', '#8A2BE2'],
            // 绿色系
            ['#00FF00', '#00FA9A', '#00FF7F', '#7FFF00', '#ADFF2F', '#7CFC00'],
            // 金色系
            ['#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347', '#FF4500'],
            // 银色系
            ['#FFFFFF', '#F0F8FF', '#E6E6FA', '#D8BFD8', '#DDA0DD', '#EE82EE']
        ];

        return colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    }

    /**
     * 更新烟花状态
     */
    update() {
        // 如果是形状模式且还在保持形状阶段
        if (this.shapeType && this.shapeHoldTime < this.maxShapeHoldTime) {
            this.shapeHoldTime++;
            
            // 在形状保持阶段，粒子不移动，只更新透明度
            this.particles.forEach(particle => {
                if (particle.isShapeMode) {
                    // 保持在目标位置
                    particle.x = particle.targetX;
                    particle.y = particle.targetY;
                    // 不应用重力和速度
                }
            });
            
            return;
        }
        
        // 形状保持时间结束后，让粒子开始下落
        if (this.shapeType && this.shapeHoldTime === this.maxShapeHoldTime) {
            this.particles.forEach(particle => {
                if (particle.isShapeMode) {
                    // 给粒子一个随机的初始速度，让它们散开
                    // 减小散开速度，让形状保留更久一点
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 1.5 + 0.5;
                    particle.velocity.x = Math.cos(angle) * speed;
                    particle.velocity.y = Math.sin(angle) * speed;
                    particle.isShapeMode = false;
                }
            });
            this.shapeHoldTime++;
        }
        
        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            // 移除已消失的粒子
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * 绘制烟花
     */
    draw(ctx) {
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });
    }

    /**
     * 检查烟花是否已完全消失
     */
    isDead() {
        return this.particles.length === 0;
    }

    /**
     * 获取当前粒子数量
     */
    getParticleCount() {
        return this.particles.length;
    }
}
/**
 * 形状生成器 - 用于生成特殊形状的粒子位置
 */
export class ShapeGenerator {
    /**
     * 生成心形粒子位置
     * @param {number} centerX - 中心X坐标
     * @param {number} centerY - 中心Y坐标
     * @param {number} particleCount - 粒子数量
     * @param {number} size - 形状大小
     * @returns {Array} 粒子位置数组
     */
    static generateHeart(centerX, centerY, particleCount, size = 100) {
        const positions = [];
        const scale = size / 100 * 2.5; // 增大心形尺寸到2.5倍
        
        for (let i = 0; i < particleCount; i++) {
            const t = (i / particleCount) * Math.PI * 2;
            
            // 心形参数方程
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            
            positions.push({
                x: centerX + x * scale,
                y: centerY + y * scale
            });
        }
        
        return positions;
    }

    /**
     * 生成星形粒子位置
     * @param {number} centerX - 中心X坐标
     * @param {number} centerY - 中心Y坐标
     * @param {number} particleCount - 粒子数量
     * @param {number} size - 形状大小
     * @param {number} points - 星形角数
     * @returns {Array} 粒子位置数组
     */
    static generateStar(centerX, centerY, particleCount, size = 100, points = 5) {
        const positions = [];
        const outerRadius = size;
        const innerRadius = size * 0.382; // 调整内径比例，使星星更尖锐好看
        const angleStep = Math.PI / points;
        
        // 生成所有顶点
        const vertices = [];
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * angleStep - Math.PI / 2; // 从上方开始
            vertices.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
        // 闭合路径，将第一个点加到末尾方便计算
        vertices.push(vertices[0]);

        // 在边上均匀分布粒子
        const totalEdges = points * 2;
        const particlesPerEdge = Math.floor(particleCount / totalEdges);
        const remainingParticles = particleCount - (particlesPerEdge * totalEdges);
        
        for (let i = 0; i < totalEdges; i++) {
            const start = vertices[i];
            const end = vertices[i+1];
            
            // 当前边分配的粒子数（将剩余粒子分配给前几条边）
            const count = particlesPerEdge + (i < remainingParticles ? 1 : 0);
            
            for (let j = 0; j < count; j++) {
                const t = j / count;
                positions.push({
                    x: start.x + (end.x - start.x) * t,
                    y: start.y + (end.y - start.y) * t
                });
            }
        }
        
        return positions;
    }

    /**
     * 生成文字形状粒子位置
     * @param {number} centerX - 中心X坐标
     * @param {number} centerY - 中心Y坐标
     * @param {string} text - 要显示的文字
     * @param {number} particleCount - 粒子数量
     * @param {number} fontSize - 字体大小
     * @returns {Array} 粒子位置数组
     */
    static generateText(centerX, centerY, text, particleCount, fontSize = 80) {
        const positions = [];
        
        // 创建临时canvas用于文字渲染
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 使用高分辨率渲染以获得更好的细节
        const renderScale = 2; 
        const renderFontSize = fontSize * renderScale;
        
        // 动态设置canvas大小，确保能容纳所有文字
        // 预估宽度：字数 * 字体大小 * 1.5 (留足余量)
        const estimatedWidth = Math.max(text.length * renderFontSize * 1.5, 1000);
        canvas.width = estimatedWidth;
        canvas.height = renderFontSize * 3; // 高度留足空间
        
        // 设置字体
        ctx.font = `bold ${renderFontSize}px Arial, "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        
        // 绘制文字
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // 收集所有非透明像素的位置
        const textPixels = [];
        // 动态调整采样步长
        // 字体越大，步长可以越大，保持总采样点数量合理
        const step = Math.max(2, Math.floor(renderFontSize / 20)); 
        
        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const index = (y * canvas.width + x) * 4;
                const alpha = pixels[index + 3];
                
                if (alpha > 128) {
                    // 将坐标还原回实际尺寸
                    // (x - center) / renderScale
                    textPixels.push({
                        x: (x - canvas.width / 2) / renderScale,
                        y: (y - canvas.height / 2) / renderScale
                    });
                }
            }
        }
        
        // 随机打乱像素数组，确保取样均匀
        for (let i = textPixels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [textPixels[i], textPixels[j]] = [textPixels[j], textPixels[i]];
        }
        
        // 从打乱后的像素中选择指定数量的粒子
        if (textPixels.length > 0) {
            for (let i = 0; i < particleCount; i++) {
                // 如果粒子数多于像素数，循环使用
                const pixel = textPixels[i % textPixels.length];
                positions.push({
                    x: centerX + pixel.x,
                    y: centerY + pixel.y
                });
            }
        } else {
            // 如果没有找到文字像素，返回圆形分布
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const radius = 50;
                positions.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                });
            }
        }
        
        return positions;
    }

    /**
     * 随机选择一个形状类型
     * @returns {string} 形状类型
     */
    static getRandomShape() {
        const shapes = ['heart', 'star', 'text'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
}
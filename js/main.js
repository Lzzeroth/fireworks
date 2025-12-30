import { FireworkSimulator } from './simulator.js';

/**
 * 主程序入口
 */
class App {
    constructor() {
        this.canvas = document.getElementById('fireworksCanvas');
        this.simulator = new FireworkSimulator(this.canvas);
        
        // UI元素
        this.particleCountSlider = document.getElementById('particleCount');
        this.particleCountValue = document.getElementById('particleCountValue');
        this.explosionPowerSlider = document.getElementById('explosionPower');
        this.explosionPowerValue = document.getElementById('explosionPowerValue');
        this.gravitySlider = document.getElementById('gravity');
        this.gravityValue = document.getElementById('gravityValue');
        this.trailLengthSlider = document.getElementById('trailLength');
        this.trailLengthValue = document.getElementById('trailLengthValue');
        this.shapeModeCheckbox = document.getElementById('shapeMode');
        this.autoFireworkCountSlider = document.getElementById('autoFireworkCount');
        this.autoFireworkCountValue = document.getElementById('autoFireworkCountValue');
        this.customTextInput = document.getElementById('customText');
        this.autoModeBtn = document.getElementById('autoModeBtn');
        
        // 统计元素
        this.particleStats = document.getElementById('particleStats');
        this.fireworkStats = document.getElementById('fireworkStats');
        this.fpsStats = document.getElementById('fpsStats');

        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.bindEvents();
        this.simulator.start();
        this.startStatsUpdate();
        
        // 启动默认自动模式
        this.simulator.startAutoMode();
        this.autoModeBtn.textContent = '⏸️ 停止自动';
        this.autoModeBtn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        
        // 显示欢迎烟花
        this.showWelcomeFireworks();
    }

    /**
     * 显示欢迎烟花
     */
    showWelcomeFireworks() {
        setTimeout(() => {
            const positions = [
                { x: window.innerWidth * 0.3, y: window.innerHeight * 0.3 },
                { x: window.innerWidth * 0.5, y: window.innerHeight * 0.25 },
                { x: window.innerWidth * 0.7, y: window.innerHeight * 0.35 }
            ];

            positions.forEach((pos, index) => {
                setTimeout(() => {
                    this.simulator.createFirework(pos.x, pos.y);
                }, index * 300);
            });
        }, 500);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 控制面板交互优化
        const controlPanel = document.querySelector('.control-panel');
        const panelHeader = document.querySelector('.panel-header');
        
        if (controlPanel && panelHeader) {
            // 悬停交互（移除屏幕宽度限制，确保在所有支持鼠标的设备上都能生效）
            controlPanel.addEventListener('mouseenter', () => {
                controlPanel.classList.remove('collapsed');
            });
            
            controlPanel.addEventListener('mouseleave', () => {
                controlPanel.classList.add('collapsed');
            });
            
            // 点击标题切换展开/收起（移动端主要交互方式）
            panelHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                controlPanel.classList.toggle('collapsed');
            });
            
            // 防止点击控制面板内容时触发画布点击
            controlPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // 触摸事件防穿透
            controlPanel.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        // 统计信息面板交互（移动端点击切换）
        const statsPanel = document.querySelector('.stats');
        if (statsPanel) {
            // 点击切换展开/收起
            statsPanel.addEventListener('click', (e) => {
                e.stopPropagation();
                statsPanel.classList.toggle('expanded');
            });
            
            // 触摸事件防穿透
            statsPanel.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        // 画布点击事件
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.simulator.createFirework(x, y);
        });

        // 粒子数量滑块
        this.particleCountSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.particleCountValue.textContent = value;
            this.simulator.updateConfig({ particleCount: value });
        });

        // 爆炸强度滑块
        this.explosionPowerSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.explosionPowerValue.textContent = value;
            this.simulator.updateConfig({ explosionPower: value });
        });

        // 重力滑块
        this.gravitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.gravityValue.textContent = value.toFixed(2);
            this.simulator.updateConfig({ gravity: value });
        });

        // 拖尾长度滑块
        this.trailLengthSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.trailLengthValue.textContent = value.toFixed(2);
            this.simulator.updateConfig({ trailLength: value });
        });

        // 形状模式复选框
        this.shapeModeCheckbox.addEventListener('change', (e) => {
            this.simulator.updateConfig({ shapeMode: e.target.checked });
        });

        // 自动烟花数量滑块
        this.autoFireworkCountSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.autoFireworkCountValue.textContent = value;
            this.simulator.updateConfig({ autoFireworkCount: value });
        });

        // 自定义文字输入框
        this.customTextInput.addEventListener('input', (e) => {
            this.simulator.updateConfig({ customText: e.target.value });
        });

        // 自动模式按钮
        this.autoModeBtn.addEventListener('click', () => {
            const isAutoMode = this.simulator.toggleAutoMode();
            this.autoModeBtn.textContent = isAutoMode ? '⏸️ 停止自动' : '🚀 自动模式';
            this.autoModeBtn.style.background = isAutoMode 
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.simulator.createRandomFirework();
                    break;
                case 'a':
                    this.simulator.toggleAutoMode();
                    break;
            }
        });
    }

    /**
     * 处理画布点击
     */
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.simulator.createFirework(x, y);
    }

    /**
     * 开始更新统计信息
     */
    startStatsUpdate() {
        setInterval(() => {
            const stats = this.simulator.getStats();
            this.particleStats.textContent = stats.particleCount;
            this.fireworkStats.textContent = stats.fireworkCount;
            this.fpsStats.textContent = stats.fps;
        }, 100);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
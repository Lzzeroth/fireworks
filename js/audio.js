/**
 * 音效管理器 - 管理烟花音效的播放
 */
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3; // 默认音量
        
        // 初始化音频上下文（需要用户交互后才能启用）
        this.initAudioContext();
    }

    /**
     * 初始化音频上下文
     */
    initAudioContext() {
        try {
            // 创建音频上下文
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (e) {
            console.warn('音频上下文初始化失败:', e);
        }
    }

    /**
     * 恢复音频上下文（用户交互后调用）
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.warn('音频上下文恢复失败:', e);
            }
        }
    }

    /**
     * 播放火箭升空音效
     * @param {number} duration - 音效持续时间（秒），默认为0.8秒
     * @param {number} depth - 深度值（0.3-1.0），默认为1.0，值越小越远，音量越小
     */
    playLaunchSound(duration = 0.8, depth = 1.0) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            // 确保最小持续时间为0.5秒，最大为3秒
            const soundDuration = Math.max(0.5, Math.min(3, duration));

            // 根据深度计算音量系数 (0.3-1.0 -> 0.01-1.0)
            // 增强远近差别：使用指数函数让远处音量更小，近处音量更大
            const depthVolume = Math.pow((depth - 0.3) / 0.7, 1.8);

            // 创建白噪声缓冲区（模拟气流声）
            const bufferSize = ctx.sampleRate * soundDuration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // 生成白噪声
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            // 创建噪声源
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // 创建带通滤波器 - 保留中低频，模拟低沉的"嗖"声
            const bandpassFilter = ctx.createBiquadFilter();
            bandpassFilter.type = 'bandpass';
            // 中心频率从300Hz降到150Hz，营造低沉的气流声
            bandpassFilter.frequency.setValueAtTime(300, now);
            bandpassFilter.frequency.exponentialRampToValueAtTime(150, now + soundDuration);
            bandpassFilter.Q.value = 1.5; // 适中的Q值，保持自然

            // 创建低通滤波器 - 进一步柔化声音，去除尖锐感
            const lowpassFilter = ctx.createBiquadFilter();
            lowpassFilter.type = 'lowpass';
            lowpassFilter.frequency.setValueAtTime(800, now);
            lowpassFilter.frequency.exponentialRampToValueAtTime(400, now + soundDuration);
            lowpassFilter.Q.value = 0.5;

            // 创建增益节点
            const noiseGain = ctx.createGain();

            // 连接节点：噪声 -> 带通滤波 -> 低通滤波 -> 增益 -> 输出
            noise.connect(bandpassFilter);
            bandpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            // 音量包络 - 快速起音，缓慢衰减，模拟真实的"嗖"声
            noiseGain.gain.setValueAtTime(0, now);
            // 快速达到峰值（0.03秒内）
            noiseGain.gain.linearRampToValueAtTime(this.volume * 0.5 * depthVolume, now + 0.03);
            // 缓慢衰减
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + soundDuration);

            // 播放
            noise.start(now);
            noise.stop(now + soundDuration);
        } catch (e) {
            console.warn('播放升空音效失败:', e);
        }
    }

    /**
     * 播放烟花爆炸音效
     * @param {number} depth - 深度值（0.3-1.0），默认为1.0，值越小越远，音量越小
     */
    playExplosionSound(depth = 1.0) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // 根据深度计算音量系数 (0.3-1.0 -> 0.02-1.0)
            // 远处的烟花音量更小，近处的音量更大，增强立体听觉体验
            const depthVolume = 0.02 + (depth - 0.3) * (0.9 / 0.7);

            // 延长音效持续时间，使消散更自然
            const mainDuration = 1.2; // 主音效持续时间从0.5秒延长到1.2秒
            const echoDuration = 0.8; // 回声持续时间

            // 创建白噪声缓冲区
            const bufferSize = ctx.sampleRate * mainDuration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // 生成白噪声
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            // 创建音频节点
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + mainDuration);
            filter.Q.value = 1;

            const gainNode = ctx.createGain();

            // 连接节点
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            // 优化音量包络 - 模拟爆炸的"砰"声及自然消散
            // 应用深度音量系数
            gainNode.gain.setValueAtTime(0, now);
            // 快速达到峰值
            gainNode.gain.linearRampToValueAtTime(this.volume * 5 * depthVolume, now + 0.01);
            // 快速衰减到中等音量
            gainNode.gain.exponentialRampToValueAtTime(this.volume * 1.5 * depthVolume, now + 0.15);
            // 缓慢自然消散
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + mainDuration);

            // 播放
            noise.start(now);
            noise.stop(now + mainDuration);

            // 添加延迟回声效果
            this.playExplosionEcho(now + 0.08, depthVolume, echoDuration);

            // 添加低频轰鸣效果（延长持续时间）
            this.playExplosionBass(now, depthVolume);
        } catch (e) {
            console.warn('播放爆炸音效失败:', e);
        }
    }

    /**
     * 播放爆炸回声效果
     * @param {number} startTime - 开始时间
     * @param {number} depthVolume - 深度音量系数
     * @param {number} duration - 持续时间
     */
    playExplosionEcho(startTime, depthVolume = 1.0, duration = 0.8) {
        try {
            const ctx = this.audioContext;
            const now = startTime;

            // 创建回声噪声缓冲区
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // 生成白噪声
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // 低通滤波器 - 回声音色更柔和
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + duration);
            filter.Q.value = 0.5;

            const gainNode = ctx.createGain();

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            // 回声音量包络 - 从较小音量开始，缓慢消散
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.8 * depthVolume, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {
            console.warn('播放回声效果失败:', e);
        }
    }

    /**
     * 播放爆炸低频效果
     * @param {number} startTime - 开始时间
     * @param {number} depthVolume - 深度音量系数
     */
    playExplosionBass(startTime, depthVolume = 1.0) {
        try {
            const ctx = this.audioContext;
            const now = startTime || ctx.currentTime;

            // 延长低频持续时间，使其更自然
            const bassDuration = 0.6; // 从0.3秒延长到0.6秒

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // 低频轰鸣
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(80, now);
            oscillator.frequency.exponentialRampToValueAtTime(30, now + bassDuration);

            // 优化音量包络 - 更自然的衰减
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 4.5 * depthVolume, now + 0.02);
            // 保持一段时间后再衰减
            gainNode.gain.linearRampToValueAtTime(this.volume * 2 * depthVolume, now + 0.15);
            // 缓慢消散
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + bassDuration);

            oscillator.start(now);
            oscillator.stop(now + bassDuration);
        } catch (e) {
            console.warn('播放低频效果失败:', e);
        }
    }

    /**
     * 播放形状烟花的噼啪音效
     * @param {number} depth - 深度值（0.3-1.0），默认为1.0，值越小越远，音量越小
     */
    playCrackleSound(depth = 1.0) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // 根据深度计算音量系数
            const depthVolume = Math.pow((depth - 0.3) / 0.7, 1.5);

            // 噼啪音效持续时间
            const totalDuration = 1.2;

            // 创建多个短促的噼啪声，模拟真实的烟花噼啪效果
            const crackleCount = 8 + Math.floor(Math.random() * 5); // 8-12个噼啪声
            
            for (let i = 0; i < crackleCount; i++) {
                // 随机延迟，让噼啪声分散在时间轴上
                const delay = Math.random() * totalDuration * 0.8;
                const crackleTime = now + delay;
                
                // 每个噼啪声的持续时间
                const crackleDuration = 0.05 + Math.random() * 0.08;
                
                // 创建白噪声
                const bufferSize = ctx.sampleRate * crackleDuration;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let j = 0; j < bufferSize; j++) {
                    data[j] = Math.random() * 2 - 1;
                }
                
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                // 高通滤波器 - 保留高频，模拟清脆的噼啪声
                const highpassFilter = ctx.createBiquadFilter();
                highpassFilter.type = 'highpass';
                highpassFilter.frequency.value = 2000 + Math.random() * 2000; // 2000-4000Hz
                highpassFilter.Q.value = 0.5;
                
                // 带通滤波器 - 增强特定频率
                const bandpassFilter = ctx.createBiquadFilter();
                bandpassFilter.type = 'bandpass';
                bandpassFilter.frequency.value = 3000 + Math.random() * 3000; // 3000-6000Hz
                bandpassFilter.Q.value = 2;
                
                const gainNode = ctx.createGain();
                
                // 连接节点
                noise.connect(highpassFilter);
                highpassFilter.connect(bandpassFilter);
                bandpassFilter.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                // 音量包络 - 快速起音，快速衰减
                const randomVolume = 0.3 + Math.random() * 0.4; // 随机音量变化
                gainNode.gain.setValueAtTime(0, crackleTime);
                gainNode.gain.linearRampToValueAtTime(
                    this.volume * randomVolume * depthVolume, 
                    crackleTime + 0.005
                );
                gainNode.gain.exponentialRampToValueAtTime(
                    0.001, 
                    crackleTime + crackleDuration
                );
                
                // 播放
                noise.start(crackleTime);
                noise.stop(crackleTime + crackleDuration);
            }
            
            // 添加低频轰鸣尾音，模拟余韵
            this.playCrackleRumble(now + 0.1, depthVolume, totalDuration * 0.8);
            
        } catch (e) {
            console.warn('播放噼啪音效失败:', e);
        }
    }

    /**
     * 播放噼啪音效的低频余韵
     * @param {number} startTime - 开始时间
     * @param {number} depthVolume - 深度音量系数
     * @param {number} duration - 持续时间
     */
    playCrackleRumble(startTime, depthVolume = 1.0, duration = 1.0) {
        try {
            const ctx = this.audioContext;
            const now = startTime;

            // 创建低频噪声
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            // 低通滤波器
            const lowpassFilter = ctx.createBiquadFilter();
            lowpassFilter.type = 'lowpass';
            lowpassFilter.frequency.setValueAtTime(400, now);
            lowpassFilter.frequency.exponentialRampToValueAtTime(100, now + duration);
            lowpassFilter.Q.value = 0.5;
            
            const gainNode = ctx.createGain();
            
            noise.connect(lowpassFilter);
            lowpassFilter.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // 音量包络 - 缓慢起音，缓慢消散
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(
                this.volume * 0.15 * depthVolume, 
                now + 0.1
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                now + duration
            );
            
            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {
            console.warn('播放噼啪余韵失败:', e);
        }
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 启用/禁用音效
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 获取音效状态
     */
    isEnabled() {
        return this.enabled;
    }
}
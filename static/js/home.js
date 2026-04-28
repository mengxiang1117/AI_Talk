// AI_Talk 风格选择主页交互

document.addEventListener('DOMContentLoaded', () => {
    const titleWords = document.querySelectorAll('.title-word');
    const cards = document.querySelectorAll('.style-card');

    // 风格配色
    const styleColors = {
        warm: {
            gradient: 'linear-gradient(135deg, #ff9a56, #ff6b6b, #feca57, #ff9a56)',
            textShadow: '0 0 40px rgba(255, 107, 107, 0.5)'
        },
        emo: {
            gradient: 'linear-gradient(135deg, #667eea, #764ba2, #a8b4f5, #667eea)',
            textShadow: '0 0 40px rgba(102, 126, 234, 0.5)'
        },
        dark: {
            gradient: 'linear-gradient(135deg, #a02020, #ff4444, #a02020, #ff4444)',
            textShadow: '0 0 40px rgba(255, 68, 68, 0.5)'
        }
    };

    // 保存原始样式
    const originalStyles = Array.from(titleWords).map(el => ({
        background: el.style.background,
        textShadow: el.style.textShadow
    }));

    // 卡片入场动画
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 200);
    });

    // 鼠标跟踪效果
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        cards.forEach((card, index) => {
            const factor = (index + 1) * 0.5;
            card.style.transform = `translateY(0) translate(${x * factor}px, ${y * factor}px)`;
        });
    });

    // 卡片悬停效果
    cards.forEach(card => {
        let styleType;
        if (card.classList.contains('warm-card')) styleType = 'warm';
        else if (card.classList.contains('emo-card')) styleType = 'emo';
        else if (card.classList.contains('dark-card')) styleType = 'dark';

        card.addEventListener('mouseenter', () => {
            createParticles(card);
            setTitleColor(styleType);
        });

        card.addEventListener('mouseleave', () => {
            resetTitleColor();
        });
    });

    // 设置标题颜色
    function setTitleColor(styleType) {
        const colors = styleColors[styleType];
        titleWords.forEach((word, index) => {
            word.style.transition = 'all 0.4s ease';
            word.style.animationDelay = `${index * 0.1}s`;
            word.style.backgroundImage = colors.gradient;
            word.style.backgroundSize = '300% 300%';
            word.style.textShadow = colors.textShadow;
        });
    }

    // 重置标题颜色
    function resetTitleColor() {
        titleWords.forEach((word, index) => {
            word.style.backgroundImage = 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)';
            word.style.textShadow = '0 0 80px rgba(255, 107, 107, 0.3)';
        });
    }

    // 创建粒子效果
    function createParticles(card) {
        const rect = card.getBoundingClientRect();
        const colors = getCardColors(card);

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
            `;
            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / 8;
            const velocity = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let x = 0, y = 0, opacity = 1;
            const animate = () => {
                x += vx * 0.02;
                y += vy * 0.02 + 2;
                opacity -= 0.02;

                particle.style.transform = `translate(${x}px, ${y}px)`;
                particle.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            requestAnimationFrame(animate);
        }
    }

    function getCardColors(card) {
        if (card.classList.contains('warm-card')) {
            return ['#ff9a56', '#ff6b6b', '#feca57', '#fff'];
        } else if (card.classList.contains('emo-card')) {
            return ['#667eea', '#764ba2', '#a8b4f5', '#fff'];
        } else {
            return ['#a02020', '#ff4444', '#660000', '#252532'];
        }
    }
});

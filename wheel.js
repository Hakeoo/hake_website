let items = [];
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let currentRotation = 0;
let isSpinning = false;
let audioContext = null;
const emojis = ["🎉", "🎨", "🎭", "🎪", "🎫", "🎮", "🎲", "🎯", "🎰", "🎳", "🎼", "🎵"];

// 在文件顶部添加颜色数组
const wheelColors = [
    { start: '#FF9A9E', end: '#FAD0C4' },
    { start: '#A18CD1', end: '#FBC2EB' },
    { start: '#96E6A1', end: '#D4FC79' },
    { start: '#FFD1FF', end: '#FAD0C4' },
    { start: '#FEE140', end: '#FA709A' },
    { start: '#4FACFE', end: '#00F2FE' },
    { start: '#43E97B', end: '#38F9D7' },
    { start: '#FA709A', end: '#FEE140' },
];

// 修改音效初始化函数
function initAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (e) {
        console.error('音频初始化失败:', e);
    }
}

// 修改点击事件处理函数
document.addEventListener('click', function(e) {
    initAudio(); // 确保音频上下文已初始化
    playClickSound();
});

function addItem() {
    const text = document.getElementById('itemText').value;
    const weight = parseInt(document.getElementById('itemWeight').value) || 1;
    
    if (text) {
        initAudio();
        createSound('click');
        items.push({ text, weight });
        document.getElementById('itemText').value = '';
        document.getElementById('itemWeight').value = '1';
        updateItemList();
        drawWheel();
    }
}

function updateItemList() {
    const list = document.getElementById('itemList');
    const editList = document.getElementById('itemsEditList');
    
    // 更新左侧简单列表
    list.innerHTML = '';
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <span>${item.text} (比重: ${item.weight})</span>
            <button onclick="removeItem(${index})">删除</button>
        `;
        list.appendChild(div);
    });
    
    // 更新右侧可编辑列表
    editList.innerHTML = '';
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'edit-item';
        div.innerHTML = `
            <input type="text" value="${item.text}" class="edit-text-${index}">
            <input type="number" value="${item.weight}" min="1" class="edit-weight-${index}">
            <div class="edit-item-controls">
                <button class="save-btn" onclick="saveItem(${index})">保存</button>
                <button class="cancel-btn" onclick="removeItem(${index})">删除</button>
            </div>
        `;
        editList.appendChild(div);
    });
}

function removeItem(index) {
    initAudio();
    createSound('delete');
    items.splice(index, 1);
    updateItemList();
    drawWheel();
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (items.length === 0) return;
    
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const radius = Math.min(center.x, center.y) - 20;
    
    // 绘制外圈
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = -Math.PI / 2; // 从12点钟方向开始
    
    // 正向绘制扇形
    items.forEach((item, index) => {
        const sliceAngle = (item.weight / totalWeight) * Math.PI * 2;
        
        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, radius, startAngle + currentRotation, startAngle + sliceAngle + currentRotation);
        ctx.closePath();
        
        // 设置渐变色
        const gradient = ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
        );
        const colorIndex = index % wheelColors.length;
        gradient.addColorStop(0, wheelColors[colorIndex].start);
        gradient.addColorStop(1, wheelColors[colorIndex].end);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 添加文字
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(startAngle + sliceAngle / 2 + currentRotation);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(item.text, radius * 0.75, 0);
        ctx.restore();
        
        startAngle += sliceAngle;
    });
    
    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(center.x, center.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // 绘制指针
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.beginPath();
    ctx.moveTo(-15, -radius - 10);
    ctx.lineTo(15, -radius - 10);
    ctx.lineTo(0, -radius + 20);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.restore();
}

function spin() {
    if (isSpinning || items.length === 0) return;
    
    // 获取用户设置的旋转参数
    const rounds = Math.min(10, Math.max(1, parseFloat(document.getElementById('spinRounds').value) || 4));
    const duration = Math.min(10, Math.max(1, parseFloat(document.getElementById('spinDuration').value) || 3)) * 1000;
    
    initAudio();
    createSound('spin');
    isSpinning = true;
    
    const startTime = Date.now();
    const startRotation = currentRotation;
    const totalRotation = (Math.PI * 2 * rounds) + (Math.random() * Math.PI * 2);
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startRotation + totalRotation * easeOut;
        
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            
            // 修改角度计算逻辑
            const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
            const normalizedRotation = -currentRotation % (Math.PI * 2);
            let startAngle = -Math.PI / 2;
            
            // 找到指针指向的扇形
            for (let i = 0; i < items.length; i++) {
                const sliceAngle = (items[i].weight / totalWeight) * Math.PI * 2;
                const endAngle = startAngle + sliceAngle;
                
                // 检查指针（12点钟方向）是否在当前扇形内
                if (normalizedRotation >= startAngle && normalizedRotation < endAngle) {
                    initAudio();
                    playResultSound();
                    break;
                }
                startAngle += sliceAngle;
            }
        }
    }
    
    animate();
}

// 添加输入验证函数
function validateSpinInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const step = parseFloat(input.step);
    
    if (isNaN(value) || value < min) {
        input.value = min;
    } else if (value > max) {
        input.value = max;
    } else {
        // 确保值符合 step
        input.value = Math.round(value / step) * step;
    }
}

// 在文件末尾添加事件监听器
document.getElementById('spinRounds').addEventListener('change', function() {
    validateSpinInput(this);
});

document.getElementById('spinDuration').addEventListener('change', function() {
    validateSpinInput(this);
});

// 添加鼠标移动效果函数
function createEmoji(e) {
    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    
    // 设置表情出现的位置
    emoji.style.left = (e.clientX - 10) + 'px';
    emoji.style.top = (e.clientY - 10) + 'px';
    
    document.body.appendChild(emoji);
    
    // 动画结束后移元素
    setTimeout(() => {
        document.body.removeChild(emoji);
    }, 1000);
}

// 修改音函数，添加不同类型的音效
function createSound(type) {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'click':
                // 普通点击音效
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
                
            case 'spin':
                // 开始旋转音效
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                oscillator.start();
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
                
            case 'delete':
                // 删除音效
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                oscillator.start();
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
        }
    } catch (e) {
        console.error('音效播放失败:', e);
    }
}

// 修改原来的playClickSound函数
function playClickSound() {
    try {
        createSound('click');
    } catch (e) {
        console.error('音效播放失败:', e);
    }
}

// 节流函数，限制emoji生成频率
function throttle(func, limit) {
    let inThrottle;
    return function(e) {
        if (!inThrottle) {
            func(e);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 添加事件监听
document.addEventListener('mousemove', throttle(createEmoji, 100));
document.addEventListener('click', playClickSound);

// 初始绘制
drawWheel(); 

// 添加保存编辑项的函数
function saveItem(index) {
    const textInput = document.querySelector(`.edit-text-${index}`);
    const weightInput = document.querySelector(`.edit-weight-${index}`);
    
    const newText = textInput.value.trim();
    const newWeight = parseInt(weightInput.value) || 1;
    
    if (newText) {
        items[index] = { text: newText, weight: newWeight };
        createSound('click');
        updateItemList();
        drawWheel();
    }
}

// 修改结束音效，使其更明显
function playResultSound() {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放更欢快的音效序列
        oscillator.type = 'sine';
        
        // 第一个音
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        
        // 第二个音
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
        
        // 第三个音
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('音效播放失败:', e);
    }
}

// 在初始化时隐藏结果显示
document.addEventListener('DOMContentLoaded', function() {
    const resultDisplay = document.getElementById('resultDisplay');
    resultDisplay.classList.remove('show');
}); 
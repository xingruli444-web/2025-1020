// --- 圓的設定 ---
let circles = [];
const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const NUM_CIRCLES = 20;

// 新增：粒子系統（爆破碎片）
let particles = [];
const PARTICLE_COUNT = 20;
const PARTICLE_GRAVITY = 0.08;
// POP_CHANCE 不再用於隨機爆破
const POP_CHANCE = 0.004; // 保留但不使用

// --- 新增：音效設定 ---
let popSound; // 用來存放音效的變數
let audioEnabled = false; // 紀錄是否已由使用者啟用音效

// 新增：分數
let score = 0;

// p5.js 函式：在 setup() 之前載入資源
function preload() {
    try {
        popSound = loadSound('assets/pop.mp3');
    } catch (e) {
        console.error("載入音效失敗！請檢查檔案路徑是否正確。", e);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // --- 新增：畫面啟用音效按鈕覆蓋（點擊後啟用 AudioContext） ---
    if (!window.__audioOverlayAdded) {
        const overlay = document.createElement('div');
        overlay.id = 'audioOverlay';
        overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:9999;';
        const btn = document.createElement('button');
        btn.textContent = '點擊以啟用音效';
        btn.style.cssText = 'font-size:20px;padding:12px 22px;border-radius:8px;border:none;background:#1982c4;color:#fff;cursor:pointer;';
        overlay.appendChild(btn);
        document.body.appendChild(overlay);
        btn.addEventListener('click', () => {
            enableAudioOnce();
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        });
        window.__audioOverlayAdded = true;
    }

    // 初始化圓（記住其原始 hex 顏色以便判斷）
    circles = [];
    for (let i = 0; i < NUM_CIRCLES; i++) {
        let colHex = random(COLORS);
        circles.push({
            x: random(width),
            y: random(height),
            r: random(50, 200),
            colorHex: colHex,           // 儲存 hex 字串以便比較
            color: color(colHex),      // p5 Color 物件
            alpha: random(80, 255),
            speed: random(1, 5)
        });
    }
}

function draw() {
    background('#fcf6bd');
    noStroke();

    // 左上角文字
    push();
    textSize(32);
    fill('#6f1d1b');
    textAlign(LEFT, TOP);
    text('414730365', 10, 10);
    pop();

    // 右上角顯示分數（同樣樣式）
    push();
    textSize(32);
    fill('#6f1d1b');
    textAlign(RIGHT, TOP);
    text(score, width - 10, 10);
    pop();

    // 更新並繪製圓（不再隨機爆破）
    for (let c of circles) {
        // 圓上升
        c.y -= c.speed;

        if (c.y + c.r / 2 < 0) { // 如果圓完全移出畫面頂端，從底部重新出現
            c.y = height + c.r / 2;
            c.x = random(width);
            c.r = random(50, 200);
            let newHex = random(COLORS);
            c.colorHex = newHex;
            c.color = color(newHex);
            c.alpha = random(80, 255);
            c.speed = random(1, 5);
        }
        c.color.setAlpha(c.alpha); // 設定透明度
        fill(c.color); // 使用設定的顏色
        circle(c.x, c.y, c.r); // 畫圓

        // 在圓的右上方1/4圓的中間產生方形（高光）
        let squareSize = c.r / 6;
        let angle = -PI / 4; // 右上45度
        let distance = c.r / 2 * 0.65;
        let squareCenterX = c.x + cos(angle) * distance;
        let squareCenterY = c.y + sin(angle) * distance;
        fill(255, 255, 255, 120); // 白色透明
        noStroke();
        rectMode(CENTER);
        rect(squareCenterX, squareCenterY, squareSize, squareSize);
    }

    // 更新並繪製粒子（爆破碎片）
    updateAndDrawParticles();

    // 若尚未啟用音效，顯示提示（覆蓋已由 DOM 按鈕處理；此處保留小提示）
    if (!audioEnabled) {
        push();
        fill(0, 0, 0, 120);
        rectMode(CORNER);
        rect(0, height - 60, width, 60);
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('或點擊畫面任何處以啟用音效與點選氣球', width / 2, height - 30);
        pop();
    }
}

// spawnParticles 與 updateAndDrawParticles 保持不變
function spawnParticles(x, y, parentR, parentColor) {
    let baseColor = color(parentColor);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        let angle = random(TWO_PI);
        let speed = random(1, 6) * (parentR / 120);
        particles.push({
            x: x + cos(angle) * random(0, parentR * 0.2),
            y: y + sin(angle) * random(0, parentR * 0.2),
            vx: cos(angle) * speed,
            vy: sin(angle) * speed + random(-1, -0.2),
            size: random(3, max(3, parentR * 0.06)),
            life: random(30, 90),
            maxLife: 0,
            color: baseColor
        });
        particles[particles.length - 1].maxLife = particles[particles.length - 1].life;
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.vy += PARTICLE_GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        let alpha = map(p.life, 0, p.maxLife, 0, 255);
        let c = color(p.color);
        c.setAlpha(alpha);

        noStroke();
        fill(c);
        circle(p.x, p.y, p.size);

        if (p.life <= 0 || p.y > height + 200) {
            particles.splice(i, 1);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    for (let c of circles) {
        c.x = random(width);
        c.y = random(height);
    }
}

// --- 使用者互動啟用音訊與點擊氣球處理 ---
function enableAudioOnce() {
    if (audioEnabled) return;
    try {
        if (typeof userStartAudio === 'function') {
            userStartAudio();
        }
        if (typeof getAudioContext === 'function') {
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                ctx.resume();
            }
        }
        audioEnabled = true;
        console.log('Audio enabled by user gesture.');
        if (popSound && popSound.isLoaded()) popSound.play();
    } catch (e) {
        console.warn('enableAudioOnce 錯誤：', e);
    }
}

// 處理實際點擊氣球的邏輯（可由 mousePressed / touchStarted 呼叫）
function handleClickAt(x, y) {
    // 由畫面最上層的圓開始檢查（從陣列最後一個開始）
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = dist(x, y, c.x, c.y);
        if (d <= c.r / 2) {
            // 點到氣球：檢查顏色，更新分數
            if (c.colorHex && c.colorHex.toLowerCase() === '#ffca3a') {
                score += 1;
            } else {
                score -= 1;
            }

            // 播放音效（需已啟用且載入）
            if (audioEnabled && popSound && popSound.isLoaded()) {
                popSound.play();
            }

            // 產生爆破粒子
            spawnParticles(c.x, c.y, c.r, c.color);

            // 讓該氣球從底部重生
            c.y = height + c.r / 2;
            c.x = random(width);
            c.r = random(50, 200);
            let newHex = random(COLORS);
            c.colorHex = newHex;
            c.color = color(newHex);
            c.alpha = random(80, 255);
            c.speed = random(1, 5);

            break; // 只處理第一個被點到（最上層）
        }
    }
}

function mousePressed() {
    enableAudioOnce();
    handleClickAt(mouseX, mouseY);
}

function touchStarted() {
    enableAudioOnce();
    // 使用第一個 touch 點的位置
    if (touches && touches.length > 0) {
        handleClickAt(touches[0].x, touches[0].y);
    } else {
        handleClickAt(mouseX, mouseY);
    }
    return false;
}
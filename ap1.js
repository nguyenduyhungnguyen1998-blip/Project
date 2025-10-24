(function() {
    'use strict';

    const nE = document.getElementById('n'), mvE = document.getElementById('mv'), bE = document.getElementById('best'), tE = document.getElementById('tm'), bestNE = document.getElementById('best-n');
    const thE = document.getElementById('theme'), sndE = document.getElementById('snd'), spdE = document.getElementById('spd');
    const stage = document.getElementById('stage'), prgE = document.getElementById('prog'), htE = document.getElementById('hintText');
    const finishPopup = document.getElementById('finish');
    const autoBtn = document.getElementById('auto'), hintBtn = document.getElementById('hint'), undoBtn = document.getElementById('undo'), speedLabel = document.getElementById('speedLabel');

    const errorPopup = document.getElementById('errorPopup');
    const errorPopupText = document.getElementById('errorPopupText');
    const hintPopup = document.getElementById('hintPopup');
    const challengeDifficultyPopup = document.getElementById('challengeDifficultyPopup');
    const achievementsPopup = document.getElementById('achievementsPopup');
    const achievementUnlockedPopup = document.getElementById('achievementUnlockedPopup');
    const sandboxSetupPopup = document.getElementById('sandboxSetupPopup');
    const settingsPopup = document.getElementById('settingsPopup');
    const loserPopup = document.getElementById('loserPopup');

    const titleDisplayContainer = document.getElementById('titleDisplayContainer');
    const titleDisplay = document.getElementById('titleDisplay');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsCloseBtn = document.getElementById('settingsClose');
    const settingsResetBtn = document.getElementById('settingsReset');

    const bgmEl = document.getElementById('bgm');
    const pickupSnd = document.getElementById('snd_pickup');
    const dropSnd = document.getElementById('snd_drop');
    const errorSnd = document.getElementById('snd_error');
    const winSnd = document.getElementById('snd_win');
    const fireworksSnd = document.getElementById('snd_fireworks');
    const audioElements = {
        bgm: { el: bgmEl, input: document.getElementById('bgmUpload'), status: document.getElementById('bgmUploadStatus'), key: 'customBGM' },
        pickup: { el: pickupSnd, input: document.getElementById('pickupUpload'), status: document.getElementById('pickupUploadStatus'), key: 'customPickup' },
        drop: { el: dropSnd, input: document.getElementById('dropUpload'), status: document.getElementById('dropUploadStatus'), key: 'customDrop' },
        win: { el: winSnd, input: document.getElementById('winUpload'), status: document.getElementById('winUploadStatus'), key: 'customWin' }
    };

    const sandboxDisksSlider = document.getElementById('sandboxDisks');
    const sandboxDisksValue = document.getElementById('sandboxDisksValue');
    const sandboxPolesSlider = document.getElementById('sandboxPoles');
    const sandboxPolesValue = document.getElementById('sandboxPolesValue');
    const sandboxRuleSelect = document.getElementById('sandboxRule');
    const sandboxRuleDesc = document.getElementById('sandboxRuleDesc');
    const sandboxStartPosSelect = document.getElementById('sandboxStartPos');
    const sandboxTargetSelect = document.getElementById('sandboxTarget');
    const sandboxStartBtn = document.getElementById('sandboxStart');


    let n = 4, moves = 0, tmr = null, t0 = null, run = false, seq = [], ix = 0, teach = null, diskCols = ["#e74c3c", "#f39c12", "#2ecc71", "#3498db", "#9b59b6", "#1abc9c", "#e67e22", "#8e44ad"];
    let CURRENT_MODE = 'play';
    let challengeTimer = null, challengeDeadline = 0, challengeLimit = 0, challengeActive = false;
    let moveHistory = [];
    let heldDisk = null;
    let undoCount = 0;
    let themeChanged = false;
    let lastUnlockedCount = 0;

    let sandboxOptions = {
        diskCount: 4,
        poleCount: 4,
        rule: 'classic',
        startPos: 'classic',
        target: 'any_other'
    };

    const THEME_EMOJIS = {
        burger: ['🍔', '🍅', '🥬', '🧀', '🥩', '🍞', '🍞', '🍞'],
        rescue: ['🐱', '🐈', '😿', '😻', '🙀', '😽', '🦊', '🐻'],
        neon: ['⚡️', '💡', '🔮', '✨', '🔷', '🔶', '❇️', '✳️'],
        dark: ['🌙', '⭐', '🪐', '💫', '🌑', '🌕', '🌌', '☄️']
    };

    let unlockedAchievements = [];
    let selectedTitleId = null;
    const achievements = [
        { id: 'rookie', title: 'Tân Binh', description: 'Hoàn thành một game 3 đĩa.', icon: '🔰', check: () => n === 3 && CURRENT_MODE !== 'sandbox' },
        { id: 'architect', title: 'Kiến Trúc Sư', description: 'Hoàn thành một game 8 đĩa.', icon: '🏗️', check: () => n === 8 && CURRENT_MODE !== 'sandbox'},
        { id: 'optimal_master', title: 'Bậc Thầy Tối Ưu', description: 'Hoàn thành game với số bước tối thiểu.', icon: '🎯', check: () => (CURRENT_MODE !== 'sandbox' || sandboxOptions.rule === 'classic') && moves === (Math.pow(2, n) - 1) },
        { id: 'perfectionist', title: 'Người Cầu Toàn', description: 'Hoàn thành game 5+ đĩa tối ưu không dùng Undo.', icon: '✨', check: () => n >= 5 && (CURRENT_MODE !== 'sandbox' || sandboxOptions.rule === 'classic') && moves === (Math.pow(2, n) - 1) && undoCount === 0 },
        { id: 'speedster', title: 'Tốc Độ', description: 'Chiến thắng ở chế độ Challenge (Vừa).', icon: '⚡', check: (status) => status === 'challenge_medium_win' },
        { id: 'godspeed', title: 'Thần Tốc', description: 'Chiến thắng ở chế độ Challenge (Khó).', icon: '🔥', check: (status) => status === 'challenge_hard_win' },
        { id: 'teacher', title: 'Người Thầy', description: 'Hoàn thành một game ở chế độ Teach.', icon: '🎓', check: () => CURRENT_MODE === 'teach' },
        { id: 'scholar', title: 'Học Giả', description: 'Hoàn thành một game ở chế độ Learn.', icon: '🧠', check: () => CURRENT_MODE === 'learn' },
        { id: 'undoer', title: 'Người Thích Hoàn Tác', description: 'Sử dụng Undo 10 lần trong một game.', icon: '↩️', check: () => undoCount >= 10 },
        { id: 'collector', title: 'Nhà Sưu Tầm', description: 'Trải nghiệm một theme khác ngoài Classic.', icon: '🎨', check: () => themeChanged },
        { id: 'pioneer', title: 'Nhà Tiên Phong', description: 'Hoàn thành một game ở chế độ Sandbox.', icon: '🚀', check: () => CURRENT_MODE === 'sandbox' },
        { id: 'good_try', title: 'Nỗ Lực Đáng Khen', description: 'Thất bại ở một màn Challenge.', icon: '😥', check: (status) => status === 'challenge_fail' },
        { id: 'tower_lord', title: 'Tháp Chủ', description: 'Mở khóa tất cả các thành tích khác.', icon: '👑', check: () => unlockedAchievements.length >= achievements.length - 1 }
    ];
    
    function loadAchievements() {
        try {
            unlockedAchievements = JSON.parse(localStorage.getItem('hanoi_unlocked_achievements')) || [];
            selectedTitleId = localStorage.getItem('hanoi_selected_title') || 'rookie';
            if (!unlockedAchievements.includes('rookie')) {
                 unlockedAchievements.push('rookie');
                 saveAchievements();
            }
            lastUnlockedCount = unlockedAchievements.length;
        } catch(e) {
            unlockedAchievements = ['rookie'];
            selectedTitleId = 'rookie';
            lastUnlockedCount = 1;
        }
    }
    function saveAchievements() {
        localStorage.setItem('hanoi_unlocked_achievements', JSON.stringify(unlockedAchievements));
        localStorage.setItem('hanoi_selected_title', selectedTitleId);
    }
    function unlockAchievement(id) {
        if (!unlockedAchievements.includes(id)) {
            unlockedAchievements.push(id);
            saveAchievements();
            const achievement = achievements.find(a => a.id === id);
            achievementUnlockedPopup.innerHTML = `
                <div style="font-size:24px;">🏆</div>
                <div style="font-weight:800;font-size:18px;margin-top:8px">Mở khóa thành tích!</div>
                <div style="color:var(--muted);">${achievement.description}</div>
                <div style="margin-top:8px;font-weight:700">Danh hiệu mới: ${achievement.title}</div>
            `;
            achievementUnlockedPopup.classList.add('show');
            setTimeout(() => { achievementUnlockedPopup.classList.remove('show'); }, 3000);
            renderAchievements();
            const towerLordAch = achievements.find(a => a.id === 'tower_lord');
            if (towerLordAch && towerLordAch.check()) {
                unlockAchievement('tower_lord');
            }
        }
    }
    function checkAllAchievements(status = null) {
        achievements.forEach(ach => {
            if (ach.id !== 'tower_lord' && ach.check(status)) {
                unlockAchievement(ach.id);
            }
        });
    }
    function renderAchievements() {
        const listEl = document.getElementById('achievementsList');
        listEl.innerHTML = '';
        achievements.forEach(ach => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            const isEquipped = selectedTitleId === ach.id;
            const item = document.createElement('div');
            item.className = `achievement-item ${isUnlocked ? '' : 'locked'}`;
            item.innerHTML = `
                <div class="icon">${ach.icon}</div>
                <div class="details">
                    <h4>${ach.title}</h4>
                    <p>${ach.description}</p>
                </div>
                <div class="title-reward ${isEquipped ? 'equipped' : ''}" data-id="${ach.id}">
                    ${isEquipped ? 'Đã trang bị' : isUnlocked ? 'Trang bị' : 'Đã khóa'}
                </div>
            `;
            if (isUnlocked) {
                item.querySelector('.title-reward').addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedTitleId = ach.id;
                    saveAchievements();
                    updateTitleDisplay();
                    renderAchievements();
                });
            }
            listEl.appendChild(item);
        });
    }
    function updateTitleDisplay() {
        const title = achievements.find(a => a.id === selectedTitleId)?.title || '';
        titleDisplay.textContent = title;
    }

    function getBestKey(diskCount) { return `hanoi_best_v2_${diskCount}_disks`; }
    function loadBest(diskCount) { try { return JSON.parse(localStorage.getItem(getBestKey(diskCount))) || {}; } catch (e) { return {}; } }
    function saveBest(diskCount, score) { localStorage.setItem(getBestKey(diskCount), JSON.stringify(score)); }
    function updateBestScoreDisplay() {
        n = Math.max(1, Math.min(8, parseInt(nE.value) || 4));
        bestNE.textContent = n;
        const best = loadBest(n);
        bE.textContent = (best && best.moves) ? `${best.moves}m / ${best.time}s` : '—';
    }

    function playSound(soundElement, volume = 0.7) {
        if (!soundElement || !sndE.checked || !soundElement.currentSrc) return;
        soundElement.currentTime = 0;
        soundElement.volume = volume;
        soundElement.play().catch(() => {});
    }
    function playBGM() { if (bgmEl && sndE.checked && bgmEl.currentSrc) try { bgmEl.volume = 0.35; bgmEl.loop = true; bgmEl.play().catch(() => {}); } catch (e) {} }
    function pauseBGM() { if (bgmEl) bgmEl.pause(); }

    function handleSoundUpload(e, audioKey) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Data = event.target.result;
            try {
                localStorage.setItem(audioKey, base64Data);
                loadCustomSounds();
                if(audioKey === 'customBGM' && sndE.checked) {
                    pauseBGM();
                    playBGM();
                }
            } catch (err) {
                alert('Lỗi: Không thể lưu file âm thanh. Bộ nhớ có thể đã đầy.');
            }
        };
        reader.readAsDataURL(file);
    }

    function loadCustomSounds() {
        Object.values(audioElements).forEach(item => {
            const customSound = localStorage.getItem(item.key);
            const defaultSrc = item.el.getAttribute('data-default-src');
            
            if (customSound) {
                item.el.src = customSound;
                item.status.textContent = "Đã tùy chỉnh";
                item.status.style.color = 'var(--accent)';
            } else {
                item.el.src = defaultSrc;
                item.status.textContent = "Mặc định";
                 item.status.style.color = 'var(--muted)';
            }
        });
    }

    function resetCustomSounds() {
        Object.values(audioElements).forEach(item => {
            localStorage.removeItem(item.key);
        });
        loadCustomSounds();
        if(sndE.checked) {
             pauseBGM();
             playBGM();
        }
    }

    function buildStage() {
        const isSandbox = CURRENT_MODE === 'sandbox';
        
        if (isSandbox) {
            n = sandboxOptions.diskCount;
        } else {
            n = Math.max(1, Math.min(8, parseInt(nE.value) || 4));
            nE.value = n;
        }
        const poleCount = isSandbox ? sandboxOptions.poleCount : 3;
    
        stage.innerHTML = '';
        
        for (let i = 0; i < poleCount; i++) {
            const poleId = String.fromCharCode(65 + i).toLowerCase();
            const p = document.createElement('div');
            p.className = 'pole';
            p.id = poleId;
            p.innerHTML = `<div class="peg"></div><div class="pole-label">${i + 1}</div>`;
            addPoleListeners(p);
            stage.appendChild(p);
        }
        
        applyTheme();

        const theme = thE.value;
        const emojis = THEME_EMOJIS[theme];
        const poles = Array.from(stage.querySelectorAll('.pole'));

        for (let i = n; i >= 1; i--) {
            let targetPole;
            if (isSandbox) {
                switch(sandboxOptions.startPos) {
                    case 'spread':
                        targetPole = poles[(n-i) % poleCount];
                        break;
                    case 'last_pole':
                        targetPole = poles[poleCount - 1];
                        break;
                    case 'classic':
                    default:
                        targetPole = poles[0];
                }
            } else {
                targetPole = poles[0];
            }

            const d = document.createElement('div');
            d.className = 'disk';
            d.id = `disk-${i}-${Math.floor(Math.random() * 1e6)}`;
            d.dataset.size = i;
            const width = 40 + i * 18;
            d.style.width = `${width}px`;
            d.style.background = diskCols[(i - 1) % diskCols.length];
            
            const lbl = document.createElement('div');
            lbl.className = 'disk--label';
            
            let emoji = (emojis && i <= emojis.length) ? emojis[i - 1] : null;
            let labelContent = '';
            
            if (emoji) {
                labelContent = `<span class="emoji" role="img" aria-label="disk icon">${emoji}</span><span class="num">${i}</span>`;
            } else {
                labelContent = `<span class="num">${i}</span>`;
            }
            lbl.innerHTML = labelContent;

            d.appendChild(lbl);
            d.style.zIndex = 100 + i;
            d.draggable = true;
            d.addEventListener('dragstart', (ev) => {
                if (!run) {
                    try { ev.dataTransfer.setData('text/plain', d.id); ev.dataTransfer.effectAllowed = 'move'; } catch (e) {}
                    if (!t0 && !challengeActive) { t0 = Date.now(); tmr = setInterval(() => { tE.textContent = formatTime(Math.floor((Date.now() - t0) / 1000)) }, 250) }
                    playSound(pickupSnd);
                } else {
                    ev.preventDefault();
                }
            });
            targetPole.appendChild(d);
        }
        
        moves = 0; mvE.textContent = moves; tE.textContent = '00:00'; clearInterval(tmr); t0 = null; prgE.style.width = '0%'; htE.textContent = '—';
        moveHistory = [];
        undoCount = 0;
        lastUnlockedCount = unlockedAchievements.length;
        updateUndoButton();
        if (!isSandbox) updateBestScoreDisplay();
        
        updateTopDisks();
    }
    
    function addPoleListeners(poleElement) {
         poleElement.addEventListener('dragover', (e) => { e.preventDefault(); });
         poleElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const diskId = e.dataTransfer.getData('text/plain');
            const disk = document.getElementById(diskId);
            if (!disk) return;
            const from = disk.parentElement ? disk.parentElement.id : null;
            if (isValidMove(from, poleElement.id, disk.dataset.size)) {
                if (from) executeMove(from, poleElement.id);
            } else {
                showErrorPopup();
            }
        });
    }

    function applyTheme() { document.getElementById('app').className = `app theme--${thE.value}`; }
    
    function updateTopDisks() {
        document.querySelectorAll('.pole').forEach(p => {
            const ds = p.querySelectorAll('.disk');
            ds.forEach(x => { x.classList.remove('small'); x.style.pointerEvents = 'none'; });
            if (ds.length) {
                ds[ds.length - 1].classList.add('small');
                ds[ds.length - 1].style.pointerEvents = 'auto';
            }
        });
    }

    function isValidMove(fromId, toId, s) {
        const toPole = document.getElementById(toId);
        const topDisk = [...toPole.querySelectorAll('.disk')].pop();
        if (topDisk && +topDisk.dataset.size < +s) {
            errorPopupText.textContent = 'Không được đặt đĩa lớn lên trên đĩa nhỏ hơn.';
            return false;
        }

        if (CURRENT_MODE === 'sandbox') {
            const poles = Array.from(document.querySelectorAll('.pole')).map(p => p.id);
            const fromIndex = poles.indexOf(fromId);
            const toIndex = poles.indexOf(toId);
            
            if (sandboxOptions.rule === 'adjacent' && Math.abs(fromIndex - toIndex) !== 1) {
                errorPopupText.textContent = 'Luật liền kề: Chỉ được di chuyển giữa các cột ngay cạnh nhau.';
                return false;
            }
            if (sandboxOptions.rule === 'cyclic') {
                 const nextPoleIndex = (fromIndex + 1) % poles.length;
                 if (nextPoleIndex !== toIndex) {
                    errorPopupText.textContent = 'Luật tuần hoàn: Chỉ được di chuyển theo chiều kim đồng hồ tới cột kế tiếp (vd: 1→2, 2→3, 3→1).';
                    return false;
                 }
            }
        }
        return true;
    }

    function executeMove(from, to) {
        if (CURRENT_MODE === 'teach') {
            const expectedMove = seq[ix];
            if (from === expectedMove[0] && to === expectedMove[1]) {
                moveHistory.push({ from, to });
                performMove(from, to);
                if (++ix < seq.length) {
                    highlightTeachMove();
                } else {
                    stopAutoSolver();
                    checkWinCondition();
                }
            } else {
                playSound(errorSnd);
                htE.textContent = 'Sai rồi! Hoàn tác để thử lại.';
            }
        } else {
            moveHistory.push({ from, to });
            performMove(from, to);
        }
        updateUndoButton();
    }

    function performMove(from, to) {
        const s = document.getElementById(from);
        const d = document.getElementById(to);
        let disk = s ? [...s.querySelectorAll('.disk')].pop() : null;
        if (!disk) return;
        d.appendChild(disk);
        moves++;
        mvE.textContent = moves;
        playSound(dropSnd);
        updateTopDisks();
        updateProgressBar();
        saveGameState();
        if (!run) checkWinCondition();
    }

    function updateProgressBar() { 
        if (CURRENT_MODE === 'sandbox' || n > 8) {
            prgE.parentElement.style.display = 'none';
            return;
        }
        prgE.parentElement.style.display = '';
        const tot = Math.pow(2, n) - 1; 
        prgE.style.width = `${Math.min(100, (moves / tot) * 100)}%`; 
    }

    function checkWinCondition() {
        const poles = Array.from(document.querySelectorAll('.pole'));
        const startPole = poles[0];
        
        let targetPoles = [];
        if (CURRENT_MODE === 'sandbox') {
            if (sandboxOptions.target === 'last_pole') {
                targetPoles = [poles[poles.length - 1]];
            } else {
                targetPoles = poles.slice(1);
            }
        } else {
            targetPoles = [poles[poles.length - 1]]; 
        }

        for (const pole of targetPoles) {
            if (pole.querySelectorAll('.disk').length === n) {
                clearInterval(tmr);
                if (CURRENT_MODE !== 'sandbox') saveIfBestScore();
                checkAllAchievements();
                showFinishPopup();
                if (challengeActive) successChallenge();
                return;
            }
        }
    }

    function showFinishPopup() {
        const isOptimal = (CURRENT_MODE !== 'sandbox' || sandboxOptions.rule === 'classic') && moves === Math.pow(2, n) - 1;
        const tSeconds = Math.floor((Date.now() - t0) / 1000) || 0;
        const tStr = formatTime(tSeconds);
        const newTitleUnlocked = unlockedAchievements.length > lastUnlockedCount;
    
        let titleText = "🎉 Hoàn thành!";
        let detailText = `Số bước: ${moves} | Thời gian: ${tStr}`;
    
        if(newTitleUnlocked) {
            titleText = "🏆 DANH HIỆU MỚI! 🏆";
        } else if (isOptimal) {
            titleText = "Tuyệt vời! 🥇";
            detailText = `Số bước: ${moves} (Tối ưu) | Thời gian: ${tStr}`;
        }
    
        finishPopup.innerHTML = `<div style="text-align:center"><div style="font-size:20px">${titleText}</div><div>${detailText}</div></div>`;
        finishPopup.classList.add('show');
        setTimeout(() => { finishPopup.classList.remove('show') }, 4000);
    
        triggerWinEffects(isOptimal, newTitleUnlocked);
    }

    function triggerWinEffects(isOptimal, newTitleUnlocked) {
        playSound(winSnd, 0.5);
        
        const colors = ['#2b8cff', '#6fd3ff', '#f39c12', '#e74c3c', '#2ecc71'];
    
        function launchFromCorners(particleCount, spread, scalar = 1) {
            confetti({ particleCount: particleCount, angle: 60, spread: spread, origin: { x: 0 }, colors: colors, scalar: scalar });
            confetti({ particleCount: particleCount, angle: 120, spread: spread, origin: { x: 1 }, colors: colors, scalar: scalar });
        }
    
        function launchFromTop(particleCount, spread, scalar = 1) {
            confetti({ particleCount: particleCount, angle: 75, spread: spread, origin: { x: 0.25, y: 0 }, colors: colors, scalar: scalar });
            confetti({ particleCount: particleCount, angle: 90, spread: spread, origin: { x: 0.5, y: 0 }, colors: colors, scalar: scalar });
            confetti({ particleCount: particleCount, angle: 105, spread: spread, origin: { x: 0.75, y: 0 }, colors: colors, scalar: scalar });
        }
    
        if (newTitleUnlocked) {
            playSound(fireworksSnd, 0.8);
            launchFromCorners(150, 100, 2.0);
            launchFromTop(120, 80, 1.8);
            setTimeout(() => {
                confetti({ particleCount: 150, spread: 360, ticks: 100, gravity: 0, decay: 0.94, origin: { y: 0.4 }, shapes: ['star'], colors: ['#FFC700', '#FF0000', '#FFFFFF']});
            }, 300);
        } else if (isOptimal) {
            playSound(fireworksSnd, 0.6);
            launchFromCorners(120, 80, 1.5);
            launchFromTop(100, 60, 1.2);
            setTimeout(() => {
                confetti({ particleCount: 80, spread: 360, ticks: 100, gravity: 0, decay: 0.94, origin: { y: 0.5 }, shapes: ['star'], colors: ['#FFC700', '#FFD700', '#FFFFFF']});
            }, 200);
        } else {
            launchFromCorners(100, 60, 1.2);
        }
        lastUnlockedCount = unlockedAchievements.length;
    }

    function saveIfBestScore() {
        if (CURRENT_MODE !== 'play' && CURRENT_MODE !== 'challenge') return;
        const t = Math.floor((Date.now() - t0) / 1000) || 0;
        const best = loadBest(n);
        if (!best.moves || moves < best.moves || (moves === best.moves && t < best.time)) {
            saveBest(n, { moves: moves, time: t });
            updateBestScoreDisplay();
        }
    }

    function successChallenge() {
        const difficulty = challengeLimit < (Math.pow(2, n) - 1) * 2 ? 'hard' : 'medium';
        checkAllAchievements(challengeActive ? `challenge_${difficulty}_win` : null);
        challengeActive = false;
        clearInterval(challengeTimer);
    }
    function failChallenge() {
        challengeActive = false;
        checkAllAchievements('challenge_fail');
        loserPopup.querySelector('.popup-box div').innerHTML = "Hết giờ rồi! ⏳<br>Cố gắng lần sau nhé!";
        loserPopup.style.display = 'flex';
    }
    function startChallengeFor(diskCount, difficulty) {
        const optimalMoves = Math.pow(2, diskCount) - 1;
        let timePerMove;
        switch (difficulty) {
            case 'easy': timePerMove = 4; break;
            case 'medium': timePerMove = 2.5; break;
            case 'hard': timePerMove = 1.5; break;
            default: timePerMove = 2.5;
        }
        challengeLimit = Math.ceil(optimalMoves * timePerMove) + 5;
        challengeDeadline = Date.now() + challengeLimit * 1000;
        challengeActive = true;
        tE.textContent = formatTime(challengeLimit);
        challengeTimer = setInterval(() => {
            const rem = Math.max(0, Math.ceil((challengeDeadline - Date.now()) / 1000));
            tE.textContent = formatTime(rem);
            if (rem <= 0) {
                clearInterval(challengeTimer);
                let hasWon = false;
                document.querySelectorAll('.pole').forEach((pole, index) => {
                    if (index > 0 && pole.querySelectorAll('.disk').length === n) {
                        hasWon = true;
                    }
                });
                if (!hasWon) {
                    failChallenge();
                }
            }
        }, 250);
    }

    function generateHanoiSequence(k, f, t, a, r) { if (k <= 0) return; generateHanoiSequence(k - 1, f, a, t, r); r.push([f, t]); generateHanoiSequence(k - 1, a, t, f, r); }
    
    function startAutoSolver() { if (run) { stopAutoSolver(); } seq = []; generateHanoiSequence(n, 'a', 'c', 'b', seq); ix = 0; run = true; runDemoStep(); }
    
    function runDemoStep() {
        if (ix >= seq.length || !run) { stopAutoSolver(); checkWinCondition(); return; }
        const p = seq[ix++];
        highlightPoles(p);
        setTimeout(() => { if (run) { performMove(p[0], p[1]); setTimeout(runDemoStep, +spdE.value); } }, +spdE.value / 2);
    }
    
    function highlightTeachMove() { teach = seq[ix]; highlightPoles(teach); const fromPole = (teach[0].charCodeAt(0) - 96); const toPole = (teach[1].charCodeAt(0) - 96); htE.innerHTML = `Di chuyển từ Cọc <strong>${fromPole}</strong> → <strong>${toPole}</strong>`; }
    
    function highlightPoles(p) { document.querySelectorAll('.pole').forEach(pole => pole.classList.remove('from', 'to', 'hv')); if (p) { document.getElementById(p[0])?.classList.add('from', 'hv'); document.getElementById(p[1])?.classList.add('to'); } }
    
    function stopAutoSolver() { 
        run = false; 
        teach = null; 
        highlightPoles(null); 
        htE.textContent = '—'; 
        if (CURRENT_MODE === 'play') {
            speedLabel.style.display = 'none';
        }
        autoBtn.textContent = 'Auto-solve';
    }
    
    function formatTime(s) { const mm = String(Math.floor(s / 60)).padStart(2, '0'); const ss = String(s % 60).padStart(2, '0'); return `${mm}:${ss}`; }

    function showErrorPopup() {
        playSound(errorSnd);
        errorPopup.style.display = 'flex';
        const box = errorPopup.querySelector('.popup-box');
        box.classList.remove('error-box');
        void box.offsetWidth;
        box.classList.add('error-box');
    }

    document.getElementById('reset').addEventListener('click', () => {
        stopAutoSolver();
        if (challengeActive) {
            clearInterval(challengeTimer);
            challengeActive = false;
            tE.textContent = '00:00';
        }
        buildStage();
        if (CURRENT_MODE === 'teach') { seq = []; generateHanoiSequence(n, 'a', 'c', 'b', seq); ix = 0; highlightTeachMove(); }
    });

    autoBtn.addEventListener('click', () => {
        if (CURRENT_MODE !== 'play') return;

        if (run) {
            stopAutoSolver();
        } else {
            startAutoSolver(); 
            speedLabel.style.display = 'block'; 
            autoBtn.textContent = 'Stop Solve';
        }
    });

    hintBtn.addEventListener('click', () => {
        const optimalMoves = Math.pow(2, n) - 1;
        let hintMessage = `Số bước tối thiểu cho ${n} đĩa là: <strong>${optimalMoves}</strong>.<br>`;
        if (CURRENT_MODE === 'play') {
            const optimalSequence = [];
            generateHanoiSequence(n, 'a', 'c', 'b', optimalSequence);
            if (moves < optimalSequence.length) {
                const nextMove = optimalSequence[moves];
                hintMessage += `Gợi ý nước đi tiếp theo: <strong>Cọc ${(nextMove[0].charCodeAt(0) - 96)} → Cọc ${(nextMove[1].charCodeAt(0) - 96)}</strong>.`;
            } else {
                hintMessage += "Bạn đã vượt qua số bước tối ưu, hãy tự mình tìm đường nhé!";
            }
        }
        document.getElementById('hintTextPopup').innerHTML = hintMessage;
        hintPopup.style.display = 'flex';
    });

    document.getElementById('hintClose').addEventListener('click', () => { hintPopup.style.display = 'none'; });
    document.getElementById('errorConfirm').addEventListener('click', () => { errorPopup.style.display = 'none'; });
    
    nE.addEventListener('change', () => {
        buildStage();
        if (CURRENT_MODE === 'teach') {
            seq = [];
            generateHanoiSequence(n, 'a', 'c', 'b', seq);
            ix = 0;
            highlightTeachMove();
        }
    });
    
    thE.addEventListener('change', () => { if (thE.value !== 'classic') themeChanged = true; checkAllAchievements(); applyTheme(); buildStage(); });
    sndE.addEventListener('change', () => { if (sndE.checked) playBGM(); else pauseBGM(); });
    spdE.addEventListener('change', () => { if (run) { stopAutoSolver(); startAutoSolver(); autoBtn.textContent = 'Stop Solve'; speedLabel.style.display = 'block'; } });

    function updateUndoButton() { undoBtn.disabled = moveHistory.length === 0; }
    undoBtn.addEventListener('click', () => {
        if (moveHistory.length > 0) {
            const lastMove = moveHistory.pop();
            const fromPole = document.getElementById(lastMove.to);
            const toPole = document.getElementById(lastMove.from);
            const disk = [...fromPole.querySelectorAll('.disk')].pop();
            if (disk) {
                toPole.appendChild(disk);
                moves--;
                undoCount++;
                checkAllAchievements();
                mvE.textContent = moves;
                playSound(pickupSnd);
                updateTopDisks();
                updateProgressBar();
                if (CURRENT_MODE === 'teach') { ix--; highlightTeachMove(); }
            }
            updateUndoButton();
        }
    });

    function clearHeldDisk() { if (heldDisk) { heldDisk.diskElement.classList.remove('held'); heldDisk = null; } }
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        const poleCount = document.querySelectorAll('.pole').length;
        const keyNum = parseInt(e.key);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= poleCount) {
            const poleId = String.fromCharCode(96 + keyNum);
            const poleEl = document.getElementById(poleId);
            if (!poleEl) return;
            if (!heldDisk) {
                const topDisk = [...poleEl.querySelectorAll('.disk')].pop();
                if (topDisk) { heldDisk = { diskElement: topDisk, fromPole: poleId }; topDisk.classList.add('held'); playSound(pickupSnd); }
            } else {
                if (isValidMove(heldDisk.fromPole, poleId, heldDisk.diskElement.dataset.size)) {
                    if (heldDisk.fromPole !== poleId) executeMove(heldDisk.fromPole, poleId);
                    clearHeldDisk();
                } else {
                    showErrorPopup();
                    clearHeldDisk();
                }
            }
        } else if (e.key === 'Escape') {
            clearHeldDisk();
        }
    });

    const modeOverlay = document.getElementById('modeSelect');
    const allModeCards = Array.from(document.querySelectorAll('.mode-card'));
    const modeStartBtn = document.getElementById('modeStart');
    const changeModeBtn = document.getElementById('changeMode');
    const currentModeDisplay = document.getElementById('currentModeDisplay');
    let chosenMode = 'play';

    allModeCards.forEach(card => card.addEventListener('click', () => { allModeCards.forEach(c => c.classList.remove('selected')); card.classList.add('selected'); chosenMode = card.id.replace('mode-', ''); }));
    changeModeBtn.addEventListener('click', () => {
        stopAutoSolver(); clearInterval(tmr); t0 = null; clearInterval(challengeTimer); challengeActive = false;
        document.getElementById('learnPanel').style.display = 'none';
        tE.textContent = '00:00'; mvE.textContent = '0';
        modeOverlay.style.display = 'flex';
    });

    modeStartBtn.addEventListener('click', () => {
        if (chosenMode === 'challenge') {
            modeOverlay.style.display = 'none';
            challengeDifficultyPopup.style.display = 'flex';
            return;
        }
        if (chosenMode === 'sandbox') {
            modeOverlay.style.display = 'none';
            sandboxSetupPopup.style.display = 'flex';
            return;
        }
        CURRENT_MODE = chosenMode;
        modeOverlay.style.display = 'none';
        applyModeChange();
    });

    function applyModeChange() {
        currentModeDisplay.textContent = CURRENT_MODE.charAt(0).toUpperCase() + CURRENT_MODE.slice(1);
        const isSandbox = CURRENT_MODE === 'sandbox';

        document.getElementById('best-score-display').style.display = isSandbox ? 'none' : '';
        document.getElementById('sandbox-status').style.display = isSandbox ? '' : 'none';
        document.querySelector('.progress').parentElement.style.visibility = isSandbox ? 'hidden' : 'visible';

        autoBtn.disabled = isSandbox || CURRENT_MODE !== 'play';
        hintBtn.disabled = isSandbox || run || CURRENT_MODE === 'learn' || CURRENT_MODE === 'teach';
        nE.parentElement.style.display = isSandbox ? 'none' : '';
        speedLabel.style.display = (CURRENT_MODE === 'learn') ? 'block' : 'none';

        buildStage();
        stopAutoSolver();

        if (isSandbox) {
            document.getElementById('sandbox-status').textContent = `${sandboxOptions.poleCount} Cột, ${sandboxOptions.diskCount} Đĩa`;
        }

        if (CURRENT_MODE === 'learn') { startLearnMode(); document.getElementById('learnPanel').style.display = 'block'; }
        else if (CURRENT_MODE === 'teach') { seq = []; generateHanoiSequence(n, 'a', 'c', 'b', seq); ix = 0; highlightTeachMove(); }
    }

    ['Easy', 'Medium', 'Hard'].forEach(diff => {
        document.getElementById(`difficulty${diff}`).addEventListener('click', () => {
            challengeDifficultyPopup.style.display = 'none';
            CURRENT_MODE = 'challenge';
            applyModeChange();
            startChallengeFor(n, diff.toLowerCase());
        });
    });

    const sandboxRuleDescs = {
        classic: 'Quy tắc chuẩn. Đặt đĩa nhỏ lên đĩa lớn hơn. Di chuyển tự do giữa các cột.',
        cyclic: 'Chỉ được di chuyển đĩa sang cột kế tiếp theo chiều kim đồng hồ (1→2, 2→3, ..., cột cuối→1).',
        adjacent: 'Chỉ được di chuyển đĩa sang một trong hai cột ngay bên cạnh (ví dụ: cột 2 có thể đi tới 1 và 3).'
    };
    sandboxDisksSlider.addEventListener('input', (e) => { sandboxDisksValue.textContent = e.target.value; });
    sandboxPolesSlider.addEventListener('input', (e) => { sandboxPolesValue.textContent = e.target.value; });
    sandboxRuleSelect.addEventListener('change', (e) => { sandboxRuleDesc.textContent = sandboxRuleDescs[e.target.value]; });
    
    sandboxStartBtn.addEventListener('click', () => {
        sandboxOptions.diskCount = parseInt(sandboxDisksSlider.value);
        sandboxOptions.poleCount = parseInt(sandboxPolesSlider.value);
        sandboxOptions.rule = sandboxRuleSelect.value;
        sandboxOptions.startPos = sandboxStartPosSelect.value;
        sandboxOptions.target = sandboxTargetSelect.value;
        
        CURRENT_MODE = 'sandbox';
        sandboxSetupPopup.style.display = 'none';
        applyModeChange();
    });

    titleDisplayContainer.addEventListener('click', () => { renderAchievements(); achievementsPopup.style.display = 'flex'; });
    document.getElementById('achievementsClose').addEventListener('click', () => { achievementsPopup.style.display = 'none'; });

    settingsBtn.addEventListener('click', () => { settingsPopup.style.display = 'flex'; });
    settingsCloseBtn.addEventListener('click', () => { settingsPopup.style.display = 'none'; });
    settingsResetBtn.addEventListener('click', () => { 
        if(confirm('Bạn có chắc muốn khôi phục tất cả âm thanh về mặc định không?')) {
            resetCustomSounds();
        }
    });
    Object.entries(audioElements).forEach(([name, item]) => {
        item.input.addEventListener('change', (e) => handleSoundUpload(e, item.key));
    });

    document.addEventListener('DOMContentLoaded', () => {
        const greetingPopup = document.getElementById('greetingPopup');
        document.getElementById('musicYes').addEventListener('click', () => { sndE.checked = true; playBGM(); greetingPopup.style.display = 'none'; modeOverlay.style.display = 'flex'; });
        document.getElementById('musicNo').addEventListener('click', () => { sndE.checked = false; greetingPopup.style.display = 'none'; modeOverlay.style.display = 'flex'; });
        document.getElementById('loserClose').addEventListener('click', () => { loserPopup.style.display = 'none'; });
        
        sandboxRuleDesc.textContent = sandboxRuleDescs[sandboxRuleSelect.value];
        
        loadAchievements();
        updateTitleDisplay();
        loadCustomSounds();
        if (!loadGameState()) buildStage();
    });

    const learnPanel = document.getElementById('learnPanel'); const learnNLabel = document.getElementById('learnN');
    const learnPrev = document.getElementById('learnPrev'); const learnPlay = document.getElementById('learnPlay'); const learnPause = document.getElementById('learnPause'); const learnNext = document.getElementById('learnNext'); const learnSpeed = document.getElementById('learnSpeed'); const stackArea = document.getElementById('stackArea'); const learnExplain = document.getElementById('learnExplain');
    const pseudoCodeLines = document.querySelectorAll('#pseudoCodeArea .code-line');
    
    let learnEvents = [], learnIdx = 0, learnTimer = null, learnRunning = false, learnInterval = 700;
    
    function buildLearnTrace(k, f, t, a, depth, id, events) {
        if (k <= 0) return;
        const uid = id || (Math.random().toString(36).slice(2));
        events.push({ type: 'call', k, from: f, to: t, aux: a, depth, uid, target: 'pre' });
        buildLearnTrace(k - 1, f, a, t, depth + 1, uid + 'L', events);
        
        events.push({ type: 'move', k, from: f, to: t, depth, uid });
        
        events.push({ type: 'call', k, from: f, to: t, aux: a, depth, uid, target: 'post' });
        buildLearnTrace(k - 1, a, t, f, depth + 1, uid + 'R', events);
        
        events.push({ type: 'ret', k, from: f, to: t, depth, uid });
    }
    
    function generateLearnEvents() { learnEvents = []; const K = n; buildLearnTrace(K, 'a', 'c', 'b', 0, null, learnEvents); learnIdx = 0; renderLearnTrace(); }
    
    function renderLearnTrace() {
        stackArea.innerHTML = '';
        const active = learnEvents[learnIdx];
        const map = [];
        for (let i = 0; i <= learnIdx && i < learnEvents.length; i++) {
            const e = learnEvents[i];
            if (e.type === 'call') {
                map.push(e);
            } else if (e.type === 'ret') {
                for (let j = map.length - 1; j >= 0; j--) {
                    if (map[j].uid === e.uid) {
                        map.splice(j, 1);
                        break;
                    }
                }
            }
        }
        
        map.forEach(e => {
            const node = document.createElement('div');
            node.className = 'stack-node';
            node.style.paddingLeft = (10 + e.depth * 12) + 'px';
            node.textContent = `Hanoi(${e.k}, ${e.from}, ${e.to}, ${e.aux})`;
            stackArea.appendChild(node);
        });
        
        pseudoCodeLines.forEach(line => line.classList.remove('highlight'));
        if (active) {
            if (active.type === 'move') {
                learnExplain.textContent = `Thực thi: Di chuyển đĩa ${active.k} từ ${active.from.toUpperCase()} → ${active.to.toUpperCase()}`;
                pseudoCodeLines[3].classList.add('highlight');
            } else if (active.type === 'call') {
                learnExplain.textContent = `Gọi đệ quy: Hanoi(${active.k}, ${active.from.toUpperCase()}, ${active.to.toUpperCase()}, ${active.aux.toUpperCase()})`;
                if (active.target === 'pre') {
                    pseudoCodeLines[2].classList.add('highlight');
                } else if (active.target === 'post') {
                    pseudoCodeLines[4].classList.add('highlight');
                }
            } else if (active.type === 'ret') {
                learnExplain.textContent = `Hoàn thành lời gọi Hanoi(${active.k}, ${active.from.toUpperCase()}, ${active.to.toUpperCase()})`;
                pseudoCodeLines[5].classList.add('highlight');
            }
        }
    }
    
    function stepLearn(dir) {
        const prevIdx = learnIdx;
        if (dir === -1) learnIdx = Math.max(0, learnIdx - 1);
        else learnIdx = Math.min(learnEvents.length - 1, learnIdx + 1);
        
        const e = learnEvents[learnIdx];
        if(e.type === 'move') {
             if(dir === -1) { 
                 const prevE = learnEvents[prevIdx];
                 if (prevE.type === 'move') performMove(prevE.to, prevE.from); 
             } else { 
                 performMove(e.from, e.to); 
             }
         }
         else if (dir === -1 && e.type !== 'move') {
             const prevE = learnEvents[prevIdx];
             if (prevE.type === 'move') {
                 performMove(prevE.to, prevE.from);
             }
         }
        
        renderLearnTrace();
    }
    
    function startLearnRun() { if (learnRunning) return; learnRunning = true; learnPlay.style.display = 'none'; learnPause.style.display = 'inline-block'; learnTimer = setInterval(() => { if (learnIdx < learnEvents.length - 1) { stepLearn(1); } else { stopLearnRun(); checkWinCondition(); } }, learnInterval); }
    function stopLearnRun() { learnRunning = false; clearInterval(learnTimer); learnTimer = null; learnPlay.style.display = 'inline-block'; learnPause.style.display = 'none'; }
    function startLearnMode() { stopLearnRun(); buildStage(); generateLearnEvents(); learnNLabel.textContent = n; }
    
    learnPrev.addEventListener('click', () => { stopLearnRun(); stepLearn(-1); });
    learnPlay.addEventListener('click', startLearnRun);
    learnPause.addEventListener('click', stopLearnRun);
    learnNext.addEventListener('click', () => { stopLearnRun(); stepLearn(1); });
    learnSpeed.addEventListener('change', (e) => { 
        learnInterval = +e.target.value; 
        spdE.value = +e.target.value;
        if (learnRunning) { stopLearnRun(); startLearnRun(); } 
    });
    spdE.addEventListener('change', (e) => {
        learnInterval = +e.target.value;
        learnSpeed.value = +e.target.value;
    });

    function saveGameState() {
        try {
            if (run) return;
            const poles = {};
            document.querySelectorAll('.pole').forEach(p => {
                poles[p.id] = Array.from(p.querySelectorAll('.disk')).map(d => +d.dataset.size);
            });
            const state = {
                CURRENT_MODE,
                n,
                moves,
                undoCount,
                moveHistory,
                poles,
                theme: thE.value,
                sound: sndE.checked,
                sandboxOptions: sandboxOptions,
                timeElapsed: t0 ? (Date.now() - t0) : 0,
                selectedTitleId,
                unlockedAchievements
            };
            localStorage.setItem('hanoi_game_state_v3', JSON.stringify(state));
        } catch (e) {}
    }

    function loadGameState() {
        try {
            const raw = localStorage.getItem('hanoi_game_state_v3');
            if (!raw) return false;
            
            const s = JSON.parse(raw);
            if (!s) return false;
            
            if (s.CURRENT_MODE === 'demo') {
                 localStorage.removeItem('hanoi_game_state_v3');
                 return false;
            }

            thE.value = s.theme || 'classic';
            sndE.checked = s.sound !== undefined ? s.sound : true;
            n = s.n || n;
            sandboxOptions = s.sandboxOptions || sandboxOptions;
            CURRENT_MODE = s.CURRENT_MODE || CURRENT_MODE;
            moveHistory = s.moveHistory || [];
            unlockedAchievements = s.unlockedAchievements || unlockedAchievements;
            selectedTitleId = s.selectedTitleId || selectedTitleId;
            
            applyModeChange();
            
            const polesObj = s.poles || {};
            document.querySelectorAll('.pole').forEach(p => {
                 p.innerHTML = `<div class="peg"></div><div class="pole-label">${(p.id.charCodeAt(0) - 96)}</div>`;
            });

            const theme = thE.value;
            const emojis = THEME_EMOJIS[theme];

            Object.keys(polesObj).forEach(pid => {
                const poleEl = document.getElementById(pid);
                if (!poleEl) return;
                
                polesObj[pid].forEach(size => {
                    const d = document.createElement('div');
                    d.className = 'disk';
                    d.dataset.size = size;
                    d.id = `disk-${size}-${Math.floor(Math.random() * 1e6)}`;
                    const width = 40 + size * 18;
                    d.style.width = width + 'px';
                    d.style.background = diskCols[(size - 1) % diskCols.length];
                    
                    const lbl = document.createElement('div');
                    lbl.className = 'disk--label';
                    
                    let emoji = (emojis && size <= emojis.length) ? emojis[size - 1] : null;
                    let labelContent = '';
                    if (emoji) {
                        labelContent = `<span class="emoji" role="img">${emoji}</span><span class="num">${size}</span>`;
                    } else {
                        labelContent = `<span class="num">${size}</span>`;
                    }
                    lbl.innerHTML = labelContent;
                    d.appendChild(lbl);
                    poleEl.appendChild(d);
                });
            });
            
            moves = s.moves || 0;
            mvE.textContent = moves;
            undoCount = s.undoCount || 0;
            
            if (s.timeElapsed) {
                t0 = Date.now() - s.timeElapsed;
                tmr = setInterval(() => { tE.textContent = formatTime(Math.floor((Date.now() - t0) / 1000)) }, 250);
            } else {
                t0 = null;
            }
            
            updateTopDisks();
            updateBestScoreDisplay();
            renderAchievements();
            updateTitleDisplay();
            return true;
        } catch (e) {
            console.error("Failed to load game state:", e);
            localStorage.removeItem('hanoi_game_state_v3');
            return false;
        }
    }

    window.addEventListener('beforeunload', saveGameState);

})();
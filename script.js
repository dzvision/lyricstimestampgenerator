const lyricInput = document.getElementById('lyricInput');
const startButton = document.getElementById('startButton');
const exportButton = document.getElementById('exportButton');
const inputSection = document.getElementById('inputSection');
const previewSection = document.getElementById('previewSection');
const lyricPreview = document.getElementById('lyricPreview');
const backButton = document.getElementById('backButton');
const editorModal = document.getElementById('editorModal');
const closeModal = document.getElementById('closeModal');
const timerDisplay = document.getElementById('timerDisplay');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const lyricList = document.getElementById('lyricList');
const cancelBtn = document.getElementById('cancelBtn');
const finishBtn = document.getElementById('finishBtn');
const startEditButton = document.getElementById('startEditButton');
const resultSection = document.getElementById('resultSection');
const originalLyric = document.getElementById('originalLyric');
const timedLyric = document.getElementById('timedLyric');
const copyOriginalBtn = document.getElementById('copyOriginalBtn');
const copyTimedBtn = document.getElementById('copyTimedBtn');
const backToInputBtn = document.getElementById('backToInputBtn');
const filterSquareBrackets = document.getElementById('filterSquareBrackets');
const filterRoundBrackets = document.getElementById('filterRoundBrackets');
const filterChineseBrackets = document.getElementById('filterChineseBrackets');

let lyrics = [];
let lyricLines = [];
let currentTime = 0;
let isPlaying = false;
let currentLineIndex = 0;
let animationFrameId = null;
let startTime = 0;

function isHintLine(line) {
    if (filterSquareBrackets.checked && /^\[.*\]$/.test(line)) {
        return true;
    }
    if (filterRoundBrackets.checked && /^\(.*\)$/.test(line)) {
        return true;
    }
    if (filterChineseBrackets.checked && /^（.*）$/.test(line)) {
        return true;
    }
    return false;
}

function parseLyrics(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !isHintLine(line));
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

function formatTimeForLRC(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
}

function updateTimer() {
    if (isPlaying) {
        currentTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(currentTime);
        animationFrameId = requestAnimationFrame(updateTimer);
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        startTime = Date.now() - currentTime;
        playPauseBtn.innerHTML = '<span class="play-icon">⏸</span>';
        updateTimer();
    } else {
        playPauseBtn.innerHTML = '<span class="play-icon">▶</span>';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

function resetTimer() {
    isPlaying = false;
    currentTime = 0;
    timerDisplay.textContent = formatTime(0);
    playPauseBtn.innerHTML = '<span class="play-icon">▶</span>';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function recordTime() {
    if (currentLineIndex < lyricLines.length) {
        lyricLines[currentLineIndex].time = currentTime;
        updateLyricList();
        
        if (currentLineIndex < lyricLines.length - 1) {
            currentLineIndex++;
            scrollToCurrentLine();
        }
    }
}

function selectLine(index) {
    const line = lyricLines[index];
    
    if (line.time !== null) {
        currentTime = Math.max(0, line.time - 2000);
        timerDisplay.textContent = formatTime(currentTime);
        
        if (isPlaying) {
            startTime = Date.now() - currentTime;
        }
    }
    
    currentLineIndex = index;
    updateLyricList();
    scrollToCurrentLine();
}

function updateLyricList() {
    lyricList.innerHTML = '';
    
    lyricLines.forEach((line, index) => {
        const item = document.createElement('div');
        item.className = `lyric-item ${index === currentLineIndex ? 'active' : ''} ${line.time !== null ? 'completed' : ''}`;
        
        const timeTag = document.createElement('span');
        timeTag.className = `time-tag ${line.time !== null ? 'has-time' : ''}`;
        timeTag.textContent = line.time !== null ? formatTime(line.time) : '--:--.--';
        
        const text = document.createElement('span');
        text.className = 'lyric-text';
        text.textContent = line.text;
        
        item.appendChild(timeTag);
        item.appendChild(text);
        
        item.addEventListener('click', () => selectLine(index));
        
        lyricList.appendChild(item);
    });
}

function scrollToCurrentLine() {
    const activeItem = lyricList.querySelector('.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function generateLRC() {
    let lrc = '';
    lyricLines.forEach(line => {
        if (line.time !== null) {
            lrc += `${formatTimeForLRC(line.time)}${line.text}\n`;
        }
    });
    return lrc;
}

function downloadLRC() {
    const lrc = generateLRC();
    const blob = new Blob([lrc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyrics.lrc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

startButton.addEventListener('click', () => {
    const text = lyricInput.value.trim();
    if (!text) {
        alert('请先输入歌词');
        return;
    }
    
    lyrics = parseLyrics(text);
    lyricLines = lyrics.map(text => ({ text, time: null }));
    
    inputSection.style.display = 'none';
    previewSection.style.display = 'block';
    
    lyricPreview.innerHTML = lyrics.map((line, index) => 
        `<p><strong>${index + 1}.</strong> ${line}</p>`
    ).join('');
});

backButton.addEventListener('click', () => {
    previewSection.style.display = 'none';
    inputSection.style.display = 'block';
});

document.getElementById('finishBtn').addEventListener('click', () => {
    editorModal.style.display = 'none';
    resetTimer();
    
    previewSection.style.display = 'none';
    resultSection.style.display = 'block';
    
    originalLyric.value = lyrics.join('\n');
    timedLyric.value = generateLRC();
});

exportButton.addEventListener('click', downloadLRC);

function openEditor() {
    currentLineIndex = 0;
    currentTime = 0;
    isPlaying = false;
    
    editorModal.style.display = 'flex';
    timerDisplay.textContent = formatTime(0);
    playPauseBtn.innerHTML = '<span class="play-icon">▶</span>';
    updateLyricList();
}

startEditButton.addEventListener('click', openEditor);

lyricPreview.addEventListener('click', openEditor);

closeModal.addEventListener('click', () => {
    editorModal.style.display = 'none';
    resetTimer();
});

cancelBtn.addEventListener('click', () => {
    editorModal.style.display = 'none';
    resetTimer();
    previewSection.style.display = 'none';
    inputSection.style.display = 'block';
});

copyOriginalBtn.addEventListener('click', () => {
    originalLyric.select();
    document.execCommand('copy');
    copyOriginalBtn.classList.add('copied');
    setTimeout(() => {
        copyOriginalBtn.classList.remove('copied');
    }, 2000);
});

copyTimedBtn.addEventListener('click', () => {
    timedLyric.select();
    document.execCommand('copy');
    copyTimedBtn.classList.add('copied');
    setTimeout(() => {
        copyTimedBtn.classList.remove('copied');
    }, 2000);
});

backToInputBtn.addEventListener('click', () => {
    resultSection.style.display = 'none';
    inputSection.style.display = 'block';
});

playPauseBtn.addEventListener('click', togglePlayPause);

resetBtn.addEventListener('click', resetTimer);

document.addEventListener('keydown', (e) => {
    if (editorModal.style.display === 'flex') {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!isPlaying) {
                togglePlayPause();
            } else {
                recordTime();
            }
        }
    }
});

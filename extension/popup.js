// Helper: get current tab's URL (Chrome extension API)
function getCurrentTabUrl(callback) {
  if (!chrome.tabs) {
    // Not running as extension popup (for dev/testing)
    callback(window.location.href);
    return;
  }
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    callback(tab ? tab.url : '');
  });
}

// Helper: extract video ID from YouTube URL
function extractYouTubeVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return u.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

// State
let isRecording = false;
let hasRecording = false;
let recordedAudioUrl = null;
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let audio = null;
let videoTabId = null;
let playWithOriginalAudio = false;

// Helper: render commentary list UI
function renderCommentaryPopup(commentaries) {
  const root = document.getElementById('root');
  root.innerHTML = '';

  // Popup container
  const container = document.createElement('div');
  container.style.background = '#fff';
  container.style.borderRadius = '16px';
  container.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)';
  container.style.padding = '24px 18px 18px 18px';
  container.style.minWidth = '320px';
  container.style.maxWidth = '340px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.position = 'relative';

  // Logo (top-left)
  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('icon-128.png');
  logo.alt = 'Altcast Logo';
  logo.style.width = '32px';
  logo.style.height = '32px';
  logo.style.position = 'absolute';
  logo.style.left = '12px';
  logo.style.top = '12px';
  logo.style.border = '2px solid red';
  logo.onerror = () => { alert('Image failed to load!'); };
  container.appendChild(logo);

  // Close button (top-right)
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.right = '12px';
  closeBtn.style.top = '8px';
  closeBtn.style.fontSize = '1.5em';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => window.close();
  container.appendChild(closeBtn);

  // Commentary list
  if (commentaries.length > 0) {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.gap = '18px';
    list.style.margin = '32px 0 18px 0';
    commentaries.forEach(c => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.alignItems = 'center';
      item.style.position = 'relative';
      // Avatar
      const avatar = document.createElement('img');
      avatar.src = c.profile_picture_url;
      avatar.alt = c.username;
      avatar.style.width = '64px';
      avatar.style.height = '64px';
      avatar.style.borderRadius = '50%';
      avatar.style.objectFit = 'cover';
      avatar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
      avatar.style.cursor = 'pointer';
      // Play icon overlay
      const playIcon = document.createElement('div');
      playIcon.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="rgba(0,0,0,0.32)"/><polygon points="12,9 24,16 12,23" fill="#fff"/></svg>`;
      playIcon.style.position = 'absolute';
      playIcon.style.left = '16px';
      playIcon.style.top = '16px';
      playIcon.style.pointerEvents = 'none';
      // Click handler
      avatar.onclick = () => alert(`Playing commentary by ${c.username}`);
      item.appendChild(avatar);
      item.appendChild(playIcon);
      // Username
      const uname = document.createElement('div');
      uname.textContent = c.username;
      uname.style.fontWeight = 'bold';
      uname.style.marginTop = '8px';
      uname.style.fontSize = '1.1em';
      item.appendChild(uname);
      // Play count
      const playCount = document.createElement('div');
      playCount.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" style="vertical-align:middle;"><polygon points="3,2 13,8 3,14" fill="#888"/></svg> <span style="color:#888;">${c.play_count}</span>`;
      playCount.style.fontSize = '0.95em';
      playCount.style.marginTop = '2px';
      item.appendChild(playCount);
      list.appendChild(item);
    });
    container.appendChild(list);
  } else {
    // No commentaries message
    const msg = document.createElement('div');
    msg.textContent = 'No commentaries yet. Be the first!';
    msg.style.margin = '40px 0 24px 0';
    msg.style.color = '#666';
    msg.style.fontSize = '1.1em';
    container.appendChild(msg);
  }

  // Recording controls
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.flexDirection = 'column';
  controls.style.alignItems = 'center';
  controls.style.width = '100%';

  // Record/Stop button
  const recordBtn = document.createElement('button');
  recordBtn.textContent = isRecording ? 'Stop' : 'Record';
  recordBtn.style.background = isRecording ? '#ef4444' : '#2563eb';
  recordBtn.style.color = '#fff';
  recordBtn.style.fontSize = '1.3em';
  recordBtn.style.padding = '10px 0';
  recordBtn.style.width = '90%';
  recordBtn.style.border = 'none';
  recordBtn.style.borderRadius = '8px';
  recordBtn.style.marginTop = '18px';
  recordBtn.style.cursor = 'pointer';
  recordBtn.onclick = async () => {
    console.log('[Altcast] Record/Stop button clicked. isRecording:', isRecording);
    if (!isRecording) {
      // Start recording
      console.log('[Altcast] Starting recording...');
      isRecording = true;
      hasRecording = false;
      recordedAudioUrl = null;
      audioChunks = [];
      audioBlob = null;
      audio = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          recordedAudioUrl = URL.createObjectURL(audioBlob);
          audio = new Audio(recordedAudioUrl);
          hasRecording = true;
          isRecording = false;
          console.log('[Altcast] Recording stopped. Audio blob created.');
          renderCommentaryPopup(commentaries);
        };
        mediaRecorder.start();
        console.log('[Altcast] MediaRecorder started.');
      } catch (err) {
        alert('Microphone access denied or error: ' + err.message);
        isRecording = false;
      }
      renderCommentaryPopup(commentaries);
    } else {
      // Stop recording
      console.log('[Altcast] Stopping recording...');
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        console.log('[Altcast] MediaRecorder stopped.');
      }
      isRecording = false;
      renderCommentaryPopup(commentaries);
    }
  };
  controls.appendChild(recordBtn);

  // After recording: show Play, Delete, Upload, Toggle audio
  if (hasRecording && !isRecording) {
    // Play button
    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';
    playBtn.style.marginTop = '10px';
    playBtn.style.width = '90%';
    playBtn.style.fontSize = '1.1em';
    playBtn.style.background = '#10b981';
    playBtn.style.color = '#fff';
    playBtn.style.border = 'none';
    playBtn.style.borderRadius = '8px';
    playBtn.style.cursor = 'pointer';
    playBtn.onclick = () => {
      if (audio) audio.play();
    };
    controls.appendChild(playBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.marginTop = '10px';
    deleteBtn.style.width = '90%';
    deleteBtn.style.fontSize = '1.1em';
    deleteBtn.style.background = '#f59e42';
    deleteBtn.style.color = '#fff';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '8px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.onclick = () => {
      hasRecording = false;
      recordedAudioUrl = null;
      audioChunks = [];
      audioBlob = null;
      audio = null;
      renderCommentaryPopup(commentaries);
    };
    controls.appendChild(deleteBtn);

    // Upload button (mock)
    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = 'Upload';
    uploadBtn.style.marginTop = '10px';
    uploadBtn.style.width = '90%';
    uploadBtn.style.fontSize = '1.1em';
    uploadBtn.style.background = '#6366f1';
    uploadBtn.style.color = '#fff';
    uploadBtn.style.border = 'none';
    uploadBtn.style.borderRadius = '8px';
    uploadBtn.style.cursor = 'pointer';
    uploadBtn.onclick = () => {
      alert('Upload successful! (mock)');
    };
    controls.appendChild(uploadBtn);

    // Toggle audio button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = playWithOriginalAudio ? 'Play with original audio' : 'Mute original audio';
    toggleBtn.style.marginTop = '10px';
    toggleBtn.style.width = '90%';
    toggleBtn.style.fontSize = '1.1em';
    toggleBtn.style.background = '#e5e7eb';
    toggleBtn.style.color = '#222';
    toggleBtn.style.border = 'none';
    toggleBtn.style.borderRadius = '8px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.onclick = () => {
      playWithOriginalAudio = !playWithOriginalAudio;
      renderCommentaryPopup(commentaries);
    };
    controls.appendChild(toggleBtn);
  }

  container.appendChild(controls);
  root.appendChild(container);
}

// Main logic
getCurrentTabUrl(function(url) {
  const videoId = extractYouTubeVideoId(url);
  let commentaries = [];
  if (videoId && window.mockCommentaries) {
    commentaries = window.mockCommentaries.filter(c => c.video_id === videoId);
  }
  renderCommentaryPopup(commentaries);
}); 
let hasRecording = false;
console.log('[Altcast] content.js loaded');

// Inject mock data if not already present
if (!window.mockCommentaries) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('mockCommentaries.js');
  document.documentElement.appendChild(script);
  console.log('[Altcast] Injected mockCommentaries.js');
}

// Remove old notification logic and inject full commentary popup UI

// Helper: extract video ID from YouTube URL
function getYouTubeVideoId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('v');
}

// Helper: render commentary popup UI (reusing popup.js logic, but adapted for content script)
function renderCommentaryPopup(commentaries) {
  // Inject CSS for button style and hover if not present (before any button is created)
  if (!document.getElementById('altcast-btn-row-style')) {
    const style = document.createElement('style');
    style.id = 'altcast-btn-row-style';
    style.textContent = `
      .altcast-btn-row-btn {
        width: 38px;
        height: 38px;
        background: #fff;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
        padding: 0;
        margin: 0;
      }
      .altcast-btn-row-btn svg {
        width: 22px;
        height: 22px;
        stroke: #6b7280;
        fill: none;
        stroke-width: 2.2;
        transition: stroke 0.2s;
      }
      .altcast-btn-row-btn img {
        width: 22px;
        height: 22px;
      }
      .altcast-btn-row-btn:hover {
        border-color: #6366f1;
      }
      .altcast-btn-row-btn:hover svg {
        stroke: #6366f1;
      }
      .altcast-btn-row-btn:hover img {
        filter: brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(749%) hue-rotate(210deg) brightness(95%) contrast(92%);
      }
    `;
    document.head.appendChild(style);
  }
  // Remove existing popup if present
  const existing = document.getElementById('altcast-commentary-popup');
  if (existing) existing.remove();

  // Popup container
  const container = document.createElement('div');
  container.id = 'altcast-commentary-popup';
  container.style.background = '#fff';
  container.style.borderRadius = '16px';
  container.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)';
  container.style.padding = '24px 18px 18px 18px';
  container.style.minWidth = '320px';
  container.style.maxWidth = '340px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.position = 'fixed';
  container.style.top = '32px';
  container.style.right = '32px';
  container.style.zIndex = '999999';

  // Logo (top-left)
  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('icon-128.png');
  logo.alt = 'Altcast Logo';
  logo.style.width = '32px';
  logo.style.height = '32px';
  logo.style.position = 'absolute';
  logo.style.left = '12px';
  logo.style.top = '12px';
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
  closeBtn.onclick = () => container.remove();
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

  // Record button (blue rectangle with text)
  const recordBtn = document.createElement('button');
  recordBtn.textContent = 'Record your commentary';
  recordBtn.style.background = '#2563eb';
  recordBtn.style.color = '#fff';
  recordBtn.style.fontSize = '1.3em';
  recordBtn.style.padding = '10px 0';
  recordBtn.style.width = '90%';
  recordBtn.style.border = 'none';
  recordBtn.style.borderRadius = '8px';
  recordBtn.style.marginTop = '18px';
  recordBtn.style.cursor = 'pointer';
  recordBtn.onclick = () => {
    // Hide the main record button
    recordBtn.style.display = 'none';
    // Create a new small record button inside the popup container (rounded square, hollow)
    let smallRecordBtn = document.createElement('button');
    smallRecordBtn.id = 'altcast-small-record-btn';
    smallRecordBtn.title = 'Start Recording';
    smallRecordBtn.className = 'altcast-btn-row-btn';
    smallRecordBtn.innerHTML = `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/></svg>`;
    smallRecordBtn.onclick = () => {
      // If already recording (button is hollow/pulsing), stop and revert style
      if (smallRecordBtn.classList.contains('altcast-pulse')) {
        smallRecordBtn.className = 'altcast-btn-row-btn';
        smallRecordBtn.innerHTML = `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/></svg>`;
        smallRecordBtn.classList.remove('altcast-pulse');
        // Remove the small record button before showing the button row
        if (smallRecordBtn.parentNode) smallRecordBtn.parentNode.removeChild(smallRecordBtn);
        showButtonRow(container);
        // TODO: Stop recording audio and video (next step)
        return;
      }
      // Show countdown overlay in the popup
      let countdownOverlay = document.getElementById('altcast-countdown-overlay');
      if (!countdownOverlay) {
        countdownOverlay = document.createElement('div');
        countdownOverlay.id = 'altcast-countdown-overlay';
        countdownOverlay.style.position = 'absolute';
        countdownOverlay.style.top = '0';
        countdownOverlay.style.left = '0';
        countdownOverlay.style.width = '100%';
        countdownOverlay.style.height = '100%';
        countdownOverlay.style.background = 'rgba(0,0,0,0.7)';
        countdownOverlay.style.display = 'flex';
        countdownOverlay.style.alignItems = 'center';
        countdownOverlay.style.justifyContent = 'center';
        countdownOverlay.style.fontSize = '3em';
        countdownOverlay.style.color = '#fff';
        countdownOverlay.style.zIndex = '1000001';
        container.appendChild(countdownOverlay);
      }
      // Immediately seek video to 0:00 but do not play
      const ytVideo = document.querySelector('video');
      if (ytVideo) {
        ytVideo.currentTime = 0;
        ytVideo.pause();
      }
      let count = 3;
      countdownOverlay.textContent = count;
      countdownOverlay.style.display = 'flex';
      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          countdownOverlay.textContent = count;
        } else {
          clearInterval(countdownInterval);
          countdownOverlay.style.display = 'none';
          // Play the YouTube video from the start
          if (ytVideo) {
            ytVideo.play();
          }
          // Change small record button to hollow + pulse
          smallRecordBtn.className = 'altcast-btn-row-btn altcast-pulse';
          smallRecordBtn.innerHTML = `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/></svg>`;
          // Inject pulse animation CSS if not present
          if (!document.getElementById('altcast-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'altcast-pulse-style';
            style.textContent = `
              @keyframes altcast-pulse {
                0% { box-shadow: 0 0 0 0 #ef444488; }
                70% { box-shadow: 0 0 0 10px #ef444400; }
                100% { box-shadow: 0 0 0 0 #ef444400; }
              }
              .altcast-pulse {
                animation: altcast-pulse 1.2s infinite;
              }
              .altcast-btn-row-btn.altcast-pulse svg circle {
                stroke: #ef4444;
              }
            `;
            document.head.appendChild(style);
          }
          // Listen for video end to stop recording
          if (ytVideo) {
            ytVideo.addEventListener('ended', function onEnded() {
              ytVideo.removeEventListener('ended', onEnded);
              smallRecordBtn.className = 'altcast-btn-row-btn';
              smallRecordBtn.innerHTML = `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/></svg>`;
              smallRecordBtn.classList.remove('altcast-pulse');
              // Remove the small record button before showing the button row
              if (smallRecordBtn.parentNode) smallRecordBtn.parentNode.removeChild(smallRecordBtn);
              showButtonRow(container);
              // TODO: Stop recording audio (next step)
            });
          }
          // TODO: Start recording audio (next step)
        }
      }, 1000);
    };
    console.log('[Altcast] Appending small record button to popup container');
    container.appendChild(smallRecordBtn);
  };
  container.appendChild(recordBtn);

  document.body.appendChild(container);
}

function checkForCommentaryAndShowPopup() {
  const videoId = getYouTubeVideoId();
  if (!videoId) return;
  const tryCheck = () => {
    if (window.mockCommentaries) {
      const commentaries = window.mockCommentaries.filter(c => c.video_id === videoId);
      renderCommentaryPopup(commentaries);
    } else {
      setTimeout(tryCheck, 100);
    }
  };
  tryCheck();
}

// Helper to show the button row after recording stops
function showButtonRow(container) {
  // Remove any previous button row
  let btnRow = document.getElementById('altcast-btn-row');
  if (btnRow) btnRow.remove();
  // Create a new record button for the row
  const recordBtnRow = document.createElement('button');
  recordBtnRow.className = 'altcast-btn-row-btn';
  recordBtnRow.title = 'Record';
  recordBtnRow.innerHTML = `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/></svg>`;
  recordBtnRow.onclick = () => {
    // Restart the recording flow (reset UI)
    window.location.reload(); // Or call your custom logic to reset and show the record UI
  };
  // Inject CSS for button style and hover if not present
  if (!document.getElementById('altcast-btn-row-style')) {
    const style = document.createElement('style');
    style.id = 'altcast-btn-row-style';
    style.textContent = `
      .altcast-btn-row-btn {
        width: 38px;
        height: 38px;
        background: #fff;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
        padding: 0;
        margin: 0;
      }
      .altcast-btn-row-btn svg {
        width: 22px;
        height: 22px;
        stroke: #6b7280;
        fill: none;
        stroke-width: 2.2;
        transition: stroke 0.2s;
      }
      .altcast-btn-row-btn img {
        width: 22px;
        height: 22px;
      }
      .altcast-btn-row-btn:hover {
        border-color: #6366f1;
      }
      .altcast-btn-row-btn:hover svg {
        stroke: #6366f1;
      }
      .altcast-btn-row-btn:hover img {
        filter: brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(749%) hue-rotate(210deg) brightness(95%) contrast(92%);
      }
    `;
    document.head.appendChild(style);
  }
  // Create horizontal button row
  btnRow = document.createElement('div');
  btnRow.id = 'altcast-btn-row';
  btnRow.style.display = 'flex';
  btnRow.style.flexDirection = 'row';
  btnRow.style.alignItems = 'center';
  btnRow.style.justifyContent = 'center';
  btnRow.style.gap = '16px';
  btnRow.style.margin = '0 auto 0 auto';
  // Add the new record button to the row
  btnRow.appendChild(recordBtnRow);
  // Play button (PNG)
  const playBtn = document.createElement('button');
  playBtn.className = 'altcast-btn-row-btn';
  playBtn.title = 'Play';
  const playImg = document.createElement('img');
  playImg.src = chrome.runtime.getURL('play.png');
  playImg.alt = 'Play';
  playImg.style.width = '22px';
  playImg.style.height = '22px';
  playBtn.appendChild(playImg);
  playBtn.onclick = () => {
    alert('Play logic coming soon!');
  };
  btnRow.appendChild(playBtn);
  // Delete button (PNG)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'altcast-btn-row-btn';
  deleteBtn.title = 'Delete';
  const deleteImg = document.createElement('img');
  deleteImg.src = chrome.runtime.getURL('delete.png');
  deleteImg.alt = 'Delete';
  deleteImg.style.width = '22px';
  deleteImg.style.height = '22px';
  deleteBtn.appendChild(deleteImg);
  deleteBtn.onclick = () => {
    alert('Delete logic coming soon!');
  };
  btnRow.appendChild(deleteBtn);
  // Upload button (PNG)
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'altcast-btn-row-btn';
  uploadBtn.title = 'Upload';
  const uploadImg = document.createElement('img');
  uploadImg.src = chrome.runtime.getURL('upload.png');
  uploadImg.alt = 'Upload';
  uploadImg.style.width = '22px';
  uploadImg.style.height = '22px';
  uploadBtn.appendChild(uploadImg);
  uploadBtn.onclick = () => {
    alert('Upload logic coming soon!');
  };
  btnRow.appendChild(uploadBtn);
  // Append row to popup container
  container.appendChild(btnRow);
}

// Run on load and on history changes (YouTube is SPA)
checkForCommentaryAndShowPopup();
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkForCommentaryAndShowPopup();
  }
}).observe(document.body, {subtree: true, childList: true}); 
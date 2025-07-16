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
  const logo = document.createElement('div');
  logo.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32"><polyline points="2,16 8,8 16,24 24,8 30,16" fill="none" stroke="#6c47ff" stroke-width="3" stroke-linecap="round"/></svg>`;
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

  // Record button
  const recordBtn = document.createElement('button');
  recordBtn.textContent = 'Record';
  recordBtn.style.background = '#2563eb';
  recordBtn.style.color = '#fff';
  recordBtn.style.fontSize = '1.3em';
  recordBtn.style.padding = '10px 0';
  recordBtn.style.width = '90%';
  recordBtn.style.border = 'none';
  recordBtn.style.borderRadius = '8px';
  recordBtn.style.marginTop = '18px';
  recordBtn.style.cursor = 'pointer';
  recordBtn.onclick = () => alert('Record feature coming soon!');
  container.appendChild(recordBtn);

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
(function() {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const agentId = currentScript.getAttribute('data-agent-id');
  const widgetColor = currentScript.getAttribute('data-color') || '#8b5cf6';
  const position = currentScript.getAttribute('data-position') || 'bottom-right';

  if (!agentId) {
    console.error('VaaniAI Widget: Missing data-agent-id attribute');
    return;
  }

  // Inject styles
  const style = document.createElement('style');
  style.innerHTML = `
    .vaaniai-widget-btn {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 24px;' : 'top: 24px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: ${widgetColor};
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .vaaniai-widget-btn:hover {
      transform: scale(1.1);
    }
    .vaaniai-widget-btn svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .vaaniai-widget-iframe-container {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 100px;' : 'top: 100px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      z-index: 999999;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .vaaniai-widget-iframe-container.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .vaaniai-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @media (max-width: 480px) {
      .vaaniai-widget-iframe-container {
        width: calc(100vw - 32px);
        left: 16px;
        right: 16px;
        bottom: 100px;
      }
    }
  `;
  document.head.appendChild(style);

  // Create Button
  const btn = document.createElement('div');
  btn.className = 'vaaniai-widget-btn';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  `;

  // Create Iframe Container
  const container = document.createElement('div');
  container.className = 'vaaniai-widget-iframe-container';
  
  // Note: we point to the standalone widget page which we will create next
  // Or point directly to test-agent with a compact param
  // Assuming frontend runs on window.location.origin if self-hosted, else replace with actual hosted URL
  const scriptUrl = new URL(currentScript.src);
  const baseUrl = scriptUrl.origin;
  
  const iframe = document.createElement('iframe');
  iframe.className = 'vaaniai-widget-iframe';
  iframe.allow = "microphone";
  iframe.src = \`\${baseUrl}/test-agent?agentId=\${agentId}&widget=true\`;
  
  container.appendChild(iframe);
  document.body.appendChild(container);
  document.body.appendChild(btn);

  let isOpen = false;
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      container.classList.add('open');
      btn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>\`;
    } else {
      container.classList.remove('open');
      btn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>\`;
      // Optional: Post message to iframe to end call if closed
      iframe.contentWindow.postMessage({ type: 'close_widget' }, '*');
    }
  });
})();

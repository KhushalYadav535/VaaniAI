/**
 * VaaniAI Web Widget
 * Include this script on any webpage to add an AI voice agent floating button.
 */

(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWidget();
  } else {
    document.addEventListener('DOMContentLoaded', initWidget);
  }

  function initWidget() {
    const config = window.vaaniConfig || {
      agentId: 'YOUR_AGENT_ID',
      color: '#8b5cf6',
      text: 'Talk to AI Support',
      position: 'bottom-right'
    };

    // Create a container for the widget
    const container = document.createElement('div');
    container.id = 'vaaniai-widget-container';
    container.style.position = 'fixed';
    container.style.zIndex = '999999';
    
    if (config.position === 'bottom-left') {
      container.style.bottom = '20px';
      container.style.left = '20px';
    } else {
      container.style.bottom = '20px';
      container.style.right = '20px';
    }

    // Determine base URL dynamically (assuming this script is loaded from the VaaniAI host)
    // fallback to localhost if cannot determine
    const scriptTag = document.currentScript;
    let baseUrl = 'http://localhost:3000';
    if (scriptTag && scriptTag.src) {
      const url = new URL(scriptTag.src);
      baseUrl = url.origin;
    }

    // Create the iframe (hidden initially)
    const iframe = document.createElement('iframe');
    // Using the dedicated widget view page
    iframe.src = `${baseUrl}/widget?agentId=${config.agentId}`;
    iframe.style.width = '380px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    iframe.style.display = 'none';
    iframe.style.marginBottom = '20px';
    iframe.style.backgroundColor = 'white';
    iframe.style.transition = 'all 0.3s ease';
    iframe.style.transformOrigin = config.position === 'bottom-left' ? 'bottom left' : 'bottom right';
    iframe.style.transform = 'scale(0)';
    iframe.allow = "microphone";

    // Create the floating button
    const button = document.createElement('button');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      <span style="font-family: inherit; font-weight: 500;">${config.text}</span>
    `;
    button.style.backgroundColor = config.color;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '9999px';
    button.style.padding = '12px 24px';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
    button.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    if (config.position === 'bottom-right') {
      button.style.marginLeft = 'auto';
    }

    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 12px 20px rgba(0,0,0,0.15)';
    };
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
    };

    let isOpen = false;

    button.onclick = () => {
      isOpen = !isOpen;
      if (isOpen) {
        iframe.style.display = 'block';
        // Trigger reflow
        void iframe.offsetWidth;
        iframe.style.transform = 'scale(1)';
        button.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        button.style.padding = '16px';
      } else {
        iframe.style.transform = 'scale(0)';
        setTimeout(() => {
          iframe.style.display = 'none';
        }, 300);
        button.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span style="font-family: inherit; font-weight: 500;">${config.text}</span>
        `;
        button.style.padding = '12px 24px';
      }
    };

    container.appendChild(iframe);
    container.appendChild(button);
    document.body.appendChild(container);
  }
})();

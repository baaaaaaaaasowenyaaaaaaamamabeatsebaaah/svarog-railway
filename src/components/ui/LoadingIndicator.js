// src/components/ui/LoadingIndicator.js
export default class LoadingIndicator {
  constructor(options = {}) {
    this.type = options.type || 'spinner'; // spinner, bar, pulse
    this.message = options.message || 'Loading...';
    this.showMessage = options.showMessage !== false;
    this.element = this.createLoadingElement();
  }

  createLoadingElement() {
    const container = document.createElement('div');
    container.className = `loading-indicator loading-indicator--${this.type}`;
    container.style.padding = '30px';
    container.style.textAlign = 'center';

    let indicatorHtml = '';

    switch (this.type) {
      case 'bar':
        indicatorHtml = `
          <div class="loading-bar">
            <div class="loading-bar__progress" style="height: 4px; background: var(--color-primary, #4294d0); width: 0%; animation: loading-bar-animation 1.5s infinite ease-in-out;"></div>
          </div>
        `;
        break;
      case 'pulse':
        indicatorHtml = `
          <div class="loading-pulse" style="display: inline-block; transform: scale(0.75); animation: loading-pulse-animation 1.5s infinite ease-in-out;">
            <div style="width: 20px; height: 20px; background: var(--color-primary, #4294d0); border-radius: 50%; margin: 0 5px; display: inline-block;"></div>
            <div style="width: 20px; height: 20px; background: var(--color-primary, #4294d0); border-radius: 50%; margin: 0 5px; display: inline-block; animation-delay: 0.2s;"></div>
            <div style="width: 20px; height: 20px; background: var(--color-primary, #4294d0); border-radius: 50%; margin: 0 5px; display: inline-block; animation-delay: 0.4s;"></div>
          </div>
        `;
        break;
      default: // spinner
        indicatorHtml = `
          <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px; border: 3px solid rgba(0, 0, 0, 0.1); border-left: 3px solid var(--color-primary, #4294d0); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        `;
    }

    // Add styling for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes loading-bar-animation {
        0% { width: 0%; }
        50% { width: 100%; }
        100% { width: 0%; }
      }
      @keyframes loading-pulse-animation {
        0%, 80%, 100% { transform: scale(0.75); }
        40% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    container.innerHTML = indicatorHtml;

    if (this.showMessage && this.message) {
      const messageElement = document.createElement('p');
      messageElement.className = 'loading-indicator__message';
      messageElement.textContent = this.message;
      messageElement.style.margin = '10px 0 0';
      messageElement.style.color = 'var(--color-text-light, #6c757d)';
      container.appendChild(messageElement);
    }

    return container;
  }

  // Update loading message
  updateMessage(message) {
    this.message = message;
    const messageElement = this.element.querySelector(
      '.loading-indicator__message'
    );
    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  getElement() {
    return this.element;
  }
}

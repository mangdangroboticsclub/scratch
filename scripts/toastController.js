// Toast Notification System
class ToastController {
    constructor() {
        this.container = null;
        this.defaultPosition = 80; // Default top position from top of screen
        this.minimapOffset = 200; // Additional offset when minimap is visible
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.updatePosition();
        document.body.appendChild(this.container);
    }

    updatePosition(topOffset = null) {
        if (!this.container) return;
        
        if (topOffset !== null) {
            this.container.style.top = `${topOffset}px`;
        } else {
            // Auto-detect if minimap is visible and adjust position
            const minimap = document.querySelector('.blocklyMinimap');
            const isMinimapVisible = minimap && minimap.offsetParent !== null;
            const position = isMinimapVisible ? 
                this.defaultPosition + this.minimapOffset : 
                this.defaultPosition;
            
            this.container.style.top = `${position}px`;
        }
    }

    show(message, type = 'info', options = {}) {
        const {
            duration = 3000,
            customColor = null,
            topOffset = null,
            persistent = false
        } = options;

        // Update container position if specified
        if (topOffset !== null) {
            this.updatePosition(topOffset);
        } else {
            this.updatePosition(); // Auto-detect minimap
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Create message content with close hint
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeHint = document.createElement('span');
        closeHint.textContent = ' ✕';
        closeHint.style.cssText = `
            opacity: 0.7;
            font-size: 0.9em;
            margin-left: 8px;
            float: right;
        `;
        
        toast.appendChild(messageSpan);
        toast.appendChild(closeHint);

        // Apply custom color if provided
        if (customColor) {
            if (typeof customColor === 'string') {
                toast.style.backgroundColor = customColor;
                toast.style.color = 'white';
            } else if (typeof customColor === 'object') {
                toast.style.backgroundColor = customColor.background || customColor.bg;
                toast.style.color = customColor.color || customColor.text || 'white';
            }
        }

        // Add click-to-dismiss functionality
        toast.addEventListener('click', () => {
            this.hide(toast);
        });

        // Add to container
        this.container.appendChild(toast);

        // Trigger show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-remove after duration (unless persistent)
        if (!persistent) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toast; // Return toast element for manual control
    }

    hide(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    hideAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }

    // Convenience methods for different toast types
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    save(message, options = {}) {
        return this.show(message, 'save', options);
    }

    santa(message, options = {}) {
        return this.show(message, 'santa', options);
    }

    // Method to check minimap visibility and update position accordingly
    checkMinimapAndUpdate() {
        this.updatePosition();
    }
}

// Create global toast controller instance
window.toast = new ToastController();

// Auto-update toast position when minimap visibility changes
const observeMinimapChanges = () => {
    const minimap = document.querySelector('.blocklyMinimap');
    if (minimap) {
        const observer = new MutationObserver(() => {
            window.toast.checkMinimapAndUpdate();
        });
        
        observer.observe(minimap, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        observer.observe(minimap.parentNode, {
            childList: true,
            subtree: true
        });
    }
};

// Initialize minimap observer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Blockly to initialize
    setTimeout(observeMinimapChanges, 1000);
});

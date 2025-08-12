// TopBar width toggle controller
class TopBarWidthController {
    constructor() {
        this.defaultWidth = '85%';
        this.fullWidth = '100%';
        this.currentWidth = this.loadWidthState();
        this.isFullWidth = false;
        this.toggleButton = null;
        this.init();
    }

    init() {
        this.createToggleButton();
        this.applyWidthState();
        this.setupEventListeners();
    }

    createToggleButton() {
        // Create a wrapper container for the full visual effect
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.className = 'toggle-toolbox-container';
        
        // Create the visual background extension
        this.backgroundExtension = document.createElement('div');
        this.backgroundExtension.className = 'toggle-toolbox-background';
        
        // Create the actual clickable button
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'toggleToolbox';
        this.toggleButton.className = 'toggle-toolbox';
        
        // Create a span for the arrow text that can rotate independently
        this.arrowSpan = document.createElement('span');
        this.arrowSpan.className = 'toggle-toolbox-arrow';
        this.arrowSpan.innerHTML = '>'; // Greater than sign for expand
        this.toggleButton.appendChild(this.arrowSpan);
        
        // Assemble the structure
        this.buttonContainer.appendChild(this.backgroundExtension);
        this.buttonContainer.appendChild(this.toggleButton);
        
        this.toggleButton.title = 'Expand workspace (hide toolbox)';
        this.toggleButton.setAttribute('aria-label', 'Toggle workspace width');

        // Insert at the beginning of left-align container
        const leftAlign = document.querySelector('#topBar .left-align');
        if (leftAlign) {
            leftAlign.insertBefore(this.buttonContainer, leftAlign.firstChild);
        }
    }

    setupEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', (event) => {
                this.addRippleEffect(event);
                this.toggleWidth();
            });
        }
    }

    addRippleEffect(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = (x - 10) + 'px';
        ripple.style.top = (y - 10) + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';

        button.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }

    toggleWidth() {
        this.isFullWidth = !this.isFullWidth;
        const newWidth = this.isFullWidth ? this.fullWidth : this.defaultWidth;
        
        this.setWidth(newWidth);
        this.saveWidthState();
        this.updateButtonState();
    }

    setWidth(width) {
        this.currentWidth = width;
        
        // Add transition class for smooth animation
        document.documentElement.classList.add('topbar-transitioning');
        
        // Set the new width
        document.documentElement.style.setProperty('--topBar', width);
        
        // Remove transition class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('topbar-transitioning');
        }, 200);
        
        // Update button icon based on state
        this.updateButtonState();
    }

    updateButtonState() {
        if (this.arrowSpan) {
            if (this.isFullWidth) {
                this.arrowSpan.style.transform = 'rotate(180deg)';
                this.toggleButton.title = 'Show toolbox (compress workspace)';
                this.hideResizer();
            } else {
                this.arrowSpan.style.transform = 'rotate(0deg)';
                this.toggleButton.title = 'Hide toolbox (expand workspace)';
                this.showResizer();
            }
        }
    }

    hideResizer() {
        const resizer = document.getElementById('toolboxResizer');
        if (resizer) {
            resizer.classList.add('hidden');
        }
    }

    showResizer() {
        const resizer = document.getElementById('toolboxResizer');
        if (resizer) {
            resizer.classList.remove('hidden');
        }
    }

    saveWidthState() {
        const state = {
            isFullWidth: this.isFullWidth,
            currentWidth: this.currentWidth
        };
        sessionStorage.setItem('topBarWidthState', JSON.stringify(state));
    }

    loadWidthState() {
        try {
            const saved = sessionStorage.getItem('topBarWidthState');
            if (saved) {
                const state = JSON.parse(saved);
                this.isFullWidth = state.isFullWidth || false;
                return state.currentWidth || this.defaultWidth;
            }
        } catch (error) {
            console.warn('Failed to load topBar width state:', error);
        }
        return this.defaultWidth;
    }

    applyWidthState() {
        this.setWidth(this.currentWidth);
        this.updateButtonState(); // This will also handle resizer visibility
    }

    // Public method to get current state
    getState() {
        return {
            isFullWidth: this.isFullWidth,
            currentWidth: this.currentWidth
        };
    }

    // Public method to set custom width (for other controllers)
    setCustomWidth(width) {
        this.defaultWidth = width;
        if (!this.isFullWidth) {
            this.setWidth(width);
            this.saveWidthState();
        }
    }
}

// Initialize the controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.topBarWidthController = new TopBarWidthController();
});

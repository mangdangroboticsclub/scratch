// Show Code Modal Controller
// Handles the display of generated Python code in the modal

class ShowCodeModal {
    constructor() {
        this.currentCode = '';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Copy code button
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => {
                this.copyCurrentCode();
            });
        }

        // Copy Santa code button
        const copySantaBtn = document.getElementById('copySantaBtn');
        if (copySantaBtn) {
            copySantaBtn.addEventListener('click', () => {
                this.copySantaCode();
            });
        }

        // Listen for modal open events to regenerate code
        const codeBtn = document.getElementById('codeBtn');
        if (codeBtn) {
            codeBtn.addEventListener('click', () => {
                this.generateAndShowCode();
            });
        }

        // Also listen for when the modal is actually opened via the modal controller
        if (window.modalController) {
            const originalOpenModal = window.modalController.openModal;
            window.modalController.openModal = (modalId) => {
                originalOpenModal.call(window.modalController, modalId);
                if (modalId === 'codeModal') {
                    // Small delay to ensure modal is visible
                    setTimeout(() => this.generateAndShowCode(), 100);
                }
            };
        } else {
            // If modal controller isn't ready yet, set up a listener
            document.addEventListener('DOMContentLoaded', () => {
                if (window.modalController) {
                    const originalOpenModal = window.modalController.openModal;
                    window.modalController.openModal = (modalId) => {
                        originalOpenModal.call(window.modalController, modalId);
                        if (modalId === 'codeModal') {
                            setTimeout(() => this.generateAndShowCode(), 100);
                        }
                    };
                }
            });
        }

        console.log('✅ Show Code Modal event listeners setup');
    }

    generateAndShowCode() {
        console.log('🎯 generateAndShowCode called');
        
        // Check if workspace has any blocks
        if (!workspace || workspace.getTopBlocks().length === 0) {
            console.warn('No blocks in workspace');
            this.showError('No blocks to generate code from. Please add some blocks to your workspace.');
            return;
        }

        // Check if code generator is available
        if (!window.codeGenerator) {
            console.error('Code generator not available');
            this.showError('Code generator not available. Please reload the page.');
            return;
        }

        // Check if code generator is ready
        if (!window.codeGenerator.isReady || !window.codeGenerator.isReady()) {
            console.warn('Code generator not ready, waiting...');
            this.showError('Code generator is loading. Please wait a moment and try again.');
            
            // Try again after a short delay
            setTimeout(() => {
                if (window.codeGenerator.isReady && window.codeGenerator.isReady()) {
                    this.generateAndShowCode();
                }
            }, 1000);
            return;
        }

        try {
            // Generate Python code for display
            this.currentCode = window.codeGenerator.generatePythonCode();
            
            // Log to console for debugging
            console.log('🐍 Generated Python Code:');
            console.log('========================');
            console.log(this.currentCode);
            console.log('========================');
            
            // Update the display
            this.updateCodeDisplay();
            
            console.log('✅ Python code generated and displayed');
        } catch (error) {
            console.error('Error generating code:', error);
            this.showError(`Error generating code: ${error.message}`);
        }
    }

    updateCodeDisplay() {
        const codeOutput = document.getElementById('codeOutput');
        if (!codeOutput) {
            console.error('Code output element not found');
            return;
        }

        // Get the Python code
        const code = this.currentCode || '# No code generated';
        
        // Update the content
        codeOutput.textContent = code;
        
        // Ensure Python language class for syntax highlighting
        codeOutput.className = 'language-python';
        
        // Re-highlight with Prism.js
        if (window.Prism) {
            Prism.highlightElement(codeOutput);
        }

        console.log('Code display updated for Python');
    }

    copyCurrentCode() {
        const code = this.currentCode;
        if (!code) {
            this.showToast('No code to copy', 'error');
            return;
        }

        this.copyToClipboard(code, 'Python code copied to clipboard!');
    }

    copySantaCode() {
        if (!window.codeGenerator) {
            this.showToast('Code generator not available', 'error');
            return;
        }

        try {
            const santaCode = window.codeGenerator.generateSantaCode();
            this.copyToClipboard(santaCode, 'Santa code copied to clipboard!');
        } catch (error) {
            console.error('Error generating Santa code:', error);
            this.showToast(`Error generating Santa code: ${error.message}`, 'error');
        }
    }

    copyToClipboard(text, successMessage) {
        if (navigator.clipboard && window.isSecureContext) {
            // Use the modern clipboard API
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(successMessage, 'success');
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                this.fallbackCopyTextToClipboard(text, successMessage);
            });
        } else {
            // Fallback for older browsers or non-secure contexts
            this.fallbackCopyTextToClipboard(text, successMessage);
        }
    }

    fallbackCopyTextToClipboard(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showToast(successMessage, 'success');
            } else {
                this.showToast('Failed to copy code', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showToast('Failed to copy code', 'error');
        }

        document.body.removeChild(textArea);
    }

    showToast(message, type = 'info') {
        if (window.toast) {
            window.toast[type](message);
        } else {
            // Fallback to console
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showError(message) {
        const codeOutput = document.getElementById('codeOutput');
        if (codeOutput) {
            codeOutput.textContent = message;
            codeOutput.className = 'language-none';
        }
        this.showToast(message, 'error');
    }

    // Public method to get current code
    getCurrentCode() {
        return this.currentCode;
    }

    // Public method to refresh code
    refresh() {
        this.generateAndShowCode();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.showCodeModal = new ShowCodeModal();
    console.log('✅ Show Code Modal initialized');
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already loaded
    window.showCodeModal = new ShowCodeModal();
    console.log('✅ Show Code Modal initialized (DOM already loaded)');
}

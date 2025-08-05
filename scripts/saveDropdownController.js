// Save Dropdown Controller
class SaveDropdownController {
    constructor() {
        this.dropdownButton = document.getElementById('saveBtn');
        this.dropdownMenu = document.getElementById('saveDropdown');
        this.dropdownItems = document.querySelectorAll('.dropdown-item');
        this.isOpen = false;
        this.init();
    }

    init() {
        // Add click event to the dropdown button
        this.dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Add click events to dropdown items
        this.dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                this.handleAction(action);
                this.closeDropdown();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdownButton.contains(e.target) && !this.dropdownMenu.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeDropdown();
            }
        });
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.isOpen = true;
        this.dropdownButton.classList.add('active');
        // Show the dropdown immediately when opening
        this.dropdownMenu.style.display = 'block';
        // Use setTimeout to ensure the display change takes effect before adding active class
        setTimeout(() => {
            this.dropdownMenu.classList.add('active');
        }, 10);
    }

    closeDropdown() {
        this.isOpen = false;
        this.dropdownButton.classList.remove('active');
        this.dropdownMenu.classList.remove('active');
        
        // Hide the dropdown after the animation completes
        setTimeout(() => {
            this.dropdownMenu.style.display = 'none';
        }, 300); // Match the CSS transition duration
    }

    handleAction(action) {
        switch (action) {
            case 'save-now':
                this.saveNow();
                break;
            case 'export-save':
                this.exportSave();
                break;
            case 'import-save':
                this.importSave();
                break;
            case 'clear-workspace':
                this.clearWorkspace();
                break;
            default:
                console.warn('Unknown save action:', action);
        }
    }

    saveNow() {
        try {
            if (!window.workspace) {
                console.error('Workspace not available');
                return;
            }

            const state = Blockly.serialization.workspaces.save(window.workspace);
            localStorage.setItem('blocklyWorkspace', JSON.stringify(state));
            console.log('💾 Workspace saved to local storage');
            
            // Optional: Show success feedback
            this.showFeedback('Workspace saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save workspace:', error);
            this.showFeedback('Failed to save workspace', 'error');
        }
    }

    exportSave() {
        try {
            if (!window.workspace) {
                console.error('Workspace not available');
                return;
            }

            const state = Blockly.serialization.workspaces.save(window.workspace);
            const dataStr = JSON.stringify(state, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `blockly-workspace-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('📤 Workspace exported as file');
            this.showFeedback('Workspace exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export workspace:', error);
            this.showFeedback('Failed to export workspace', 'error');
        }
    }

    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const state = JSON.parse(e.target.result);
                    if (!window.workspace) {
                        console.error('Workspace not available');
                        return;
                    }
                    
                    Blockly.serialization.workspaces.load(state, window.workspace);
                    console.log('📥 Workspace imported from file');
                    this.showFeedback('Workspace imported successfully!', 'success');
                } catch (error) {
                    console.error('Failed to import workspace:', error);
                    this.showFeedback('Failed to import workspace - invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }

    clearWorkspace() {
        if (confirm('Are you sure you want to clear the workspace? This action cannot be undone.')) {
            try {
                if (!window.workspace) {
                    console.error('Workspace not available');
                    return;
                }
                
                window.workspace.clear();
                console.log('🗑️ Workspace cleared');
                this.showFeedback('Workspace cleared successfully!', 'success');
            } catch (error) {
                console.error('Failed to clear workspace:', error);
                this.showFeedback('Failed to clear workspace', 'error');
            }
        }
    }

    showFeedback(message, type = 'info') {
        // Create a simple feedback notification
        const feedback = document.createElement('div');
        feedback.className = `feedback-notification feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 100;
            transition: opacity 0.3s ease;
            ${type === 'success' ? 'background-color: #4CAF50;' : ''}
            ${type === 'error' ? 'background-color: #f44336;' : ''}
            ${type === 'info' ? 'background-color: #2196F3;' : ''}
        `;
        
        document.body.appendChild(feedback);
        
        // Remove after 3 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the save dropdown controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SaveDropdownController();
});

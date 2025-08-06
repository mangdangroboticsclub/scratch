// Save Dropdown Controller
class SaveDropdownController {
    constructor() {
        this.dropdownButton = document.getElementById('saveBtn');
        this.dropdownMenu = document.getElementById('saveDropdown');
        this.dropdownItems = document.querySelectorAll('.dropdown-item');
        this.isOpen = false;
        this.autoSaveInterval = null;
        this.autoSaveIntervalMinutes = 5; // Auto save every 5 minutes
        this.sessionStorageDays = 7; // Keep session for 7 days
        this.init();
    }

    init() {
        // Add click event to the dropdown button with dual functionality
        this.dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Check if the click was on the dropdown arrow area (extended to right edge of button)
            const arrow = this.dropdownButton.querySelector('.dropdown-arrow');
            const buttonRect = this.dropdownButton.getBoundingClientRect();
            const arrowRect = arrow.getBoundingClientRect();
            
            // If click is within the arrow area (extended from arrow left to button right edge), toggle dropdown
            if (e.clientX >= arrowRect.left && e.clientX <= buttonRect.right &&
                e.clientY >= buttonRect.top && e.clientY <= buttonRect.bottom) {
                this.toggleDropdown();
            } else {
                // If click is on the text area, perform save-now action
                this.handleAction('save-now');
            }
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

        // Initialize auto save system
        this.initAutoSave();
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
        // Add active class to trigger CSS animations
        this.dropdownMenu.classList.add('active');
    }

    closeDropdown() {
        this.isOpen = false;
        this.dropdownButton.classList.remove('active');
        this.dropdownMenu.classList.remove('active');
        // CSS animations will handle the hiding through width shrinking
    }

    initAutoSave() {
        // Start auto save interval
        this.startAutoSave();
        
        // Clean up old saves on startup
        this.cleanupOldSaves();
    }

    startAutoSave() {
        // Clear any existing interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Set up new auto save interval (5 minutes)
        this.autoSaveInterval = setInterval(() => {
            this.autoSaveWorkspace();
        }, this.autoSaveIntervalMinutes * 60 * 1000);
        
        console.log(`🔄 Auto save started - saving every ${this.autoSaveIntervalMinutes} minutes`);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏹️ Auto save stopped');
        }
    }

    autoSaveWorkspace() {
        try {
            if (!window.workspace) {
                console.warn('Workspace not available for auto save');
                return;
            }

            const state = Blockly.serialization.workspaces.save(window.workspace);
            const saveData = {
                workspace: state,
                timestamp: Date.now(),
                type: 'auto'
            };
            
            localStorage.setItem('blocklyAutoSave', JSON.stringify(saveData));
            console.log('💾 Auto save completed', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Failed to auto save workspace:', error);
        }
    }

    loadWorkspace() {
        try {
            // Try to load from auto save first
            const autoSaveData = localStorage.getItem('blocklyAutoSave');
            if (autoSaveData) {
                const saveData = JSON.parse(autoSaveData);
                
                // Check if save is still valid (within 7 days)
                const daysSinceLastSave = (Date.now() - saveData.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSinceLastSave <= this.sessionStorageDays) {
                    if (window.workspace && saveData.workspace) {
                        Blockly.serialization.workspaces.load(saveData.workspace, window.workspace);
                        console.log('🔄 Workspace loaded from auto save', new Date(saveData.timestamp).toLocaleString());
                        return;
                    }
                } else {
                    // Remove expired auto save
                    localStorage.removeItem('blocklyAutoSave');
                    console.log('🗑️ Expired auto save removed');
                }
            }
            
            // Fallback to manual save if auto save not available
            const manualSave = localStorage.getItem('blocklyWorkspace');
            if (manualSave && window.workspace) {
                const state = JSON.parse(manualSave);
                Blockly.serialization.workspaces.load(state, window.workspace);
                console.log('🔄 Workspace loaded from manual save');
            }
        } catch (error) {
            console.error('Failed to load workspace:', error);
        }
    }

    cleanupOldSaves() {
        try {
            // Clean up auto save if too old
            const autoSaveData = localStorage.getItem('blocklyAutoSave');
            if (autoSaveData) {
                const saveData = JSON.parse(autoSaveData);
                const daysSinceLastSave = (Date.now() - saveData.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSinceLastSave > this.sessionStorageDays) {
                    localStorage.removeItem('blocklyAutoSave');
                    console.log('🗑️ Old auto save cleaned up');
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old saves:', error);
        }
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
            const saveData = {
                workspace: state,
                timestamp: Date.now(),
                type: 'manual'
            };
            
            // Save to both manual save and auto save storage
            localStorage.setItem('blocklyWorkspace', JSON.stringify(state));
            localStorage.setItem('blocklyAutoSave', JSON.stringify(saveData));
            
            console.log('💾 Workspace saved manually to local storage');
            
            // Show success feedback using toast system
            window.toast.save('Workspace saved successfully!');
        } catch (error) {
            console.error('Failed to save workspace:', error);
            window.toast.error('Failed to save workspace');
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
            window.toast.success('Workspace exported successfully!');
        } catch (error) {
            console.error('Failed to export workspace:', error);
            window.toast.error('Failed to export workspace');
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
                    window.toast.success('Workspace imported successfully!');
                } catch (error) {
                    console.error('Failed to import workspace:', error);
                    window.toast.error('Failed to import workspace - invalid file format');
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
                window.toast.warning('Workspace cleared successfully!');
            } catch (error) {
                console.error('Failed to clear workspace:', error);
                window.toast.error('Failed to clear workspace');
            }
        }
    }
}

// Initialize the save dropdown controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const saveController = new SaveDropdownController();
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
        saveController.autoSaveWorkspace();
        saveController.stopAutoSave();
    });
    
    // Wait for workspace to be ready before loading
    const waitForWorkspace = () => {
        if (window.workspace) {
            saveController.loadWorkspace();
        } else {
            setTimeout(waitForWorkspace, 100);
        }
    };
    waitForWorkspace();
});

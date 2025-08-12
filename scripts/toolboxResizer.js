/**
 * Toolbox Resizer Controller
 * Handles resizing of the toolbox area by adjusting the --topBar CSS variable
 */

class ToolboxResizer {
    constructor() {
        this.isResizing = false;
        this.minWidth = 45; // Minimum topBar width (45%)
        this.maxWidth = 95; // Maximum topBar width (95%)
        this.resizer = null;
        this.startX = 0;
        this.startWidth = 0;
        this.flyoutObserver = null;
        
        this.init();
    }
    
    init() {
        this.resizer = document.getElementById('toolboxResizer');
        if (!this.resizer) {
            console.error('Toolbox resizer element not found');
            return;
        }
        
        // Add event listeners
        this.resizer.addEventListener('mousedown', this.startResize.bind(this));
        this.resizer.addEventListener('touchstart', this.startResize.bind(this), { passive: false });
        
        // Global event listeners for mouse/touch move and up
        document.addEventListener('mousemove', this.handleResize.bind(this));
        document.addEventListener('mouseup', this.stopResize.bind(this));
        document.addEventListener('touchmove', this.handleResize.bind(this), { passive: false });
        document.addEventListener('touchend', this.stopResize.bind(this));
        
        // Prevent text selection during resize
        document.addEventListener('selectstart', this.preventSelection.bind(this));
        
        // Update resizer position when window resizes
        window.addEventListener('resize', this.updateResizerPosition.bind(this));
        
        // Initial position update
        this.updateResizerPosition();
        
        // Set up flyout monitoring
        this.setupFlyoutMonitoring();
    }
    
    setupFlyoutMonitoring() {
        // Monitor for flyout visibility changes
        const checkFlyoutVisibility = () => {
            if (window.workspace) {
                const toolbox = window.workspace.getToolbox();
                if (toolbox) {
                    const flyout = toolbox.getFlyout();
                    if (flyout) {
                        const isVisible = flyout.isVisible();
                        this.updateResizerState(isVisible);
                    }
                }
            }
        };
        
        // Check flyout visibility periodically
        setInterval(checkFlyoutVisibility, 100);
        
        // Also check when workspace changes
        if (window.workspace) {
            window.workspace.addChangeListener(() => {
                setTimeout(checkFlyoutVisibility, 50);
            });
        } else {
            // Wait for workspace to be available
            const waitForWorkspace = setInterval(() => {
                if (window.workspace) {
                    clearInterval(waitForWorkspace);
                    window.workspace.addChangeListener(() => {
                        setTimeout(checkFlyoutVisibility, 50);
                    });
                }
            }, 100);
        }
    }
    
    updateResizerState(flyoutVisible) {
        if (!this.resizer) return;
        
        if (flyoutVisible) {
            this.resizer.style.pointerEvents = 'none';
            this.resizer.classList.add('disabled');
        } else {
            this.resizer.style.pointerEvents = 'auto';
            this.resizer.classList.remove('disabled');
        }
    }
    
    startResize(event) {
        event.preventDefault();
        
        // Don't start resizing if flyout is open
        if (this.resizer.classList.contains('disabled')) {
            return;
        }
        
        this.isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        // Get starting position
        const clientX = event.type === 'mousedown' ? event.clientX : event.touches[0].clientX;
        this.startX = clientX;
        
        // Get current width percentage
        const computedStyle = getComputedStyle(document.documentElement);
        const currentWidth = parseFloat(computedStyle.getPropertyValue('--topBar'));
        this.startWidth = currentWidth;
        
        // Add visual feedback
        this.resizer.classList.add('resizing');
        document.body.classList.add('resizing-toolbox');
    }
    
    handleResize(event) {
        if (!this.isResizing) return;
        
        event.preventDefault();
        
        const clientX = event.type === 'mousemove' ? event.clientX : event.touches[0].clientX;
        const deltaX = clientX - this.startX;
        const windowWidth = window.innerWidth;
        
        // Calculate new width percentage
        const deltaPercentage = (deltaX / windowWidth) * 100;
        let newWidth = this.startWidth - deltaPercentage;
        
        // Clamp to min/max values
        newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
        
        // Apply the new width
        this.setToolboxWidth(newWidth);
    }
    
    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Remove visual feedback
        this.resizer.classList.remove('resizing');
        document.body.classList.remove('resizing-toolbox');
        
        // Save the new width to localStorage for persistence
        const computedStyle = getComputedStyle(document.documentElement);
        const currentWidth = parseFloat(computedStyle.getPropertyValue('--topBar'));
        localStorage.setItem('toolboxWidth', currentWidth.toString());
        
        // Final layout update with a slight delay to ensure everything settles
        setTimeout(() => {
            this.updateBlocklyLayout();
        }, 50);
    }
    
    setToolboxWidth(widthPercentage) {
        document.documentElement.style.setProperty('--topBar', `${widthPercentage}%`);
        
        // Update the width controller if it exists
        if (window.topBarWidthController) {
            window.topBarWidthController.setCustomWidth(`${widthPercentage}%`);
        }
        
        this.updateResizerPosition();
        
        // Force Blockly to recalculate positions
        this.updateBlocklyLayout();
    }
    
    updateBlocklyLayout() {
        if (window.workspace) {
            // Force workspace to resize and recalculate layout
            setTimeout(() => {
                // Trigger a resize event to make Blockly recalculate everything
                window.dispatchEvent(new Event('resize'));
                
                // Force workspace to recalculate its contents
                window.workspace.resizeContents();
                
                // Handle toolbox repositioning
                this.repositionToolbox();
            }, 10);
        }
    }
    
    repositionToolbox() {
        const toolbox = window.workspace.getToolbox();
        if (!toolbox) return;
        
        try {
            // Force toolbox to recalculate its position
            if (typeof toolbox.position === 'function') {
                toolbox.position();
            }
            
            // Handle flyout repositioning
            const flyout = toolbox.getFlyout();
            if (flyout && flyout.isVisible()) {
                // Get currently selected category
                const selectedItem = toolbox.getSelectedItem();
                
                if (selectedItem) {
                    // Force flyout to recalculate position
                    flyout.position();
                    
                    // If flyout still appears mispositioned, refresh the category
                    setTimeout(() => {
                        // Store current category info
                        const categoryName = selectedItem.getName ? selectedItem.getName() : null;
                        const categoryId = selectedItem.getId ? selectedItem.getId() : null;
                        
                        // Clear and reselect to force refresh
                        toolbox.clearSelection();
                        
                        setTimeout(() => {
                            if (categoryId) {
                                // Try to reselect by ID first
                                const items = toolbox.getToolboxItems();
                                const targetItem = items.find(item => 
                                    (item.getId && item.getId() === categoryId) ||
                                    (item.getName && item.getName() === categoryName)
                                );
                                if (targetItem) {
                                    toolbox.setSelectedItem(targetItem);
                                }
                            }
                        }, 20);
                    }, 100);
                }
            }
        } catch (error) {
            console.warn('Error repositioning toolbox:', error);
            // Fallback: just trigger a general resize
            window.workspace.resizeContents();
        }
    }
    
    updateResizerPosition() {
        if (!this.resizer) return;
        
        const computedStyle = getComputedStyle(document.documentElement);
        const topBarWidth = computedStyle.getPropertyValue('--topBar');
        this.resizer.style.left = `calc(100% - ${topBarWidth} + 1px)`;
    }
    
    preventSelection(event) {
        if (this.isResizing) {
            event.preventDefault();
        }
    }
    
    // Load saved width from localStorage
    loadSavedWidth() {
        const savedWidth = localStorage.getItem('toolboxWidth');
        if (savedWidth) {
            const width = parseFloat(savedWidth);
            if (width >= this.minWidth && width <= this.maxWidth) {
                this.setToolboxWidth(width);
                
                // Ensure layout is updated after loading saved width
                setTimeout(() => {
                    this.updateBlocklyLayout();
                }, 200);
            }
        }
    }
    
    // Reset to default width
    resetToDefault() {
        this.setToolboxWidth(85); // Default 85%
        localStorage.removeItem('toolboxWidth');
    }
}

// Initialize the toolbox resizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.toolboxResizer = new ToolboxResizer();
    
    // Load saved width after a short delay to ensure CSS is loaded
    setTimeout(() => {
        window.toolboxResizer.loadSavedWidth();
    }, 100);
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolboxResizer;
}

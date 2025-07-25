// Simple minimap visibility controller using CSS
class MinimapVisibilityController {
    constructor(workspace) {
        this.workspace = workspace;
        this.minBlocksThreshold = 20; // Show minimap when there are 20+ blocks
        this.maxSpreadThreshold = 1000; // Show minimap when blocks are spread >1000px apart
        
        // Listen for workspace changes
        this.workspace.addChangeListener(this.evaluateMinimapVisibility.bind(this));
        
        // Initial evaluation
        this.evaluateMinimapVisibility();
    }
    
    evaluateMinimapVisibility() {
        const blocks = this.workspace.getAllBlocks();
        const blockCount = blocks.length;
        
        // Calculate the spread of blocks
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        blocks.forEach(block => {
            const pos = block.getRelativeToSurfaceXY();
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        });
        
        const spreadX = maxX - minX;
        const spreadY = maxY - minY;
        const maxSpread = Math.max(spreadX, spreadY);
        
        // Determine if minimap should be visible
        const shouldShow = blockCount >= this.minBlocksThreshold || 
                          (blockCount > 0 && maxSpread > this.maxSpreadThreshold);
        
        const minimapElement = document.querySelector('.blockly-minimap');
        if (minimapElement) {
            if (shouldShow) {
                minimapElement.classList.add('visible');
                minimapElement.classList.remove('hidden');
            } else {
                minimapElement.classList.add('hidden');
                minimapElement.classList.remove('visible');
            }
        }
    }
    
    // Configuration methods
    setBlocksThreshold(threshold) {
        this.minBlocksThreshold = threshold;
        this.evaluateMinimapVisibility();
    }
    
    setSpreadThreshold(threshold) {
        this.maxSpreadThreshold = threshold;
        this.evaluateMinimapVisibility();
    }
    
    // Manual methods to show/hide
    showMinimap() {
        const minimapElement = document.querySelector('.blockly-minimap');
        if (minimapElement) {
            minimapElement.classList.add('visible');
            minimapElement.classList.remove('hidden');
        }
    }
    
    hideMinimap() {
        const minimapElement = document.querySelector('.blockly-minimap');
        if (minimapElement) {
            minimapElement.classList.add('hidden');
            minimapElement.classList.remove('visible');
        }
    }
}

// Initialize minimap functionality
function initializeMinimap(workspace) {
    // Check if PositionedMinimap is available
    if (typeof PositionedMinimap === 'undefined') {
        console.error('PositionedMinimap not found. Make sure the plugin is loaded.');
        return null;
    }
    
    // Initialize the minimap (always present but hidden by default)
    const minimap = new PositionedMinimap(workspace);
    minimap.init();
    
    // Initialize the minimap visibility controller
    const minimapController = new MinimapVisibilityController(workspace);
    
    // Make it globally accessible for configuration
    window.minimapController = minimapController;
    
    return { minimap, minimapController };
}

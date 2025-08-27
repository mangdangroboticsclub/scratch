/**
 * Variables Pane Controller
 * Manages the display and interaction of program variables during execution
 */

class VariablesPaneController {
    constructor() {
        this.pane = null;
        this.table = null;
        this.tableBody = null;
        this.toggleBtn = null;
        this.refreshBtn = null;
        this.variables = new Map(); // Store variable name -> value mapping
        this.isVisible = true;
        this.isUserHidden = true; // Default to hidden
        this.observer = null; // For watching flyout visibility
        this.storageKey = 'variablesPaneState'; // Session storage key
        
        this.init();
    }

    init() {
        // Get DOM elements
        this.pane = document.getElementById('variablesPane');
        this.table = document.getElementById('variablesTable');
        this.tableBody = document.getElementById('variablesTableBody');
        this.toggleBtn = document.getElementById('toggleVariablesPaneBtn');
        this.refreshBtn = document.getElementById('refreshVariablesBtn');

        if (!this.pane || !this.table || !this.tableBody || !this.toggleBtn || !this.refreshBtn) {
            console.error('❌ Variables pane elements not found');
            return;
        }

        // Load saved state from session storage
        this.loadState();

        // Setup event listeners
        this.setupEventListeners();
        
        // Setup flyout visibility observer
        this.setupFlyoutObserver();
        
        // Initialize UI based on current state
        this.updateUI();
        
        console.log('✅ Variables Pane Controller initialized');
    }

    setupEventListeners() {
        // Toggle visibility
        this.toggleBtn.addEventListener('click', () => {
            this.toggle();
        });

        // Refresh variables (manual clear)
        this.refreshBtn.addEventListener('click', () => {
            this.refreshVariables();
        });
    }

    setupFlyoutObserver() {
        // Create a MutationObserver to watch for changes in blocklyDiv (similar to topBarController)
        this.observer = new MutationObserver(() => {
            this.checkFlyoutVisibility();
        });

        // Start observing the blocklyDiv for changes
        const blocklyDiv = document.getElementById('blocklyDiv');
        if (blocklyDiv) {
            this.observer.observe(blocklyDiv, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            // Initial check
            this.checkFlyoutVisibility();
        }
    }

    checkFlyoutVisibility() {
        // Find all elements with blocklyFlyout class
        const flyouts = document.querySelectorAll('.blocklyFlyout');
        let flyoutVisible = false;

        flyouts.forEach(flyout => {
            const computedStyle = window.getComputedStyle(flyout);
            const display = computedStyle.display;
            const visibility = computedStyle.visibility;
            const opacity = computedStyle.opacity;

            // Check if flyout is visible (not display:none, not visibility:hidden, not opacity:0)
            if (display !== 'none' && visibility !== 'hidden' && opacity !== '0') {
                flyoutVisible = true;
            }
        });

        // Show/hide variables pane based on flyout visibility
        if (flyoutVisible) {
            this.hideForFlyout();
        } else {
            this.showFromFlyout();
        }
    }

    hideForFlyout() {
        if (this.pane) {
            this.pane.style.display = 'none';
        }
    }

    showFromFlyout() {
        if (this.pane && !this.isUserHidden) {
            this.pane.style.display = 'block';
        }
    }

    toggle() {
        this.isUserHidden = !this.isUserHidden;
        this.updateUI();
        this.saveState();
        
        // Update the display based on current flyout state if user is showing the pane
        if (!this.isUserHidden) {
            this.checkFlyoutVisibility();
        }
    }

    updateUI() {
        if (this.isUserHidden) {
            this.pane.classList.add('hidden');
            this.toggleBtn.textContent = 'Show Variables';
        } else {
            this.pane.classList.remove('hidden');
            this.toggleBtn.textContent = 'Hide Variables';
        }
    }

    saveState() {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify({
                isUserHidden: this.isUserHidden
            }));
        } catch (error) {
            console.warn('Failed to save variables pane state to session storage:', error);
        }
    }

    loadState() {
        try {
            const savedState = sessionStorage.getItem(this.storageKey);
            if (savedState) {
                const state = JSON.parse(savedState);
                this.isUserHidden = state.isUserHidden !== undefined ? state.isUserHidden : true; // Default to hidden
            }
        } catch (error) {
            console.warn('Failed to load variables pane state from session storage:', error);
            this.isUserHidden = true; // Default to hidden if loading fails
        }
    }

    show() {
        this.isUserHidden = false;
        this.updateUI();
        this.saveState();
        this.checkFlyoutVisibility();
    }

    hide() {
        this.isUserHidden = true;
        this.updateUI();
        this.saveState();
    }

    /**
     * Update or add a variable to the pane
     * @param {string} name - Variable name
     * @param {any} value - Variable value
     * @param {string} blockId - Optional block ID for highlighting
     */
    setVariable(name, value, blockId = null) {
        const oldValue = this.variables.get(name);
        this.variables.set(name, value);

        // Remove "no variables" message if it exists
        const noVariablesRow = this.tableBody.querySelector('.no-variables');
        if (noVariablesRow) {
            noVariablesRow.remove();
        }

        // Find existing row or create new one
        let row = this.tableBody.querySelector(`[data-variable="${name}"]`);
        const isNewVariable = !row;

        if (!row) {
            row = document.createElement('tr');
            row.dataset.variable = name;
            this.tableBody.appendChild(row);
        }

        // Format value based on type
        const formattedValue = this.formatValue(value);
        const valueType = this.getValueType(value);

        // Update row content
        row.innerHTML = `
            <td class="variable-name">${name}</td>
            <td class="variable-value ${valueType}">${formattedValue}</td>
        `;

        // Add highlight animation if value changed
        if (!isNewVariable && oldValue !== value) {
            row.classList.add('variable-updated');
            setTimeout(() => {
                row.classList.remove('variable-updated');
            }, 500);
        }

        console.log(`📊 Variable updated: ${name} = ${formattedValue}`);
    }

    /**
     * Get a variable value
     * @param {string} name - Variable name
     * @returns {any} Variable value or undefined
     */
    getVariable(name) {
        return this.variables.get(name);
    }

    /**
     * Remove a variable from the pane
     * @param {string} name - Variable name
     */
    removeVariable(name) {
        if (this.variables.has(name)) {
            this.variables.delete(name);
            
            const row = this.tableBody.querySelector(`[data-variable="${name}"]`);
            if (row) {
                row.remove();
            }

            // Show "no variables" message if no variables left
            if (this.variables.size === 0) {
                this.showNoVariablesMessage();
            }

            console.log(`🗑️ Variable removed: ${name}`);
        }
    }

    /**
     * Clear all variables
     */
    clearVariables() {
        this.variables.clear();
        this.tableBody.innerHTML = '';
        this.showNoVariablesMessage();
        console.log('🧹 All variables cleared');
    }

    /**
     * Manually refresh/clear all variables (for user interaction)
     */
    refreshVariables() {
        // Add spinning animation class
        this.refreshBtn.classList.add('spinning');
        
        // Clear all variables
        this.clearVariables();
        
        // Remove spinning class after animation completes
        // Get the animation duration from CSS variable
        const duration = getComputedStyle(document.documentElement)
            .getPropertyValue('--refresh-spin-duration')
            .trim();
        const durationMs = parseFloat(duration) * 1000; // Convert to milliseconds
        
        setTimeout(() => {
            this.refreshBtn.classList.remove('spinning');
        }, durationMs);
        
        console.log('🔄 Variables manually refreshed');
    }

    /**
     * Hide the refresh button (during execution)
     */
    hideRefreshButton() {
        if (this.refreshBtn) {
            this.refreshBtn.classList.add('hidden');
        }
    }

    /**
     * Show the refresh button (after execution)
     */
    showRefreshButton() {
        if (this.refreshBtn) {
            this.refreshBtn.classList.remove('hidden');
        }
    }

    /**
     * Get all variables as an object
     * @returns {Object} Variables object
     */
    getAllVariables() {
        return Object.fromEntries(this.variables);
    }

    /**
     * Show "no variables" message
     */
    showNoVariablesMessage() {
        if (this.tableBody.children.length === 0) {
            const row = document.createElement('tr');
            row.className = 'no-variables';
            row.innerHTML = '<td colspan="2">No variables yet</td>';
            this.tableBody.appendChild(row);
        }
    }

    /**
     * Format value for display
     * @param {any} value - Value to format
     * @returns {string} Formatted value
     */
    formatValue(value) {
        if (value === null) {
            return 'null';
        }
        if (value === undefined) {
            return 'undefined';
        }
        if (typeof value === 'string') {
            return `"${value}"`;
        }
        if (typeof value === 'boolean') {
            return value.toString();
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch (e) {
                return '[Object]';
            }
        }
        return String(value);
    }

    /**
     * Get CSS class for value type
     * @param {any} value - Value to classify
     * @returns {string} CSS class name
     */
    getValueType(value) {
        if (value === null || value === undefined) {
            return 'undefined';
        }
        if (typeof value === 'string') {
            return 'string';
        }
        if (typeof value === 'boolean') {
            return 'boolean';
        }
        if (typeof value === 'number') {
            return 'number';
        }
        return 'object';
    }

    /**
     * Parse variable information from setVar call
     * @param {string} rawId - Raw ID string from setVar
     * @param {any} scope - Interpreter scope
     * @returns {Object} Parsed variable info
     */
    parseVariableInfo(rawId, scope) {
        try {
            const splitIndex = rawId.lastIndexOf('=');
            if (splitIndex === -1) {
                console.warn('Invalid setVar format:', rawId);
                return null;
            }

            const blockId = rawId.slice(0, splitIndex);
            const valueStr = rawId.slice(splitIndex + 1);
            
            // Try to find the actual variable name from the scope
            const variableName = this.extractVariableNameFromScope(scope, valueStr);
            
            return {
                blockId,
                variableName,
                valueStr
            };
        } catch (error) {
            console.error('Error parsing variable info:', error);
            return null;
        }
    }

    /**
     * Extract variable name from interpreter scope
     * @param {any} scope - Interpreter scope
     * @param {string} valueStr - Value string
     * @returns {string} Variable name
     */
    extractVariableNameFromScope(scope, valueStr) {
        // This is a simplified approach - in a real implementation,
        // you'd need to track which variable was just assigned
        // For now, we'll use the most recently added property
        
        if (scope && scope.properties) {
            const properties = Object.keys(scope.properties);
            // Return the last property as it's likely the most recent assignment
            return properties[properties.length - 1] || 'unknown';
        }
        
        return 'unknown';
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.variablesPaneController = new VariablesPaneController();
    
    // Global helper function for the interpreter
    window.setVariableInPane = function(name, value, blockId = null) {
        if (window.variablesPaneController) {
            window.variablesPaneController.setVariable(name, value, blockId);
        }
    };

    // Global setVar function that can be called from generated code
    window.setVar = function(rawId) {
        const rawIdStr = String(rawId);
        console.log('🔧 Global setVar called with:', rawIdStr);
        
        // Extract variable information - format: blockId=variableName
        try {
            const splitIndex = rawIdStr.lastIndexOf('=');
            if (splitIndex !== -1) {
                const blockId = rawIdStr.slice(0, splitIndex);
                const variableName = rawIdStr.slice(splitIndex + 1);
                
                // For global execution, we can try to get the variable from window scope
                let actualValue = 'undefined';
                
                if (typeof window[variableName] !== 'undefined') {
                    actualValue = window[variableName];
                } else {
                    console.warn('Variable not found in global scope:', variableName);
                }
                
                // Update variables pane
                if (window.variablesPaneController) {
                    window.variablesPaneController.setVariable(variableName, actualValue, blockId);
                }
            } else {
                console.warn('Invalid setVar format:', rawIdStr);
            }
        } catch (error) {
            console.error('Error in global setVar:', error);
        }
        
        return true;
    };

    // Global function to handle setVar calls from interpreter
    window.handleSetVarCall = function(rawId, scope) {
        if (!window.variablesPaneController) return;
        
        const info = window.variablesPaneController.parseVariableInfo(rawId, scope);
        if (info) {
            // Extract actual value from scope
            let actualValue = info.valueStr;
            try {
                // Try to get the actual variable value from scope
                if (scope && scope.properties && info.variableName !== 'unknown') {
                    const prop = scope.properties[info.variableName];
                    if (prop && prop.data !== undefined) {
                        actualValue = prop.data;
                    }
                }
            } catch (e) {
                console.warn('Could not extract actual value:', e);
            }
            
            window.variablesPaneController.setVariable(info.variableName, actualValue, info.blockId);
        }
    };

    console.log('🎮 Variables Pane Controller initialized globally');
}

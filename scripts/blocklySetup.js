// Blockly Plugins are now loaded via script tags in HTML
// shadowBlockConversionChangeListener and PositionedMinimap are globally available

// Check if plugins are loaded
if (typeof shadowBlockConversionChangeListener === 'undefined') {
	console.error('shadowBlockConversionChangeListener not found. Make sure the plugin is loaded.');
}
if (typeof PositionedMinimap === 'undefined') {
	console.error('PositionedMinimap not found. Make sure the plugin is loaded.');
}


const theme = Blockly.Theme.defineTheme('mangdangSanta', {
	'base': Blockly.Themes.Classic,
	'startHats': true,
	'componentStyles': {
		'workspaceBackgroundColour': getCSSVar('--background'),
		'toolboxBackgroundColour': getCSSVar('--primary')
	}
})

// Helper to recursively build category toolbox from nested list.json
async function buildCategoryContents(categories, categoryColors) {
  const contents = await Promise.all(
	Object.entries(categories).map(async ([key, value]) => {
	  if (key === 'files') {
		// value is an array of file paths
		const blocks = await Promise.all(
		  value.map(async file => {
			try {
			  const res = await fetch(file);
			  if (!res.ok) {
				console.error('Failed to fetch block file:', file, res.status);
				return null;
			  }
			  return await res.json();
			} catch (e) {
			  console.error('Invalid JSON in block file:', file, e);
			  return null;
			}
		  })
		);
		return blocks.filter(Boolean);
	  } else {
		// value is a subcategory or category
		const subContents = await buildCategoryContents(value, categoryColors);
		return {
		  kind: 'category',
		  name: key.charAt(0).toUpperCase() + key.slice(1),
		  colour: categoryColors[key] || '#999999',
		  contents: subContents.flat()
		};
	  }
	})
  );
  // Flatten out any arrays of blocks
  return contents.flat();
}


// Helper to get a CSS variable value
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// Load categorized tool list and toolbox blocks dynamically
fetch('scripts/tools/list.json')
  .then(res => res.json())
  .then(async categories => {
	// Define colors for categories (customize as needed)
	const categoryColors = {
		conditionals: getCSSVar('--category-conditional'),
		variables: getCSSVar('--category-variable'),
		loops: getCSSVar('--category-loop'),
		functions: getCSSVar('--category-function'),
		operations: getCSSVar('--category-operation'),
		santa: getCSSVar('--category-santa'),
		mainloop: getCSSVar('--category-mainloop'),
	};


let categoryContents = await buildCategoryContents(categories, categoryColors);
// Add two spacers at the top
categoryContents = [
  { kind: 'sep' },
  { kind: 'sep' },
  { kind: 'sep' },
  { kind: 'sep' },
  { kind: 'sep' },
  ...categoryContents
];



const toolbox = {
  kind: 'categoryToolbox',
  contents: categoryContents
};

	// Inject Blockly with infinite workspace, no zoom, middle mouse drag
	const workspace = Blockly.inject('blocklyDiv', {
	  theme: theme,
	  toolbox: toolbox,
	  scrollbars: false, // Disable scrollbars completely
	  // theme: "modern",
	  horizontalLayout: false,
	  toolboxPosition: "start",
	  move: {
		scrollbars: true, // Disable scrollbars but keep movement
		drag: true,        // Enable drag to pan
		wheel: false       // Disable zoom with wheel
	  },
	  zoom: {
		controls: false,  // No zoom controls
		wheel: false,     // No zoom with wheel
		startScale: 1,
		maxScale: 1,
		minScale: 1,
		scaleSpeed: 1
	  },
	});

	window.workspace = workspace;

	workspace.addChangeListener(shadowBlockConversionChangeListener);
	// initializeMinimap(workspace);

	observeFlyoutColor(categoryColors);
	
	if (window.FunctionManager) {
	  window.functionManager = new window.FunctionManager(workspace);
	}
	
	// Initialize interpreter with workspace
	console.log('🔍 Checking interpreter availability...');
	console.log('window.xiaozhiInterpreter:', !!window.xiaozhiInterpreter);
	console.log('window.Interpreter:', !!window.Interpreter);
	
	if (window.xiaozhiInterpreter) {
	  const initResult = window.xiaozhiInterpreter.initialize(workspace);
	  console.log('✅ Interpreter initialized with workspace, result:', initResult);
	} else {
	  console.error('❌ xiaozhiInterpreter not found on window object');
	}
	
	// Simplified and robust run/stop button setup for cloud hosting
	function setupRunStopButtons() {
	  const runBtn = document.getElementById('runBtn');
	  const stopBtn = document.getElementById('stopBtn');
	  
	  console.log('🔘 setupRunStopButtons called at:', new Date().toISOString());
	  console.log('🔘 Button elements found:', { 
	    runBtn: !!runBtn, 
	    stopBtn: !!stopBtn,
	    runBtnId: runBtn?.id,
	    runBtnClass: runBtn?.className 
	  });
	  
	  if (!runBtn || !stopBtn) {
	    console.warn('⚠️ Run/Stop buttons not found, retrying...');
	    setTimeout(setupRunStopButtons, 100);
	    return;
	  }
	  
	  // Log current state before setup
	  console.log('🔘 Before setup - Button states:', {
	    runBtnDisabled: runBtn.disabled,
	    runBtnOnclick: !!runBtn.onclick,
	    runBtnDisplay: runBtn.style.display
	  });
	  
	  // Remove any existing event listeners first
	  runBtn.onclick = null;
	  stopBtn.onclick = null;
	  
	  // Simple, direct event handlers with extensive logging
	  runBtn.onclick = function(e) {
	    console.log('🚀 RUN BUTTON ONCLICK TRIGGERED!', { 
	      timestamp: new Date().toISOString(),
	      disabled: runBtn.disabled, 
	      event: e?.type,
	      target: e?.target?.id 
	    });
	    
	    // Prevent any event bubbling
	    if (e) {
	      e.preventDefault();
	      e.stopPropagation();
	    }
	    
	    // Simple disabled check
	    if (runBtn.disabled) {
	      console.log('⚠️ Run button is disabled - showing alert');
	      alert('Please connect to Santa-Bot first');
	      return false;
	    }
	    
	    // Simple execution - try multiple methods for robustness
	    try {
	      console.log('🎮 Attempting to start execution...');
	      if (window.runBlockByBlock) {
	        console.log('🎮 Calling runBlockByBlock...');
	        window.runBlockByBlock(10);
	        console.log('✅ runBlockByBlock called successfully');
	      } else if (window.runContinuous) {
	        console.log('🎮 Fallback: Calling runContinuous...');
	        window.runContinuous();
	        console.log('✅ runContinuous called successfully');
	      } else {
	        console.error('❌ No execution function available');
	        alert('Execution system not ready. Please reload the page.');
	      }
	    } catch (error) {
	      console.error('❌ Error during execution:', error);
	      alert('Error starting execution: ' + error.message);
	    }
	    
	    return false;
	  };
	  
	  stopBtn.onclick = function(e) {
	    console.log('� STOP BUTTON CLICKED!', { event: e });
	    
	    // Prevent any event bubbling
	    e.preventDefault();
	    e.stopPropagation();
	    
	    // Simple stop execution
	    try {
	      if (window.stopExecution) {
	        console.log('🎮 Stopping execution...');
	        window.stopExecution();
	      } else {
	        console.error('❌ Stop function not available');
	        alert('Stop function not ready. Please reload the page.');
	      }
	    } catch (error) {
	      console.error('❌ Error during stop:', error);
	      alert('Error stopping execution: ' + error.message);
	    }
	    
	    return false;
	  };
	  
	  // Also add addEventListener as backup
	  runBtn.addEventListener('click', function(e) {
	    console.log('🔄 Run button addEventListener backup triggered');
	  }, { passive: false });
	  
	  stopBtn.addEventListener('click', function(e) {
	    console.log('🔄 Stop button addEventListener backup triggered');
	  }, { passive: false });
	  
	  console.log('✅ Run/Stop buttons setup complete');
	}
	
	// Setup buttons with multiple timing strategies
	setupRunStopButtons();
	setTimeout(setupRunStopButtons, 100);
	setTimeout(setupRunStopButtons, 500);
	
	// Backup: Add window-level click handler as fallback
	document.addEventListener('click', function(e) {
	  if (e.target && e.target.id === 'runBtn') {
	    console.log('🔄 Backup window click handler for runBtn triggered');
	    // Only trigger if the direct onclick didn't work
	    setTimeout(() => {
	      const currentlyExecuting = window.isExecuting ? window.isExecuting() : false;
	      if (!currentlyExecuting) {  // Check if execution didn't start
	        console.log('🚀 Direct handler may have failed, triggering backup');
	        if (window.forceRun) window.forceRun();
	      }
	    }, 50);
	  } else if (e.target && e.target.id === 'stopBtn') {
	    console.log('🔄 Backup window click handler for stopBtn triggered');
	    setTimeout(() => {
	      const currentlyExecuting = window.isExecuting ? window.isExecuting() : false;
	      if (currentlyExecuting) {  // Check if execution didn't stop
	        console.log('🛑 Direct handler may have failed, triggering backup');
	        if (window.forceStop) window.forceStop();
	      }
	    }, 50);
	  }
	}, true); // Use capture phase
	
	// Robust execution UI initialization for cloud hosting
	function initializeExecutionUIFromBlockly() {
	  if (window.updateExecutionUI) {
	    try {
	      window.updateExecutionUI();
	      console.log('✅ Execution UI initialized from Blockly setup');
	    } catch (error) {
	      console.warn('⚠️ Error initializing execution UI from Blockly setup:', error);
	      // Retry after a short delay
	      setTimeout(initializeExecutionUIFromBlockly, 500);
	    }
	  } else {
	    console.log('⏳ updateExecutionUI not ready, retrying from Blockly setup...');
	    setTimeout(initializeExecutionUIFromBlockly, 200);
	  }
	}
	
	// Initialize with multiple attempts for robustness
	setTimeout(initializeExecutionUIFromBlockly, 100);
	setTimeout(initializeExecutionUIFromBlockly, 500);
	setTimeout(initializeExecutionUIFromBlockly, 1000);

  })
  .catch(err => console.error('Error loading toolbox:', err));
  
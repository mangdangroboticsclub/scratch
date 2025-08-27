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
	
	// Setup run button with enhanced execution options
	const runBtn = document.getElementById('runBtn');
	const stopBtn = document.getElementById('stopBtn');
	
	if (runBtn) {
	  runBtn.addEventListener('click', () => {
	    console.log('🔘 Run button clicked - starting enhanced block-by-block execution');
	    
	    // Use the enhanced execution controller only
	    if (window.runBlockByBlock) {
	      window.runBlockByBlock(10); // 10ms default delay - very fast!
	    } else {
	      console.error('❌ Enhanced execution controller not available');
	      showToast('Execution system not ready. Please reload the page.', { duration: 3000 });
	    }
	  });
	}
	
	if (stopBtn) {
	  stopBtn.addEventListener('click', () => {
	    console.log('🔘 Stop button clicked - stopping execution');
	    
	    // Use the enhanced execution controller's stop function
	    if (window.stopExecution) {
	      window.stopExecution();
	    } else {
	      console.error('❌ Enhanced execution controller not available');
	      showToast('Stop function not ready. Please reload the page.', { duration: 3000 });
	    }
	  });
	}
	
	// Initialize execution UI state
	setTimeout(() => {
	  if (window.updateExecutionUI) {
	    window.updateExecutionUI();
	    console.log('✅ Execution UI initialized');
	  }
	}, 500); // Small delay to ensure all systems are loaded

  })
  .catch(err => console.error('Error loading toolbox:', err));
  
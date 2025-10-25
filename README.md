# Blocks.Mangdang 🤖

A visual block-based programming environment for controlling robotics platforms via Bluetooth Web API. Built on Google's Blockly framework, this application provides an intuitive drag-and-drop interface for programming robots with real-time execution and debugging capabilities.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Block Categories](#block-categories)
- [Bluetooth Communication](#bluetooth-communication)
- [Code Generation](#code-generation)
- [Development](#development)
- [Project Structure](#project-structure)
- [Contributors](#contributors)
- [License](#license)

## 🎯 Overview

Blocks.Mangdang is a web-based visual programming environment designed for educational robotics. It enables users to program robots (specifically the "Santa-Bot" platform) using intuitive drag-and-drop blocks instead of traditional text-based coding. The application communicates with robots via Bluetooth Low Energy (BLE) and supports dynamic tool discovery through the Model Context Protocol (MCP).

### Key Technologies

- **Blockly** (v12.2.0) - Google's visual programming library
- **Web Bluetooth API** - Browser-based BLE communication
- **JavaScript Interpreter** - Acorn-based safe code execution
- **Prism.js** - Syntax highlighting for code preview
- **Model Context Protocol (MCP)** - Dynamic tool discovery and management

## ✨ Features

### Visual Programming
- 🧩 **Drag-and-Drop Interface** - Intuitive block-based programming
- 📦 **Categorized Blocks** - Organized toolbox with conditionals, loops, functions, variables, and operations
- 🎨 **Custom Theme** - MangDang Santa-themed color palette
- 🔍 **Workspace Minimap** - Bird's-eye view of large programs
- 💾 **Save/Load Projects** - Local storage with import/export capabilities

### Execution & Debugging
- ▶️ **Real-time Execution** - Run programs directly on connected robots
- 🔍 **Block Highlighting** - Visual feedback during execution
- 📊 **Variables Inspector** - Live variable monitoring during program execution
- 🛑 **Stop Control** - Immediate program termination
- 🐛 **Debug Console** - Comprehensive Bluetooth communication logging

### Bluetooth Integration
- 📡 **Web Bluetooth API** - Browser-native BLE connectivity
- 🔄 **Auto-Reconnection** - Seamless reconnection to previously paired devices
- 🛠️ **Dynamic Tool Discovery** - MCP-based runtime tool loading
- 📝 **Communication Log** - Full message history with filtering

### Code Generation
- 🐍 **Python Export** - Generate Python code from blocks
- 📋 **Copy to Clipboard** - Easy code sharing
- 🔤 **Syntax Highlighting** - Pretty-printed code with line numbers

## 🏗️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Frontend                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Blockly    │  │  Execution   │  │  Bluetooth   │       │
│  │  Workspace   │──│  Controller  │──│  Controller  │       │
│  └──────┬───────┘  └───────┬──────┘  └───────┬──────┘       │
│         │                  │                 │              │
│         │                  │                 │              │
│  ┌──────▼──────┐  ┌────────▼────────┐ ┌──────▼──────┐       │
│  │   Custom    │  │  JS Interpreter │ │  Web BLE    │       │
│  │   Blocks    │  │   (Acorn-based) │ │     API     │       │
│  └─────────────┘  └─────────────────┘ └──────┬──────┘       │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                         ┌─────▼───────┐
                                         │  Santa-Bot  │
                                         │   Robot     │
                                         │   (BLE)     │
                                         └─────────────┘
```

### Core Modules

1. **blocklySetup.js** - Workspace initialization and configuration
2. **customBlocks.js** - Custom block definitions and behaviors
3. **codeGenerator.js** - Python and JavaScript code generation
4. **executionController.js** - Program execution and stepping logic
5. **bluetoothController.js** - BLE device management and MCP communication
6. **interpreter.js** - Safe JavaScript execution environment
7. **variablesPaneController.js** - Live variable monitoring
8. **modalController.js** - UI modal management
9. **toastController.js** - Notification system

## 🚀 Getting Started

### Prerequisites

- Modern web browser with Web Bluetooth API support (Chrome 56+, Edge 79+, Opera 43+)
- Node.js and npm (for dependency installation and build tools)
- A compatible robot with BLE support (e.g., Santa-Bot)
- OpenSSL (for generating HTTPS certificates)

### Installation

**Quick Setup** (3 steps):

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/mangdangroboticsclub/scratch.git
   cd scratch
   npm install
   ```

2. **Start a local server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # OR Node.js
   npx http-server -p 8000
   ```

3. **Open in browser**
   
   Navigate to `http://localhost:8000`

> ✅ **Works with Bluetooth**: `localhost` is treated as a secure context, enabling full Web Bluetooth functionality.  
> ⚠️ **Network limitation**: External devices (`http://192.168.x.x`) require HTTPS - see advanced setup below.

---

### Advanced Setup (Network/Remote Access)

**For testing across devices or production deployment**, HTTPS certificates are required:

1. **Generate SSL certificates**
   ```bash
   openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 \
     -keyout blockly-v3+3-key.pem -out blockly-v3+3.pem
   ```
   *Set Common Name to `localhost` when prompted*

2. **Start HTTPS server**
   ```bash
   # Node.js
   npm install -g https-server
   https-server -S -C blockly-v3+3.pem -K blockly-v3+3-key.pem -p 8000
   
   # OR Python 3
   python -m http.server 8000 --bind localhost \
     --certfile blockly-v3+3.pem --keyfile blockly-v3+3-key.pem
   ```

3. **Access via HTTPS**
   
   Navigate to `https://localhost:8000` (accept self-signed certificate warning)

---

### Build Tools (Optional)

**Modifying block definitions?** Regenerate the toolbox:
```bash
node scripts/_generateTools.js
```
*Scans `scripts/tools/` and compiles all block JSONs into `list.json`*

### Browser Compatibility

Web Bluetooth API is required and supported on:
- ✅ Chrome 56+ (Desktop & Android)
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

> **Important**: Web Bluetooth API only works in secure contexts (HTTPS or localhost). The application must be served over HTTPS to enable Bluetooth connectivity. See installation instructions above for certificate generation.

## 📖 Usage

### 1. Connect to Robot

1. Click the **Bluetooth button** in the top-left corner
2. Select your "Santa-Bot" device from the browser dialog
3. Wait for the connection to establish
4. MCP tools will automatically load into the dropdown blocks

### 2. Build Your Program

1. Drag blocks from the categorized toolbox on the left
2. **Start with a "Start" block** - Required to begin program execution
3. Connect blocks vertically to build your program sequence
4. **End with a "Stop" block** - Signals program completion
5. Use the **Variables** button to monitor variable values

### 3. Run Your Program

1. Click the **Run Program** button (visible when connected)
2. Watch blocks highlight as they execute
3. Monitor variables in the Variables pane
4. Use **Stop Program** to halt execution

### 4. Save & Load Projects

1. Click **Save/Load** dropdown in the top bar
2. **Save now** - Auto-save to browser local storage
3. **Export save** - Download project as JSON file
4. **Import save** - Load previously exported project
5. **Clear workspace** - Start fresh (with confirmation)

### 5. View Generated Code

1. Click **Show as Code** button
2. View generated Python code with syntax highlighting
3. Use **Copy Code** to copy to clipboard
4. Use **Copy Santa Code** for robot-specific format

## 🧩 Block Categories

### Main Loop
- **Start** - Program entry point (only one allowed)
- **Stop** - Program termination (only one allowed)

### Santa Commands
- **Send [text] to Santa** - Send text messages to the robot to say out loud
- **Make Santa [command]** - Execute dynamic MCP commands with parameters

### Variables
- **Set variable** - Create or update variables
- **Get variable** - Read variable values
- **Integer** - Numeric literal
- **Text** - String literal
- **Boolean** - True/False values

### Conditionals
- **If-Else** - Conditional branching
- **Comparison** - Equality and relational operators (=, ≠, <, >, ≤, ≥)

### Loops
- **For loop** - Count-controlled iteration
- **While loop** - Condition-controlled iteration

### Operations
- **Arithmetic** - Math operations (+, -, ×, ÷)
- **Logic** - Boolean operations (AND, OR, NOT)
- **Lists** - Array creation and manipulation
- **Text** - String operations (join, length)
- **Random** - Random number generation

### Functions
- **Define function** - Create reusable procedures
- **Define function with return** - Create functions that return values
- **Function calls** - Invoke defined functions

## 📡 Bluetooth Communication

### Protocol

The application uses **Bluetooth Low Energy (BLE)** with a custom GATT service:

- **Service UUID**: `12345678-1234-5678-1234-56789abcdef0` (Robot Control Service)
- **Characteristic UUID**: `12345678-1234-5678-1234-56789abcdef1` (Data Exchange)

### Message Format

Messages are JSON-encoded and support chunking for large payloads:

```javascript
{
  "type": "command" | "query" | "response",
  "data": { ... },
  "chunk": { "index": 0, "total": 1, "id": "unique-id" } // Optional
}
```

### MCP Tool Discovery

Upon connection, the application queries available tools:

1. Sends `list_tools` command to robot
2. Receives tool definitions with schemas
3. Dynamically populates "Make Santa" dropdown blocks
4. Generates parameter inputs based on tool schemas

### Connection States

- **Disconnected** - No active connection
- **Connecting** - Attempting to establish connection
- **Connected** - Active BLE connection with tool discovery complete
- **Reconnecting** - Attempting to restore previous connection

## 🔧 Code Generation

### Python Generator

Converts blocks to executable Python code:

```python
# Program starts here
send_message('Wake Up')

# Set variable example
my_variable = 42

# Conditional example
if my_variable > 10:
    execute_santa_command("move.forward", {"speed": 50})

# Program ends here
execute_santa_command("self.system.quit", {})
```

### JavaScript Generator

For in-browser execution with the JS interpreter:

```javascript
// Program starts here
send_msg('Wake Up');

// Variable tracking
my_variable = 42;
setVar('blockId=my_variable');

// Conditional with highlighting
highlightBlock('block_id_123');
if (my_variable > 10) {
    highlightBlock('block_id_456');
    cmd_dropdown("move.forward", {"speed": 50});
}
```

## 🛠️ Development

### Adding Custom Blocks

1. **Define the block** in `scripts/customBlocks.js`:

```javascript
Blockly.Blocks['my_custom_block'] = {
  init: function() {
    this.appendValueInput("INPUT")
        .appendField("My Block");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};
```

2. **Add Python generator** in `scripts/codeGenerator.js`:

```javascript
pythonGenerator.forBlock['my_custom_block'] = function(block, generator) {
    const input = generator.valueToCode(block, 'INPUT', pythonGenerator.ORDER_ATOMIC);
    return `my_function(${input})\n`;
};
```

3. **Add JavaScript generator** for execution:

```javascript
javascriptGenerator.forBlock['my_custom_block'] = function(block, generator) {
    const input = generator.valueToCode(block, 'INPUT', generator.ORDER_ATOMIC);
    return `myFunction(${input});\n`;
};
```

4. **Create block definition JSON** in `scripts/tools/operations/my_block.json`:

```json
{
  "type": "my_custom_block",
  "kind": "block"
}
```

5. **Regenerate toolbox** by running the build script:

```bash
node scripts/_generateTools.js
```

This will automatically scan the `scripts/tools/` directory and update `scripts/tools/list.json` with your new block, organizing it by folder structure.

### Styling

Custom styles are organized in the `styles/` directory:

- `main.css` - Core layout and workspace styles
- `palette.css` - Color theme definitions
- `toolbox.css` - Toolbox customization
- `modal.css` - Modal dialog styles
- `bluetoothModal.css` - Bluetooth debug UI
- `variablesPane.css` - Variables inspector styling

### Theme Customization

Edit CSS variables in `styles/palette.css`:

```css
:root {
  --primary: #1a1a2e;
  --secondary: #16213e;
  --accent: #0f3460;
  --highlight: #e94560;
  --background: #f8f9fa;
  /* Block category colors */
  --category-conditional: #5b9bd5;
  --category-loop: #70ad47;
  --category-function: #ffc000;
  /* ... */
}
```

## 📁 Project Structure

```
Blocks.Mangdang/
├── index.html                      # Main application entry point
├── package.json                    # npm dependencies
├── LICENSE                         # Apache 2.0 License
├── README.md                       # This file
├── blockly-v3+3.pem               # HTTPS certificate (generated)
├── blockly-v3+3-key.pem           # HTTPS private key (generated)
│
├── scripts/                        # JavaScript modules
│   ├── _generateTools.js          # Build script to compile block definitions
│   ├── acorn_interpreter.js        # JS interpreter (Acorn-based)
│   ├── blocklySetup.js            # Workspace initialization
│   ├── bluetoothController.js     # BLE device management
│   ├── codeGenerator.js           # Python/JS code generation
│   ├── customBlocks.js            # Custom block definitions
│   ├── customCategory.js          # Dynamic category management
│   ├── debug.js                   # Debug utilities
│   ├── executionController.js     # Program execution logic
│   ├── functionController.js      # Function block handling
│   ├── interpreter.js             # Execution environment setup
│   ├── minimapController.js       # Workspace minimap
│   ├── modalController.js         # Modal dialog management
│   ├── saveDropdownController.js  # Save/load functionality
│   ├── showCodeModal.js           # Code preview modal
│   ├── simpleRunButtonController.js # Run button logic
│   ├── toastController.js         # Notification system
│   ├── toolboxController.js       # Toolbox management
│   ├── toolboxResizer.js          # Toolbox resizing
│   ├── topBarController.js        # Top bar UI
│   ├── topBarWidthController.js   # Responsive top bar
│   ├── variablesPaneController.js # Variable inspector
│   │
│   └── tools/                     # Block definitions
│       ├── list.json              # Generated toolbox structure (auto-built)
│       ├── conditionals/          # If-else, comparison blocks
│       ├── functions/             # Function definition blocks
│       ├── loops/                 # For, while loop blocks
│       ├── mainloop/              # Start, stop blocks
│       ├── operations/            # Math, logic, list operations
│       ├── santa/                 # Robot command blocks
│       └── variables/             # Variable blocks
│
├── styles/                        # CSS stylesheets
│   ├── main.css                  # Core layout
│   ├── palette.css               # Color theme
│   ├── bluetoothModal.css        # BLE debug UI
│   ├── codeModal.css             # Code preview
│   ├── dropdown.css              # Dropdown menus
│   ├── minimap.css               # Workspace minimap
│   ├── modal.css                 # Modal dialogs
│   ├── resizer.css               # Resizable panels
│   ├── runDropdown.css           # Run options
│   ├── saveDropdown.css          # Save menu
│   ├── toast.css                 # Notifications
│   ├── toolbox.css               # Block toolbox
│   ├── topButtons.css            # Top bar buttons
│   └── variablesPane.css         # Variable inspector
│
└── svg/                          # Vector graphics
    ├── Background.svg            # Santa background
    ├── Bluetooth.svg             # Bluetooth icon
    └── Snowflake.svg             # Decorative snowflake
```


### Development Guidelines

- Follow existing code style and conventions
- Test Bluetooth connectivity thoroughly (requires HTTPS)
- Ensure blocks work in both code generation modes (Python & JavaScript)
- Update documentation for new features
- Add block definitions to appropriate category folders
- Run `node scripts/_generateTools.js` after adding/modifying block JSON files
- Always test on another device with HTTPS server when working with Bluetooth features

## � Contributors

### Core Team

**Haris** - *Lead Developer & Designer*
- Complete application architecture and implementation
- Bluetooth Web API integration with MCP protocol
- Custom block system and code generation (Python & JavaScript)
- Cloud deployment and production hosting setup
- Execution controller with real-time debugging
- Comprehensive project documentation

**Mandy** - *Design Contributor*
- SVG graphics and visual assets (Background, Snowflake, icons)
- Color palette and theme design
- UI/UX design language with Figma
- Visual design system and branding

### Special Thanks

- **MangDang Robotics Club** - Robot platform and testing support
- **Open Source Community** - Blockly, Web Bluetooth API, and related technologies

## �📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

```
Copyright 2025 MangDang Technology Co., Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 🙏 Acknowledgments

- **Google Blockly** - Visual programming framework
- **Web Bluetooth Community Group** - BLE API specification
- **MangDang Robotics Club** - Robot platform
- **Acorn** - JavaScript parser for safe code execution
- **Prism.js** - Syntax highlighting

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues**: [Report a bug](https://github.com/mangdangroboticsclub/scratch/issues)
- **Repository**: [MangDang Robotics Club - Scratch](https://github.com/mangdangroboticsclub/scratch)

---

**Made with ❤️ for robotics education**
<div align="center">
  
  <img width="1200" height="475" alt="SmartBoard AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # 🎨 SmartBoard AI
  
  ### **AI-Powered Digital Whiteboard with Real-Time Recognition**
  
  <p align="center">
    <em>Transform your handwritten notes, sketches, and math equations into interactive digital content</em>
  </p>

  <!-- Badges -->
  <div align="center">
    
  ![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
  
  ![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
  ![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)
  ![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
  
  </div>

  ---

</div>

## ✨ Features

### 🖊️ **Advanced Drawing Tools**
- **Multi-tool Support**: Pen, highlighter, eraser, pointer, and selection tools
- **Color Customization**: Full color palette with custom color picker
- **Smooth Line Rendering**: Hardware-accelerated canvas rendering for fluid drawing
- **Pressure Sensitivity**: Natural writing experience with variable line thickness

### 🤖 **AI-Powered Recognition**
- **Handwriting Recognition**: Convert handwritten text to digital format
- **Mathematical Equation Solver**: Recognize and solve complex math equations
- **LaTeX Rendering**: Beautiful mathematical notation using KaTeX
- **Smart Analysis**: Automatic detection of content type (text, math, diagrams)
- **Multi-Model Support**: Choose from multiple Google Gemini AI models

### 📊 **Interactive Elements**
- **Dynamic Math Overlay**: Solve equations with step-by-step solutions
- **Graph Plotting**: Automatic visualization of mathematical functions
- **Editable Results**: Review, accept, or reject AI interpretations
- **Element Management**: Move, resize, and organize recognized elements

### 🔧 **Productivity Features**
- **Undo/Redo System**: Full history tracking with multi-step undo/redo
- **Clear Board**: Quick reset to start fresh
- **Lasso Selection**: Select and analyze specific regions
- **Auto-Save**: Persistent API key and model preferences
- **Real-time Processing**: Instant AI analysis with loading indicators

### 🎨 **Modern UI/UX**
- **Floating Dock**: macOS-style tool palette with smooth animations
- **Glass Morphism**: Beautiful backdrop blur effects and modern aesthetics
- **Dark Theme**: Eye-friendly dark interface with vibrant accents
- **Responsive Design**: Optimized for various screen sizes
- **Keyboard Shortcuts**: Power user optimizations

---

## 🚀 Tech Stack

### **Frontend Framework**
- **React 19.2.0** - Latest React with modern hooks and concurrent features
- **TypeScript 5.8.2** - Type-safe development with enhanced IDE support
- **Vite 6.2.0** - Lightning-fast build tool and dev server

### **Styling & UI**
- **TailwindCSS 4.1.17** - Utility-first CSS framework
- **Lucide React** - Beautiful, consistent icon set
- **KaTeX** - Fast mathematical typesetting

### **AI & APIs**
- **Google Gemini AI** - Multi-modal AI for vision and text analysis
- **@google/genai 1.30.0** - Official Google Generative AI SDK

### **Data Visualization**
- **Recharts 3.5.0** - Composable charting library for React

### **Development Tools**
- **PostCSS & Autoprefixer** - CSS processing and compatibility
- **@vitejs/plugin-react** - Fast Refresh and optimizations

---

## 📦 Installation

### **Prerequisites**
- **Node.js** (version 18.x or higher)
- **npm** or **yarn** package manager
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### **Steps**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartboard-ai.git
   cd smartboard-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (Optional - can be set in-app)
   ```bash
   # Create .env.local file
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   Navigate to: http://localhost:5173
   ```

---

## 🎯 Usage

### **Getting Started**

1. **Enter API Key**: On first launch, you'll be prompted to enter your Google Gemini API key
2. **Select Model**: Choose your preferred AI model (Gemini 2.0 Flash, 1.5 Pro, etc.)
3. **Start Drawing**: Use the floating dock to select tools and colors
4. **Analyze Content**: Use the lasso tool to select handwritten content for AI analysis
5. **Review Results**: Accept or reject AI interpretations, or manually edit

### **Tool Guide**

| Tool | Icon | Shortcut | Description |
|------|------|----------|-------------|
| **Pointer** | 🖱️ | `P` | Select and move elements |
| **Pen** | ✏️ | `D` | Draw freehand strokes |
| **Highlighter** | 🖍️ | `H` | Highlight with transparency |
| **Eraser** | 🧹 | `E` | Remove strokes |
| **Lasso** | ⭕ | `L` | Select region for AI analysis |

### **Advanced Features**

- **Undo/Redo**: Click the history buttons or use keyboard shortcuts
- **Color Picker**: Choose from preset colors or use custom color picker
- **Clear All**: Reset the entire board with one click
- **Model Selection**: Switch between AI models for different use cases
- **Persistent Storage**: Your API key and preferences are saved locally

---

## 🏗️ Project Structure

```
smartboard-ai/
├── components/
│   ├── Whiteboard.tsx       # Main canvas component with drawing logic
│   ├── FloatingDock.tsx     # Tool palette and controls
│   ├── MathOverlay.tsx      # LaTeX rendering and equation display
│   ├── ResultCard.tsx       # AI result presentation
│   └── AIInputModal.tsx     # API key and model selection
├── services/
│   └── gemini.ts            # Google Gemini AI integration
├── types.ts                 # TypeScript type definitions
├── App.tsx                  # Main application component
├── index.tsx                # Application entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── tailwind.config.js       # Tailwind CSS configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📝 Build & Deploy

### **Production Build**
```bash
npm run build
```

### **Preview Production Build**
```bash
npm run preview
```

### **Deployment**
The built files will be in the `dist/` directory. Deploy to:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Configure in repository settings
- **AI Studio**: [View live version](https://ai.studio/apps/drive/1w841RGiRtx5lJj6vT11wDsG4KeTnG9II)

---

## 🔒 Security & Privacy

- **API Keys**: Stored locally in browser storage, never transmitted to third parties
- **Data Processing**: Content is only sent to Google Gemini AI for analysis
- **No Backend**: All processing happens client-side or via Google's secure APIs

---

## 📜 License

This project is **private** and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI capabilities
- **React Team** - Amazing frontend framework
- **Vite Team** - Blazing fast build tool
- **Tailwind Labs** - Beautiful styling utilities
- **KaTeX Contributors** - Mathematical rendering

---

## 📧 Support & Contact

For questions, issues, or feature requests:
- 📫 Open an issue on GitHub
- 💬 Contact the development team
- 📚 Check the [AI Studio version](https://ai.studio/apps/drive/1w841RGiRtx5lJj6vT11wDsG4KeTnG9II)

---

<div align="center">
  
  **Made with ❤️ and AI**
  
  ⭐ Star this repository if you find it helpful!
  
</div>

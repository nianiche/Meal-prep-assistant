# 📦 Meal Prep Box Assistant

A modern web application designed to help you efficiently organize ingredients across your weekly meal prep containers. Perfect for meal preppers who want to distribute ingredients systematically, one ingredient at a time.

![Meal Prep Assistant Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Meal+Prep+Box+Assistant)

## ✨ Features

- **📅 5-Day Meal Planning**: Assign recipes to Monday through Friday
- **🔄 Ingredient Distribution**: Navigate through ingredients one at a time
- **📦 Visual Meal Prep Boxes**: See exactly how much of each ingredient goes into each container
- **🛒 Smart Shopping List**: Automatically calculates total quantities needed
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations

## 🚀 Live Demo

[View Live Demo](https://nianiche.github.io/meal-prep-assistant/) *(Replace with your actual GitHub Pages URL)*

## 🎯 How It Works

### 1. **Assign Recipes to Days**
Select which recipe you want to prepare for each day of the week (Monday-Friday) using the dropdown menus.

### 2. **Navigate Through Ingredients**
- Use the "Previous" and "Next" buttons to go through ingredients one by one
- See the current ingredient counter (e.g., "3 / 15")
- Each meal prep box shows exactly how much of the current ingredient it needs

### 3. **Smart Distribution**
- **Green boxes**: Contain the current ingredient
- **Red boxes**: Don't need the current ingredient (shows "0")
- **Example**: If you're looking at "onions", Monday's box might show "1 large" while Wednesday shows "0"

### 4. **Shopping List**
Get a consolidated shopping list showing total quantities needed for all selected recipes.

## 🛠️ Technologies Used

- **HTML5**: Semantic, accessible markup
- **CSS3**: Modern styling with Flexbox/Grid, animations, and responsive design
- **Vanilla JavaScript**: Clean, efficient ES6+ code with classes and modern APIs
- **Node.js**: Simple HTTP server for local development

## 📁 Project Structure

```
meal-prep-assistant/
├── src/
│   ├── index.html          # Main HTML file
│   ├── script.js           # JavaScript application logic
│   └── styles.css          # CSS styling
├── recipes/                # Sample recipe data (JSON files)
│   ├── chicken-stir-fry.json
│   ├── pasta-carbonara.json
│   ├── greek-salad.json
│   ├── chicken-salad.json
│   └── veggie-pasta.json
├── server.js               # Node.js development server
└── README.md              # Project documentation
```

## 🏁 Getting Started

### Prerequisites
- Node.js (for local development server)
- A modern web browser
- Git (for cloning/contributing)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/meal-prep-assistant.git
   cd meal-prep-assistant
   ```

2. **Start the local server**
   ```bash
   node server.js
   ```

3. **Open your browser**
   Navigate to `http://localhost:8000`

### Alternative Setup (Python)
If you prefer Python's built-in server:
```bash
cd src
python -m http.server 8000
```
Then visit `http://localhost:8000`

## 🍳 Sample Recipes Included

- **Chicken Stir Fry** - Asian-inspired with vegetables and rice
- **Pasta Carbonara** - Classic Italian comfort food
- **Greek Salad** - Fresh Mediterranean flavors
- **Chicken Salad** - Light and healthy option
- **Veggie Pasta** - Vegetarian-friendly pasta dish

## 🎨 Key Features in Detail

### Ingredient Navigation System
The heart of this app is the ingredient-by-ingredient navigation:
- Navigate through all unique ingredients from your selected recipes
- See real-time distribution across your 5 meal prep containers
- Visual feedback shows which containers need each ingredient

### Smart Recipe Assignment
- Dropdown menus for each day make it easy to assign recipes
- Recipe names appear on meal prep boxes for easy identification
- Change recipes anytime and see instant updates

### Responsive Meal Prep Boxes
- Visual representation of your actual meal prep containers
- Color-coded amounts (green for has ingredient, red for doesn't need)
- Clear quantity display for each ingredient per container

## 🔧 Customization

### Adding New Recipes
1. Create a new JSON file in the `recipes/` folder
2. Follow the existing format:
   ```json
   {
     "name": "Recipe Name",
     "servings": 4,
     "ingredients": {
       "ingredient1": "amount",
       "ingredient2": "amount"
     }
   }
   ```
3. Add the recipe to the `loadRecipes()` method in `script.js`

### Styling Modifications
- Edit `styles.css` to customize colors, fonts, or layout
- CSS custom properties make it easy to change the color scheme
- Responsive breakpoints can be adjusted for different screen sizes

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Ideas for Contributions
- Add more recipe categories
- Implement recipe search/filtering
- Add nutritional information
- Create recipe import/export features
- Add print-friendly meal prep labels
- Implement recipe scaling based on servings

## 🐛 Known Issues & Future Improvements

- [ ] Quantity combination logic could be more sophisticated (parsing units)
- [ ] Add ability to scale recipes up/down based on servings needed
- [ ] Implement recipe categories and filtering
- [ ] Add nutritional information per container
- [ ] Create printable meal prep labels
- [ ] Add recipe import from popular recipe websites

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by real meal prep workflows and challenges
- UI/UX design influenced by modern web application patterns
- Thanks to the meal prep community for feedback and suggestions

## 📧 Contact

- **GitHub**: [@your-username](https://github.com/your-username)
- **Project Link**: [https://github.com/your-username/meal-prep-assistant](https://github.com/your-username/meal-prep-assistant)

---

**Happy Meal Prepping! 📦🍽️**

*Made with ❤️ for the meal prep community*
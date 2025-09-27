class RecipeTextParser {
    constructor() {
        this.commonUnits = [
            'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
            'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'gram', 'grams', 'g',
            'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
            'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons', 'slice', 'slices',
            'piece', 'pieces', 'whole', 'half', 'quarter', 'clove', 'cloves', 'can', 'cans',
            'package', 'packages', 'jar', 'jars', 'bottle', 'bottles', 'large', 'medium', 'small'
        ];
        
        this.measurementPatterns = [
            // Fractions with units: "1/2 cup flour"
            /(\d+\/\d+)\s+(\w+)\s+(.+)/,
            // Decimal with units: "1.5 cups flour"
            /(\d+\.?\d*)\s+(\w+)\s+(.+)/,
            // Range with units: "2-3 cloves garlic"
            /(\d+-\d+)\s+(\w+)\s+(.+)/,
            // Just number with units: "2 cups flour"
            /(\d+)\s+(\w+)\s+(.+)/,
            // Number with parenthetical: "1 can (14 oz) tomatoes"
            /(\d+\.?\d*)\s+(\w+)\s*\([^)]+\)\s*(.+)/,
            // Just ingredient with number: "2 eggs"
            /(\d+\.?\d*)\s+(.+)/
        ];
    }

    parseRecipeText(recipeText) {
        const lines = recipeText.split('\n').map(line => line.trim()).filter(line => line);
        
        // Find recipe name (usually first non-empty line)
        let recipeName = lines[0] || 'Untitled Recipe';
        
        // Find ingredients section
        const ingredientsStartIndex = this.findIngredientsSectionStart(lines);
        const ingredientsEndIndex = this.findIngredientsSectionEnd(lines, ingredientsStartIndex);
        
        if (ingredientsStartIndex === -1) {
            throw new Error('Could not find ingredients section. Please make sure your recipe has an "Ingredients:" section.');
        }
        
        // Extract ingredient lines
        const ingredientLines = lines.slice(ingredientsStartIndex + 1, ingredientsEndIndex);
        
        // Parse each ingredient line
        const ingredients = {};
        let servings = this.estimateServings(recipeText);
        
        ingredientLines.forEach(line => {
            const parsed = this.parseIngredientLine(line);
            if (parsed) {
                ingredients[parsed.ingredient] = parsed.amount;
            }
        });
        
        return {
            name: recipeName,
            servings: servings,
            ingredients: ingredients,
            id: this.generateId(recipeName)
        };
    }
    
    findIngredientsSectionStart(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('ingredient') && (line.includes(':') || line.endsWith('s'))) {
                return i;
            }
        }
        return -1;
    }
    
    findIngredientsSectionEnd(lines, startIndex) {
        if (startIndex === -1) return -1;
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            // Stop at common section headers
            if (line.includes('instruction') || line.includes('direction') || 
                line.includes('method') || line.includes('preparation') ||
                line.includes('steps') || line.match(/^\d+\./)) {
                return i;
            }
        }
        return lines.length;
    }
    
    parseIngredientLine(line) {
        // Remove bullet points, dashes, numbers
        line = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        if (!line || line.length < 3) return null;
        
        // Try each measurement pattern
        for (let pattern of this.measurementPatterns) {
            const match = line.match(pattern);
            if (match) {
                let amount, unit, ingredient;
                
                if (match.length === 4) {
                    // Pattern with amount, unit, ingredient
                    [, amount, unit, ingredient] = match;
                    
                    // Check if unit is a common measurement
                    if (this.commonUnits.includes(unit.toLowerCase())) {
                        return {
                            ingredient: this.cleanIngredientName(ingredient),
                            amount: `${amount} ${unit}`
                        };
                    }
                }
                
                if (match.length === 3) {
                    // Pattern with just amount and ingredient
                    [, amount, ingredient] = match;
                    return {
                        ingredient: this.cleanIngredientName(ingredient),
                        amount: amount
                    };
                }
            }
        }
        
        // If no pattern matches, treat whole line as ingredient with unknown amount
        return {
            ingredient: this.cleanIngredientName(line),
            amount: 'as needed'
        };
    }
    
    cleanIngredientName(ingredient) {
        // Remove extra descriptions in parentheses or after commas
        ingredient = ingredient.split(',')[0].split('(')[0].trim();
        
        // Remove common preparation terms
        const prepTerms = [
            'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded', 'peeled',
            'cut into', 'cut in', 'finely', 'coarsely', 'roughly', 'fresh', 'dried',
            'ground', 'whole', 'crushed', 'for serving', 'to taste', 'optional'
        ];
        
        prepTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b.*`, 'gi');
            ingredient = ingredient.replace(regex, '').trim();
        });
        
        // Clean up extra spaces and trailing punctuation
        ingredient = ingredient.replace(/\s+/g, ' ').replace(/[,.\s]+$/, '').trim();
        
        return ingredient.toLowerCase();
    }
    
    estimateServings(recipeText) {
        const text = recipeText.toLowerCase();
        
        // Look for serving information
        const servingPatterns = [
            /serves?\s+(\d+)/,
            /(\d+)\s+servings?/,
            /makes?\s+(\d+)/,
            /yield:?\s+(\d+)/
        ];
        
        for (let pattern of servingPatterns) {
            const match = text.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        // Default estimate based on recipe length/complexity
        const lines = recipeText.split('\n').length;
        if (lines > 20) return 6;
        if (lines > 15) return 4;
        return 2;
    }
    
    generateId(name) {
        return name.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 30);
    }
}

class MealPrepBoxAssistant {
    constructor() {
        this.recipes = [];
        this.dayAssignments = {
            Monday: null,
            Tuesday: null,
            Wednesday: null,
            Thursday: null,
            Friday: null
        };
        this.allIngredients = [];
        this.currentIngredientIndex = 0;
        this.recipeParser = new RecipeTextParser();
        this.init();
    }

    async init() {
        await this.loadRecipes();
        this.populateRecipeSelectors();
        this.attachEventListeners();
        this.updateDisplay();
    }

    async loadRecipes() {
        // Recipe data embedded for demo
        this.recipes = [
            {
                id: 'chicken-stir-fry',
                name: 'Chicken Stir Fry',
                servings: 4,
                ingredients: {
                    'chicken breast': '1 lb',
                    'broccoli': '2 cups',
                    'bell pepper': '1 large',
                    'soy sauce': '3 tbsp',
                    'garlic': '2 cloves',
                    'ginger': '1 tsp',
                    'olive oil': '2 tbsp',
                    'rice': '2 cups'
                }
            },
            {
                id: 'pasta-carbonara',
                name: 'Pasta Carbonara',
                servings: 3,
                ingredients: {
                    'spaghetti': '12 oz',
                    'eggs': '3 large',
                    'parmesan cheese': '1 cup',
                    'bacon': '6 strips',
                    'garlic': '2 cloves',
                    'black pepper': '1 tsp',
                    'olive oil': '1 tbsp'
                }
            },
            {
                id: 'greek-salad',
                name: 'Greek Salad',
                servings: 2,
                ingredients: {
                    'cucumber': '1 large',
                    'tomatoes': '2 large',
                    'red onion': '1/2 cup',
                    'feta cheese': '1/2 cup',
                    'olives': '1/4 cup',
                    'olive oil': '3 tbsp',
                    'lemon juice': '2 tbsp',
                    'oregano': '1 tsp'
                }
            },
            {
                id: 'chicken-salad',
                name: 'Chicken Salad',
                servings: 2,
                ingredients: {
                    'chicken breast': '1/2 lb',
                    'lettuce': '2 cups',
                    'tomatoes': '1 large',
                    'cucumber': '1 medium',
                    'olive oil': '2 tbsp',
                    'lemon juice': '1 tbsp'
                }
            },
            {
                id: 'veggie-pasta',
                name: 'Veggie Pasta',
                servings: 3,
                ingredients: {
                    'spaghetti': '8 oz',
                    'bell pepper': '1 medium',
                    'broccoli': '1 cup',
                    'garlic': '3 cloves',
                    'olive oil': '3 tbsp',
                    'parmesan cheese': '1/2 cup'
                }
            }
        ];
    }

    addRecipeFromText(recipeText) {
        try {
            const parsedRecipe = this.recipeParser.parseRecipeText(recipeText);
            this.recipes.push(parsedRecipe);
            this.populateRecipeSelectors();
            return parsedRecipe;
        } catch (error) {
            throw new Error(`Failed to parse recipe: ${error.message}`);
        }
    }

    async addRecipeFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const recipeText = e.target.result;
                    const parsedRecipe = this.addRecipeFromText(recipeText);
                    resolve(parsedRecipe);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    removeCustomRecipe(recipeId) {
        const index = this.recipes.findIndex(recipe => recipe.id === recipeId);
        if (index > -1) {
            // Remove from recipes array
            this.recipes.splice(index, 1);
            
            // Remove from day assignments if assigned
            Object.keys(this.dayAssignments).forEach(day => {
                if (this.dayAssignments[day] && this.dayAssignments[day].id === recipeId) {
                    this.dayAssignments[day] = null;
                    // Update the selector
                    const selector = document.querySelector(`[data-day="${day}"]`);
                    if (selector) selector.value = '';
                }
            });
            
            this.populateRecipeSelectors();
            this.updateDisplay();
        }
    }

    populateRecipeSelectors() {
        const selectors = document.querySelectorAll('.recipe-selector');
        
        selectors.forEach(selector => {
            // Clear existing options except the first one
            selector.innerHTML = '<option value="">No Recipe</option>';
            
            // Add recipe options
            this.recipes.forEach(recipe => {
                const option = document.createElement('option');
                option.value = recipe.id;
                option.textContent = recipe.name;
                selector.appendChild(option);
            });
        });
    }

    onDayRecipeChange(day, recipeId) {
        if (recipeId) {
            const recipe = this.recipes.find(r => r.id === recipeId);
            this.dayAssignments[day] = recipe;
        } else {
            this.dayAssignments[day] = null;
        }
        
        this.updateRecipeNames();
        this.generateIngredientList();
        this.updateIngredientDisplay();
        this.updateShoppingList();
    }

    updateRecipeNames() {
        Object.keys(this.dayAssignments).forEach(day => {
            const recipeName = document.querySelector(`[data-day="${day}"] .recipe-name`);
            const recipe = this.dayAssignments[day];
            recipeName.textContent = recipe ? recipe.name : 'No recipe assigned';
        });
    }

    generateIngredientList() {
        const ingredientSet = new Set();
        
        Object.values(this.dayAssignments).forEach(recipe => {
            if (recipe) {
                Object.keys(recipe.ingredients).forEach(ingredient => {
                    ingredientSet.add(ingredient);
                });
            }
        });
        
        this.allIngredients = Array.from(ingredientSet).sort();
        this.currentIngredientIndex = 0;
        this.updateIngredientNavigation();
    }

    updateIngredientNavigation() {
        const prevBtn = document.getElementById('prev-ingredient');
        const nextBtn = document.getElementById('next-ingredient');
        const counter = document.getElementById('ingredient-counter');
        
        if (this.allIngredients.length === 0) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            counter.textContent = '0 / 0';
            return;
        }
        
        prevBtn.disabled = this.currentIngredientIndex === 0;
        nextBtn.disabled = this.currentIngredientIndex === this.allIngredients.length - 1;
        counter.textContent = `${this.currentIngredientIndex + 1} / ${this.allIngredients.length}`;
    }

    navigateIngredient(direction) {
        if (direction === 'next' && this.currentIngredientIndex < this.allIngredients.length - 1) {
            this.currentIngredientIndex++;
        } else if (direction === 'prev' && this.currentIngredientIndex > 0) {
            this.currentIngredientIndex--;
        }
        
        this.updateIngredientDisplay();
        this.updateIngredientNavigation();
    }

    updateIngredientDisplay() {
        const ingredientNameEl = document.getElementById('current-ingredient-name');
        
        if (this.allIngredients.length === 0) {
            ingredientNameEl.textContent = 'Select recipes to start distributing ingredients';
            this.clearIngredientAmounts();
            return;
        }
        
        const currentIngredient = this.allIngredients[this.currentIngredientIndex];
        ingredientNameEl.textContent = `Current Ingredient: ${currentIngredient}`;
        
        // Update amounts for each day
        Object.keys(this.dayAssignments).forEach(day => {
            const recipe = this.dayAssignments[day];
            const amountEl = document.getElementById(`${day.toLowerCase()}-amount`);
            
            if (recipe && recipe.ingredients[currentIngredient]) {
                amountEl.textContent = recipe.ingredients[currentIngredient];
                amountEl.classList.add('has-ingredient');
                amountEl.classList.remove('no-ingredient');
            } else {
                amountEl.textContent = '0';
                amountEl.classList.add('no-ingredient');
                amountEl.classList.remove('has-ingredient');
            }
        });
    }

    clearIngredientAmounts() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        days.forEach(day => {
            const amountEl = document.getElementById(`${day}-amount`);
            amountEl.textContent = '-';
            amountEl.classList.remove('has-ingredient', 'no-ingredient');
        });
    }

    updateShoppingList() {
        const shoppingListEl = document.getElementById('shopping-list');
        
        if (this.allIngredients.length === 0) {
            shoppingListEl.innerHTML = '<p class="placeholder">Assign recipes to see your consolidated shopping list</p>';
            return;
        }
        
        const consolidatedIngredients = this.consolidateIngredients();
        
        shoppingListEl.innerHTML = `
            <div class="shopping-summary">
                <h3>🛒 Total Shopping List</h3>
                <div class="ingredient-grid">
                    ${Object.entries(consolidatedIngredients)
                        .map(([ingredient, total]) => `
                            <div class="shopping-item">
                                <span class="ingredient-name">${ingredient}</span>
                                <span class="total-amount">${total}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }

    consolidateIngredients() {
        const consolidated = {};
        
        Object.values(this.dayAssignments).forEach(recipe => {
            if (recipe) {
                Object.entries(recipe.ingredients).forEach(([ingredient, amount]) => {
                    if (consolidated[ingredient]) {
                        consolidated[ingredient] = this.combineQuantities(consolidated[ingredient], amount);
                    } else {
                        consolidated[ingredient] = amount;
                    }
                });
            }
        });
        
        return consolidated;
    }

    combineQuantities(existing, additional) {
        // Simple combination for demo - in real app you'd parse and add units properly
        if (existing === additional) {
            return existing;
        }
        return `${existing} + ${additional}`;
    }

    updateDisplay() {
        this.updateRecipeNames();
        this.generateIngredientList();
        this.updateIngredientDisplay();
        this.updateShoppingList();
    }

    attachEventListeners() {
        // Recipe selector changes
        document.querySelectorAll('.recipe-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                const day = e.target.dataset.day;
                const recipeId = e.target.value;
                this.onDayRecipeChange(day, recipeId);
            });
        });
        
        // Ingredient navigation
        document.getElementById('prev-ingredient').addEventListener('click', () => {
            this.navigateIngredient('prev');
        });
        
        document.getElementById('next-ingredient').addEventListener('click', () => {
            this.navigateIngredient('next');
        });
        
        // Recipe input handlers
        this.attachRecipeInputHandlers();
    }
    
    attachRecipeInputHandlers() {
        const parseTextBtn = document.getElementById('parse-text-btn');
        const uploadFileBtn = document.getElementById('upload-file-btn');
        const fileInput = document.getElementById('recipe-file-input');
        const fileUploadArea = document.getElementById('file-upload-area');
        const addRecipeBtn = document.getElementById('add-recipe-btn');
        const cancelParseBtn = document.getElementById('cancel-parse-btn');
        
        let currentParsedRecipe = null;
        
        // Parse text recipe
        parseTextBtn.addEventListener('click', () => {
            const recipeText = document.getElementById('recipe-text-input').value.trim();
            if (!recipeText) {
                alert('Please enter some recipe text first!');
                return;
            }
            
            try {
                currentParsedRecipe = this.recipeParser.parseRecipeText(recipeText);
                this.showParsedRecipe(currentParsedRecipe);
            } catch (error) {
                alert(`Error parsing recipe: ${error.message}`);
            }
        });
        
        // File upload button
        uploadFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // File input change
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    currentParsedRecipe = await this.addRecipeFromFile(file);
                    this.showParsedRecipe(currentParsedRecipe);
                    // Remove the recipe we just added for preview
                    this.recipes.pop();
                } catch (error) {
                    alert(`Error parsing file: ${error.message}`);
                }
            }
        });
        
        // Drag and drop
        fileUploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });
        
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });
        
        fileUploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                    try {
                        currentParsedRecipe = await this.addRecipeFromFile(file);
                        this.showParsedRecipe(currentParsedRecipe);
                        // Remove the recipe we just added for preview
                        this.recipes.pop();
                    } catch (error) {
                        alert(`Error parsing file: ${error.message}`);
                    }
                } else {
                    alert('Please upload a .txt or .md file');
                }
            }
        });
        
        // Add parsed recipe
        addRecipeBtn.addEventListener('click', () => {
            if (currentParsedRecipe) {
                this.recipes.push(currentParsedRecipe);
                this.populateRecipeSelectors();
                this.hideParsedRecipe();
                this.clearRecipeInput();
                alert(`✅ "${currentParsedRecipe.name}" has been added to your recipes!`);
                currentParsedRecipe = null;
            }
        });
        
        // Cancel parsing
        cancelParseBtn.addEventListener('click', () => {
            this.hideParsedRecipe();
            currentParsedRecipe = null;
        });
    }
    
    showParsedRecipe(recipe) {
        const resultDiv = document.getElementById('parse-result');
        const displayDiv = document.getElementById('parsed-recipe-display');
        
        const displayText = `Recipe: ${recipe.name}
Servings: ${recipe.servings}

Ingredients:
${Object.entries(recipe.ingredients)
    .map(([ingredient, amount]) => `• ${ingredient}: ${amount}`)
    .join('\n')}`;
    
        displayDiv.textContent = displayText;
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    hideParsedRecipe() {
        document.getElementById('parse-result').classList.add('hidden');
    }
    
    clearRecipeInput() {
        document.getElementById('recipe-text-input').value = '';
        document.getElementById('recipe-file-input').value = '';
    }
}

// Initialize the app when the page loads
let mealPrepApp;
document.addEventListener('DOMContentLoaded', () => {
    mealPrepApp = new MealPrepBoxAssistant();
    window.mealPrepApp = mealPrepApp;
});
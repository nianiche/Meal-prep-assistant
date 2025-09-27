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
        
        if (lines.length < 2) {
            throw new Error('Recipe text is too short. Please provide a recipe with ingredients.');
        }
        
        // Find recipe name (usually first non-empty line)
        let recipeName = lines[0] || 'Untitled Recipe';
        
        // Find ingredients section
        const ingredientsStartIndex = this.findIngredientsSectionStart(lines);
        let ingredientsEndIndex = this.findIngredientsSectionEnd(lines, ingredientsStartIndex);
        
        if (ingredientsStartIndex === -1) {
            throw new Error(`Could not automatically detect ingredients. 

Please try formatting your recipe like this:

Recipe Name

Ingredients:
- 2 cups flour
- 1 cup milk  
- 3 eggs

Instructions:
1. Mix ingredients...

Or make sure ingredients have measurements (2 cups, 1 tbsp, etc.)`);
        }
        
        // If we found ingredients but no clear end, try to be smart about it
        if (ingredientsEndIndex === ingredientsStartIndex + 1 || ingredientsEndIndex === lines.length) {
            // Look for a better endpoint
            let betterEnd = -1;
            for (let i = ingredientsStartIndex + 1; i < lines.length; i++) {
                if (!this.looksLikeIngredient(lines[i]) && lines[i].trim().length > 0) {
                    // Found a line that doesn't look like an ingredient
                    if (i - ingredientsStartIndex >= 3) { // We have at least 2 ingredients
                        betterEnd = i;
                        break;
                    }
                }
            }
            if (betterEnd > 0) {
                ingredientsEndIndex = betterEnd;
            }
        }
        
        // Extract ingredient lines
        const ingredientLines = lines.slice(ingredientsStartIndex + 1, ingredientsEndIndex);
        
        // Parse each ingredient line
        const ingredients = {};
        let servings = this.estimateServings(recipeText);
        
        console.log('Ingredient lines to parse:', ingredientLines);
        
        ingredientLines.forEach((line, index) => {
            console.log(`Processing line ${index}:`, line);
            const parsed = this.parseIngredientLine(line);
            console.log('Parsed result:', parsed);
            if (parsed) {
                ingredients[parsed.ingredient] = parsed.amount;
            }
        });
        
        console.log('Final ingredients object:', ingredients);
        
        // Validate we found some ingredients
        if (Object.keys(ingredients).length === 0) {
            const debugInfo = `
Debug Info:
- Recipe name: "${recipeName}"
- Ingredients section found at line: ${ingredientsStartIndex}
- Ingredient lines (${ingredientLines.length}): ${JSON.stringify(ingredientLines, null, 2)}
- Lines that look like ingredients: ${ingredientLines.filter(line => this.looksLikeIngredient(line)).length}

Please try one of these formats:
• 2 cups flour
• 1 tbsp salt  
• 3 eggs
- 1/2 lb chicken
- 2 tsp vanilla

Or check the browser console for detailed parsing logs.`;
            
            throw new Error(`No ingredients could be parsed. ${debugInfo}`);
        }
        
        return {
            name: recipeName,
            servings: servings,
            ingredients: ingredients,
            id: this.generateId(recipeName)
        };
    }
    
    findIngredientsSectionStart(lines) {
        // Try multiple strategies to find ingredients
        
        // Strategy 1: Look for explicit "Ingredients:" header
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase().trim();
            if ((line.includes('ingredient') && (line.includes(':') || line.endsWith('s'))) ||
                line === 'ingredients' || line === 'ingredients:') {
                return i;
            }
        }
        
        // Strategy 2: Look for lines that start with measurements/bullet points
        let ingredientLikeLines = 0;
        let potentialStart = -1;
        
        for (let i = 1; i < lines.length; i++) { // Start from line 1 (skip recipe title)
            const line = lines[i].trim();
            
            // Skip empty lines and obvious non-ingredient lines
            if (!line || line.length < 3) continue;
            if (line.toLowerCase().includes('instruction') || 
                line.toLowerCase().includes('direction') ||
                line.toLowerCase().includes('method') ||
                line.toLowerCase().includes('step')) {
                break;
            }
            
            // Check if line looks like an ingredient
            if (this.looksLikeIngredient(line)) {
                if (potentialStart === -1) {
                    potentialStart = i;
                }
                ingredientLikeLines++;
                
                // If we find 2+ ingredient-like lines in a row, assume we found the start
                if (ingredientLikeLines >= 2) {
                    return potentialStart;
                }
            } else {
                // Reset if we hit a non-ingredient line
                ingredientLikeLines = 0;
                potentialStart = -1;
            }
        }
        
        // Strategy 3: If we found at least one ingredient-like line, use it
        if (potentialStart !== -1) {
            return potentialStart;
        }
        
        // Strategy 4: Last resort - start from line 1 if it has any measurements
        for (let i = 1; i < Math.min(10, lines.length); i++) {
            if (this.looksLikeIngredient(lines[i])) {
                return i;
            }
        }
        
        return -1;
    }
    
    looksLikeIngredient(line) {
        if (!line || line.trim().length < 3) return false;
        
        const trimmed = line.trim().toLowerCase();
        
        // Check for common ingredient patterns
        const ingredientPatterns = [
            /^[-•*]\s*\d+/, // Bullet point with number: "- 2 cups"
            /^[-•*]\s*\w/, // Any bullet point: "- flour"
            /^\d+[\s\/]/, // Starts with number: "2 cups", "1/2 lb"
            /^\d+\.?\d*\s+(cup|tbsp|tsp|lb|oz|gram|clove|can|bottle|jar)/i, // Number + unit
        ];
        
        for (let pattern of ingredientPatterns) {
            if (pattern.test(trimmed)) return true;
        }
        
        // Check for common measurement units anywhere in the line
        const hasUnit = this.commonUnits.some(unit => 
            trimmed.includes(` ${unit} `) || trimmed.includes(` ${unit},`) || 
            trimmed.includes(` ${unit}.`) || trimmed.endsWith(` ${unit}`)
        );
        
        // Check for numbers (ingredients usually have quantities)
        const hasNumber = /\d/.test(trimmed);
        
        return hasUnit || hasNumber;
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
        // Store original line for debugging
        const originalLine = line;
        
        // Remove bullet points, dashes, numbers at start
        line = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        if (!line || line.length < 2) return null;
        
        // Add debug logging
        console.log('Parsing line:', originalLine, '-> cleaned:', line);
        
        // Enhanced patterns that are more flexible
        const enhancedPatterns = [
            // Fraction + unit + ingredient: "1/2 cup flour"
            /^(\d+\/\d+)\s+(\w+)\s+(.+)$/,
            // Decimal + unit + ingredient: "1.5 cups flour"
            /^(\d+\.?\d*)\s+(\w+)\s+(.+)$/,
            // Range + unit + ingredient: "2-3 cloves garlic"
            /^(\d+-\d+)\s+(\w+)\s+(.+)$/,
            // Number + unit (no space) + ingredient: "2cups flour"
            /^(\d+\.?\d*)(\w+)\s+(.+)$/,
            // Just number + ingredient: "3 eggs"
            /^(\d+\.?\d*)\s+(.+)$/,
            // Unit at end: "flour 2 cups"
            /^(.+?)\s+(\d+\.?\d*)\s+(\w+)$/,
            // Parenthetical measurements: "tomatoes (1 can, 14 oz)"
            /^(.+?)\s*\((\d+\.?\d*)\s*(\w+).*\).*$/,
            // Just ingredient name (fallback)
            /^(.+)$/
        ];
        
        // Try enhanced patterns
        for (let i = 0; i < enhancedPatterns.length; i++) {
            const pattern = enhancedPatterns[i];
            const match = line.match(pattern);
            
            if (match) {
                console.log('Pattern matched:', i, match);
                
                if (i <= 2) {
                    // Patterns 0-2: amount + unit + ingredient
                    const [, amount, unit, ingredient] = match;
                    if (this.isValidUnit(unit)) {
                        return {
                            ingredient: this.cleanIngredientName(ingredient),
                            amount: `${amount} ${unit}`
                        };
                    }
                } else if (i === 3) {
                    // Pattern 3: amount+unit (no space) + ingredient
                    const [, amount, unit, ingredient] = match;
                    if (this.isValidUnit(unit)) {
                        return {
                            ingredient: this.cleanIngredientName(ingredient),
                            amount: `${amount} ${unit}`
                        };
                    }
                } else if (i === 4) {
                    // Pattern 4: just number + ingredient
                    const [, amount, ingredient] = match;
                    return {
                        ingredient: this.cleanIngredientName(ingredient),
                        amount: amount
                    };
                } else if (i === 5) {
                    // Pattern 5: ingredient + amount + unit
                    const [, ingredient, amount, unit] = match;
                    if (this.isValidUnit(unit)) {
                        return {
                            ingredient: this.cleanIngredientName(ingredient),
                            amount: `${amount} ${unit}`
                        };
                    }
                } else if (i === 6) {
                    // Pattern 6: ingredient (amount unit)
                    const [, ingredient, amount, unit] = match;
                    if (this.isValidUnit(unit)) {
                        return {
                            ingredient: this.cleanIngredientName(ingredient),
                            amount: `${amount} ${unit}`
                        };
                    }
                } else if (i === 7) {
                    // Pattern 7: just ingredient name
                    const [, ingredient] = match;
                    if (ingredient.trim().length > 0) {
                        return {
                            ingredient: this.cleanIngredientName(ingredient),
                            amount: 'as needed'
                        };
                    }
                }
            }
        }
        
        console.log('No pattern matched, returning null for:', originalLine);
        return null;
    }
    
    isValidUnit(unit) {
        return this.commonUnits.includes(unit.toLowerCase());
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
        const debugParseBtn = document.getElementById('debug-parse-btn');
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
        
        // Debug parse - shows detailed logging in console
        debugParseBtn.addEventListener('click', () => {
            const recipeText = document.getElementById('recipe-text-input').value.trim();
            if (!recipeText) {
                alert('Please enter some recipe text first!');
                return;
            }
            
            console.clear();
            console.log('=== DEBUG RECIPE PARSING ===');
            console.log('Input text:', recipeText);
            
            try {
                currentParsedRecipe = this.recipeParser.parseRecipeText(recipeText);
                console.log('✅ Parsing successful!', currentParsedRecipe);
                alert('✅ Parsing successful! Check console (F12) for details.');
            } catch (error) {
                console.error('❌ Parsing failed:', error);
                alert(`❌ Parsing failed: ${error.message}\n\nCheck console (F12) for detailed logs.`);
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
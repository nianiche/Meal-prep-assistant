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
    }
}

// Initialize the app when the page loads
let mealPrepApp;
document.addEventListener('DOMContentLoaded', () => {
    mealPrepApp = new MealPrepBoxAssistant();
    window.mealPrepApp = mealPrepApp;
});
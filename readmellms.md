# MarketMaster Translation System for LLMs

This document explains how the translation system in the MarketMaster application works, designed to be easily understood and maintained by future LLMs or developers.

## Overview

The application supports multiple languages (currently English and Spanish) using a simple JSON-based translation system. User interface text is dynamically updated based on the selected language.

## Core Components

1.  **Translation Files:**

    - Located in the `locales/` directory.
    - Each language has its own JSON file (e.g., `en.json`, `es.json`).
    - Files contain key-value pairs, where the key is a unique identifier for a text string, and the value is the translation in that specific language.
    - **Example (`en.json`):**
      ```json
      {
        "appTitle": "MarketMaster - Farmer's Market Sales Tracker",
        "productsTitle": "Products",
        ...
      }
      ```
    - **Example (`es.json`):**
      ```json
      {
        "appTitle": "MarketMaster - Rastreador de Ventas del Mercado Agrícola",
        "productsTitle": "Productos",
        ...
      }
      ```

2.  **HTML Markup (`index.html`):**

    - HTML elements that display translatable text have a `data-translate` attribute.
    - The value of `data-translate` corresponds to a key in the JSON translation files.
    - **Example:**
      ```html
      <h2 data-translate="productsTitle">Products</h2>
      <button data-translate="saveProductButton">Save Product</button>
      ```
    - For translating specific attributes (like `placeholder`), use `data-translate-attribute`:
      ```html
      <input
        type="text"
        data-translate="productNameLabel"
        data-translate-attribute="placeholder"
      />
      ```

3.  **JavaScript Logic (`script.js`):**
    - **State:**
      - `currentLanguage`: Stores the currently selected language code (e.g., 'en', 'es'). Loaded from `localStorage` or defaults to 'en'.
      - `translations`: An object holding the key-value pairs for the `currentLanguage`.
    - **Functions:**
      - `loadTranslations(lang)`: Asynchronously fetches the appropriate JSON file (`locales/{lang}.json`), stores the content in `translations`, updates `currentLanguage`, saves the preference to `localStorage`, sets the `lang` attribute on the `<html>` tag, and calls `applyTranslations()`.
      - `t(key)`: A helper function that takes a translation `key` and returns the corresponding string from the `translations` object. If the key is not found, it returns the key itself as a fallback.
      - `applyTranslations()`: Selects all elements with the `data-translate` attribute and updates their `textContent` or specified attribute using the `t()` function. It also handles specific elements or dynamic content placeholders that might not use the attribute directly.
      - `updateDynamicModalText()`: Updates text within dynamically generated content (like modal fields) using the `t()` function. Labels within dynamically generated HTML (e.g., in `updateDiscountFields`) should have a `data-translate-dynamic` attribute for this function to identify them.
      - `setupLanguageSwitcher()`: Adds an event listener to the language `<select>` element (`#languageSwitcher`) to call `loadTranslations()` when the selection changes.
      - `init()`: The main initialization function. It's `async` and calls `await loadTranslations(currentLanguage)` on startup to load the default/saved language. It also calls `setupLanguageSwitcher()`.
    - **Usage in Rendering:** Functions that render dynamic content (e.g., `renderProducts`, `renderSalesHistory`) use the `t()` function to get translated text for placeholders like "No products added yet".
    - **Usage in Prompts:** Functions using `confirm()` (e.g., `deleteProduct`) use `t()` to display translated confirmation messages.

## How to Add/Modify Translations

1.  **Identify Text:** Find the user-facing text string in the HTML or JavaScript that needs translation.
2.  **Choose/Create Key:** Select an existing key from the JSON files if the text is already translated, or create a new, descriptive camelCase key (e.g., `newItemPrompt`).
3.  **Update HTML:** If the text is in `index.html`, add/update the `data-translate="yourKey"` attribute to the relevant HTML element. If translating an attribute, also add `data-translate-attribute="attributeName"`.
4.  **Update JavaScript:**
    - If the text is generated dynamically in JavaScript (e.g., placeholders, alert/confirm messages), replace the hardcoded string with `t('yourKey')`.
    - If it's a label generated within dynamic HTML (like in `updateDiscountFields`), add `data-translate-dynamic="yourKey"` to the label tag when it's created.
5.  **Update JSON Files:** Add the new key and its translation to _all_ language files (`locales/en.json`, `locales/es.json`, etc.). Ensure correct JSON syntax (commas between properties, no trailing commas).

## Language Switching

- A `<select>` dropdown with the ID `languageSwitcher` in `index.html` allows users to select their preferred language.
- Changing the selection triggers `loadTranslations()` with the new language code.
- The selected language is saved in `localStorage` (`marketMasterLanguage`) and loaded automatically on subsequent visits.

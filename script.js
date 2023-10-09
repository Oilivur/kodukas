function showDropdown(button) {
    // Find the sibling dropdown and display it under the button
    const dropdown = button.nextElementSibling;
    if (dropdown) {
        const buttonRect = button.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.display = 'block';
    }
}

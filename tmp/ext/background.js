chrome.action.onClicked.addListener((tab) => {
  if (!tab.url || !tab.url.startsWith("https://profile.snapchat.com/")) {
    console.log("Please open a Snapchat Profile Manager page to use this extension.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      function clickIfExists(selector) {
        const el = document.querySelector(selector);
        if (el) {
          el.click();
          return true;
        }
        return false;
      }

      async function openAndSelectFirstDropdown(inputId) {
        const input = document.getElementById(inputId);
        if (!input) {
          console.error(`Input not found for id: ${inputId}`);
          return;
        }
        const dropdownContainer = input.closest('.ant-select').querySelector('.ant-select-selector');
        if (!dropdownContainer) {
          console.error(`Dropdown container not found for input id: ${inputId}`);
          return;
        }

        dropdownContainer.click();

        const listId = input.getAttribute('aria-owns');
        if (!listId) {
          console.error(`Dropdown list id (aria-owns) not found for input id: ${inputId}`);
          return;
        }

        const maxWait = 3000;
        const interval = 100;
        let elapsed = 0;
        while (elapsed < maxWait) {
          const menu = document.getElementById(listId);
          if (menu && menu.children.length > 0) {
            menu.children[0].click();
            console.log(`Selected first item in dropdown ${inputId}`);
            return;
          }
          await new Promise(r => setTimeout(r, interval));
          elapsed += interval;
        }
        console.error(`Dropdown menu did not appear for input id: ${inputId}`);
      }

      // Step 1: Click "Post to Snapchat" button
      const clickedPostButton = clickIfExists('button[data-testid="app.manageBrandProfile.sideNav.posttosnapchatbutton"]');
      if (!clickedPostButton) {
        console.log('Post to Snapchat button not found, aborting.');
        return;
      }

      // Wait for UI to render
      await new Promise(r => setTimeout(r, 3000));

      // Step 2: Check required checkboxes
      const checkboxIds = ['spotlight', 'publicStory', 'publicProfile'];
      for (const id of checkboxIds) {
        const checkbox = document.getElementById(id);
        if (checkbox && !checkbox.checked) {
          checkbox.click();
          console.log(`Checked checkbox with id="${id}"`);
        }
      }

      // Step 3: Open dropdowns sequentially with correct IDs
      // Use the actual input IDs found in the page
      const dropdownInputIds = ['rc_select_10', 'rc_select_11', 'rc_select_13', 'rc_select_14', 'rc_select_15', 'rc_select_16', 'rc_select_18', 'rc_select_19'];
      for (const id of dropdownInputIds) {
        await openAndSelectFirstDropdown(id);
        await new Promise(r => setTimeout(r, 500)); // small delay between dropdowns
      }

      // Step 4: Do NOT fill or modify any textareas or text inputs
      // Leaving description and headline fields empty as requested

      console.log('All dropdowns processed, text inputs untouched.');
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url || !tab.url.startsWith("https://profile.snapchat.com/")) {
    console.log("Please open a Snapchat Profile Manager page to use this extension.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {
      // Helper to click an element if it exists
      function clickIfExists(selector) {
        const el = document.querySelector(selector);
        if (el) {
          el.click();
          console.log(`Clicked element: ${selector}`);
          return true;
        } else {
          console.log(`Element not found: ${selector}`);
          return false;
        }
      }

      // Click the "Post to Snapchat" button by data-testid
      const clickedPostButton = clickIfExists('button[data-testid="app.manageBrandProfile.sideNav.posttosnapchatbutton"]');
      if (!clickedPostButton) {
        console.log('Post to Snapchat button not found, aborting.');
        return;
      }

      // Wait for the posting options panel to appear (adjust delay if needed)
      await new Promise(r => setTimeout(r, 1500));

      // IDs of checkboxes to check
      const checkboxIds = ['spotlight', 'publicStory', 'publicProfile'];

      for (const id of checkboxIds) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          if (!checkbox.checked) {
            checkbox.click();
            console.log(`Checked checkbox with id="${id}"`);
          } else {
            console.log(`Checkbox with id="${id}" already checked`);
          }
        } else {
          console.log(`Checkbox with id="${id}" not found`);
        }
      }
    }
  });
});
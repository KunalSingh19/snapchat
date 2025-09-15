chrome.action.onClicked.addListener((tab) => {
  if (!tab.url || !tab.url.startsWith("https://profile.snapchat.com/")) {
    console.log("Please open a Snapchat Profile Manager page to use this extension.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {
      function clickIfExists(selector) {
        const el = document.querySelector(selector);
        if (el) {
          el.click();
          return true;
        }
        return false;
      }

      // Step 1: Click "Post to Snapchat" button
      const clickedPostButton = clickIfExists('button[data-testid="app.manageBrandProfile.sideNav.posttosnapchatbutton"]');
      if (!clickedPostButton) {
        console.log('Post to Snapchat button not found, aborting.');
        return;
      }

      // Wait for UI to render
      await new Promise(r => setTimeout(r, 2000));

      // Step 2: Check the required checkboxes
      const checkboxIds = ['spotlight', 'publicStory', 'publicProfile'];
      for (const id of checkboxIds) {
        const checkbox = document.getElementById(id);
        if (checkbox && !checkbox.checked) {
          checkbox.click();
          console.log(`Checked checkbox with id="${id}"`);
        }
      }
    }
  });
});

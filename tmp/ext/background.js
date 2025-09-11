chrome.action.onClicked.addListener((tab) => {
  if (!tab.url || !tab.url.startsWith("https://profile.snapchat.com/")) {
    console.log("Please open a Snapchat Profile Manager page to use this extension.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const spotlightCheckbox = document.querySelector('input#spotlight[type="checkbox"]');
      if (spotlightCheckbox && !spotlightCheckbox.checked) {
        spotlightCheckbox.click();
        console.log('Checked "Post to Spotlight"');
      }

      const publicProfileCheckbox = document.querySelector('input#publicProfile[type="checkbox"]');
      if (publicProfileCheckbox && !publicProfileCheckbox.checked) {
        publicProfileCheckbox.click();
        console.log('Checked "Save to a Public Profile"');
      }

      const buttons = Array.from(document.querySelectorAll('button'));
      const postButton = buttons.find(btn => btn.textContent.trim() === 'Post to Snapchat');
      if (postButton) {
        postButton.click();
        console.log('Clicked "Post to Snapchat" button');
      }
    }
  });
});
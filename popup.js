document.addEventListener('DOMContentLoaded', () => {
  const monoToggle = document.getElementById('mono-toggle');

  // Load the current state from storage and update the checkbox
  chrome.storage.sync.get(['monoEnabled'], (result) => {
    // If monoEnabled is undefined or false, default is unchecked
    monoToggle.checked = !!result.monoEnabled;
  });

  // Listen for changes on the checkbox
  monoToggle.addEventListener('change', () => {
    // Save the new state in storage
    chrome.storage.sync.set({ monoEnabled: monoToggle.checked });
  });
});

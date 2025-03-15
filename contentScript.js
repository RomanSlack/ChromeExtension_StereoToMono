(function() {
  // Create a single AudioContext
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Keep track of which elements we've forced to mono
  // so we can (optionally) “disconnect” them if toggled off.
  const processedElements = new WeakSet();

  // 1. Force a given audio/video element into mono
  function forceMono(element) {
    // If we already processed this element, skip
    if (processedElements.has(element)) return;

    const source = audioCtx.createMediaElementSource(element);
    const splitter = audioCtx.createChannelSplitter(2);
    const merger = audioCtx.createChannelMerger(2);

    source.connect(splitter);

    // -- Option A: Use left channel for both --
    splitter.connect(merger, 0, 0); // left -> left
    splitter.connect(merger, 0, 1); // left -> right

    // -- Option B (comment out A first): average left & right --
    /*
    const leftGain = audioCtx.createGain();
    const rightGain = audioCtx.createGain();
    leftGain.gain.value = 0.5;
    rightGain.gain.value = 0.5;

    splitter.connect(leftGain, 0); // left channel
    splitter.connect(rightGain, 1); // right channel
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 0);
    // or connect to (0, 0) and (0, 1) if you want dual mono
    */

    merger.connect(audioCtx.destination);
    processedElements.add(element);
  }

  // 2. Attach the mono function to all existing media elements
  function attachMonoToAllMedia() {
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach((el) => {
      forceMono(el);
    });
  }

  // 3. Observe DOM for newly added <audio>/<video> and attach mono automatically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.tagName &&
          (node.tagName.toLowerCase() === 'audio' ||
            node.tagName.toLowerCase() === 'video')
        ) {
          forceMono(node);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // 4. Check storage for "monoEnabled" on load
  chrome.storage.sync.get(['monoEnabled'], (result) => {
    if (result.monoEnabled) {
      attachMonoToAllMedia();
    }
  });

  // 5. Listen for changes to the toggle
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.monoEnabled) {
      const isMonoNow = changes.monoEnabled.newValue;
      if (isMonoNow) {
        // Turn it on
        attachMonoToAllMedia();
      } else {
        // Turn it off
        // For a truly dynamic real-time “off,” we'd need to disconnect
        // each node from the AudioContext. Easiest approach might be to
        // reload the page or let the user know to refresh:
        window.location.reload();
      }
    }
  });
})();

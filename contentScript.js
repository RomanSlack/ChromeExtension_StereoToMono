// contentScript.js

(function() {
  // Create one AudioContext for the page
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Helper function to force an <audio> or <video> element into mono
  function forceMono(element) {
    // Create a source from the element
    const source = audioCtx.createMediaElementSource(element);

    // Create a splitter and merger
    const splitter = audioCtx.createChannelSplitter(2);
    const merger = audioCtx.createChannelMerger(2);

    source.connect(splitter);

    // Option 1: Use only the left channel for both sides
    splitter.connect(merger, 0, 0); // left channel out -> left channel in
    splitter.connect(merger, 0, 1); // left channel out -> right channel in

    // Option 2 (comment out Option 1 above first):
    // If you want a true mono with both channels averaged:
    //   const leftGain = audioCtx.createGain();
    //   const rightGain = audioCtx.createGain();
    //   leftGain.gain.value = 0.5;
    //   rightGain.gain.value = 0.5;
    //
    //   splitter.connect(leftGain, 0); // left channel
    //   splitter.connect(rightGain, 1); // right channel
    //
    //   leftGain.connect(merger, 0, 0);
    //   rightGain.connect(merger, 0, 0);
    //
    //   // Merge into single channel or connect to both (0, 0) and (0, 1)

    // Finally connect to the output
    merger.connect(audioCtx.destination);
  }

  // Attach on existing audio/video elements
  const mediaElements = document.querySelectorAll('audio, video');
  mediaElements.forEach((el) => {
    // If the audio is already playing, forcing mono might cause a small glitch
    // but typically it should be okay. Alternatively, handle on "play" event.
    forceMono(el);
  });

  // Also watch for any newly added audio/video elements using MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName && (node.tagName.toLowerCase() === 'audio' || node.tagName.toLowerCase() === 'video')) {
          forceMono(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();

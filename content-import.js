(async function importQueuedMemes() {
  // check if extension storage API exists
  if (!window.chrome || !chrome.storage || !chrome.storage.local) return;

  // helper to save a meme directly into IndexedDB
  function saveMemeToIndexedDB(meme) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("memeDB", 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("memes")) {
          db.createObjectStore("memes", { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction("memes", "readwrite");
        const store = tx.objectStore("memes");
        store.put(meme);
        tx.oncomplete = () => resolve();
        tx.onerror = (err) => reject(err);
      };

      request.onerror = (err) => reject(err);
    });
  }

  // read queued memes from extension storage
  chrome.storage.local.get(["queuedMemes"], async (res) => {
    const queuedMemes = res.queuedMemes || [];
    if (queuedMemes.length === 0) return;

    console.log("Importing queued memes from extension...", queuedMemes.length);

    for (const meme of queuedMemes) {
      try {
        await saveMemeToIndexedDB(meme);
      } catch (err) {
        console.error("Failed to import meme:", err);
      }
    }

    // clear the queue after importing
    chrome.storage.local.remove("queuedMemes");
    console.log("all queued memes imported into site DB");
  });
})();

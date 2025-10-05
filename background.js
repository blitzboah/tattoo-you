// create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToMemedb",
    title: "Save to MemeDB",
    contexts: ["image"]
  });
});

// handle menu click
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "saveToMemedb") {
    try {
      const response = await fetch(info.srcUrl);
      const blob = await response.blob();

      const meme = {
        id: Date.now(),
        name: "",
        description: "",
        imageBlob: blob,
        createdAt: Date.now()
      };

      await saveToMemeDB(meme);
      console.log("meme saved!");
    } catch (err) {
      console.error("Failed to save image:", err);
    }
  }
});

function saveToMemeDB(meme) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("memeDB", 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("memes")) {
        db.createObjectStore("memes", { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("memes", "readwrite");
      const store = tx.objectStore("memes");
      store.put(meme);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = (err) => reject(err);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

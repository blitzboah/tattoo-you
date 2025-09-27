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
      const base64 = await blobToBase64(blob);

      const meme = {
        id: Date.now(),
        name: "",
        description: "",
        imageType: blob.type,
        imageData: base64,
        createdAt: Date.now()
      };

      chrome.storage.local.get(["queuedMemes"], (res) => {
        const queued = res.queuedMemes || [];
        queued.push(meme);
        chrome.storage.local.set({ queuedMemes: queued });
        console.log("Meme queued in extension storage");
      });
    } catch (err) {
      console.error("Failed to save image:", err);
    }
  }
});

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
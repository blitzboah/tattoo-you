function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("memeDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("memes")) {
        db.createObjectStore("memes", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function getAllMemes() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("memes", "readonly");
    const store = tx.objectStore("memes");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = (event) => reject(event.target.error);

    tx.oncomplete = () => db.close();
  });
}

function deleteMeme(id) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction("memes", "readwrite");
    const store = tx.objectStore("memes");
    store.delete(id);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function renderMemes() {
  const container = document.getElementById("tattoo-you");
  if (!container) return;

  try {
    const memes = await getAllMemes();
    container.innerHTML = "";

    if (memes.length === 0) {
      container.textContent = "no memes saved yet.";
      return;
    }

    for (const meme of memes) {
      const memeDiv = document.createElement("div");
      memeDiv.className = "meme-container";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(meme.imageBlob);
      img.alt = meme.name || "meme";
      img.title = "Click to copy";
      img.style.cursor = "pointer";

      img.onclick = async () => {
        try {
          const blobToCopy = await convertToPng(meme.imageBlob);
          await navigator.clipboard.write([
            new ClipboardItem({ [blobToCopy.type]: blobToCopy })
          ]);
          console.log("Meme copied!");
        } catch (err) {
          console.error("Failed to copy meme:", err);
        }
      };

      const copyOverlay = document.createElement("div");
      copyOverlay.className = "copy-overlay";
      copyOverlay.innerHTML = `<img src="copy-icon.svg" alt="Copy">`;

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.innerHTML = `<img src="delete-icon.svg" alt="Delete">`;
      delBtn.title = "Delete";
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        await deleteMeme(meme.id);
        renderMemes();
      };

      memeDiv.appendChild(img);
      memeDiv.appendChild(copyOverlay);
      memeDiv.appendChild(delBtn);

      container.appendChild(memeDiv);
    }
  } catch (err) {
    console.error("Failed to load memes:", err);
  }
}

async function convertToPng(blob) {
  if (blob.type === "image/png") return blob;

  const img = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  return await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
}

document.addEventListener("DOMContentLoaded", renderMemes);
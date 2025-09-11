async function uploadVideoFromUrl(videoUrl) {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();

    // Create a File object (some upload inputs require File, not just Blob)
    const file = new File([blob], "video.mp4", { type: blob.type });

    // Find the file input element (you need to inspect Snapchat upload page to get selector)
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) {
      console.log("File input not found");
      return;
    }

    // Create a DataTransfer to simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Trigger change event to notify the page
    const event = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(event);

    console.log("Video file set on input");
  } catch (error) {
    console.error("Error uploading video from URL:", error);
  }
}

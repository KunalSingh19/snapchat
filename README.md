# snapchat
Automation for snapchat (currently in beta)

### API Usage Examples

The server exposes two main endpoints for managing Instagram reel URLs. Below are examples of how to interact with them using `curl` (for command-line testing) and JavaScript `fetch` (for client-side or Node.js usage). Assume the server is running at `http://localhost:3000`.

#### 1. GET `/get-next-reel`
   - **Purpose**: Retrieves the next URL from `reels.txt`, attempts to fetch Instagram data using `instagram-url-direct`. If valid, removes it from the queue, logs it to `history.txt`, and returns the data. If invalid, logs it to `invalid.txt` and tries the next one. Returns an error if no URLs are left.
   - **Response Format**:
     - Success: `{ success: true, url: "https://...", data: { ... } }` (data includes thumbnail, video URL, etc.)
     - No URLs: `{ success: false, message: "No more URLs to process" }`
     - Error: `{ success: false, error: "..." }`

   **cURL Example**:
   ```
   curl -X GET http://localhost:3000/get-next-reel
   ```

   **JavaScript Fetch Example**:
   ```javascript
   fetch('http://localhost:3000/get-next-reel')
     .then(response => response.json())
     .then(data => {
       if (data.success) {
         console.log('Reel URL:', data.url);
         console.log('Data:', data.data); // e.g., { thumbnail: "...", video: "..." }
       } else {
         console.log('Error:', data.message);
       }
     })
     .catch(error => console.error('Fetch error:', error));
   ```

#### 2. POST `/add-reel`
   - **Purpose**: Adds a new Instagram reel URL to the end of `reels.txt` for processing. Requires a JSON body with a `url` field.
   - **Request Body**: `{ "url": "https://www.instagram.com/reel/ABC123/" }`
   - **Response Format**:
     - Success: `{ success: true, message: "URL added successfully" }`
     - Invalid Input: `{ success: false, message: "Valid URL is required" }` (status 400)
     - Error: `{ success: false, error: "..." }` (status 500)

   **cURL Example**:
   ```
   curl -X POST http://localhost:3000/add-reel \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.instagram.com/reel/ABC123/"}'
   ```

   **JavaScript Fetch Example**:
   ```javascript
   fetch('http://localhost:3000/add-reel', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ url: 'https://www.instagram.com/reel/ABC123/' })
   })
     .then(response => response.json())
     .then(data => {
       if (data.success) {
         console.log('Success:', data.message);
       } else {
         console.log('Error:', data.message || data.error);
       }
     })
     .catch(error => console.error('Fetch error:', error));
   ```

### Notes
- **CORS**: Enabled for all origins, so it works with web browsers.
- **File Management**: The server auto-creates `reels.txt`, `./api/history.txt`, and `invalid.txt` if they don't exist.
- **Error Handling**: Invalid URLs (e.g., non-Instagram or broken links) are skipped and logged to `invalid.txt` without stopping the process.
- **Testing Setup**: 
  - Start the server: `node your-server-file.js` (ensure dependencies like `express`, `cors`, `fs-extra`, `path`, and `instagram-url-direct` are installed via npm).
  - Add some test URLs to `reels.txt` (one per line) before calling `/get-next-reel`.
- **Limitations**: The `instagramGetUrl` library may fail for private/protected reels or due to Instagram's API changes—check console logs for details.

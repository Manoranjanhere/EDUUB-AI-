export const debugJsonResponse = async (url) => {
    try {
      console.log(`Fetching raw response from: ${url}`);
      const response = await fetch(url);
      const text = await response.text();
      
      console.log("Raw response:", text);
      console.log("Response length:", text.length);
      console.log("First 100 chars:", text.substring(0, 100));
      console.log("Last 100 chars:", text.substring(text.length - 100));
      
      try {
        const json = JSON.parse(text);
        console.log("Successfully parsed JSON:", json);
        return json;
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        
        // Find where the error might be occurring
        for (let i = 0; i < text.length; i += 1000) {
          const chunk = text.substring(i, i + 1000);
          try {
            JSON.parse(chunk);
          } catch (e) {
            console.error(`Error parsing chunk at position ${i}-${i+1000}:`, chunk);
            break;
          }
        }
        
        throw parseError;
      }
    } catch (fetchError) {
      console.error("Fetch Error:", fetchError);
      throw fetchError;
    }
  };
  
  /**
   * Safely parse JSON with detailed error reporting
   */
  export const safeJsonParse = (jsonString) => {
    if (!jsonString) {
      console.warn("Attempted to parse empty/undefined JSON string");
      return null;
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Attempted to parse:", jsonString);
      
      // If it's a short string, print it entirely
      if (jsonString.length < 200) {
        console.error("Full content:", jsonString);
      } else {
        // Otherwise print the start and end
        console.error("Start of content:", jsonString.substring(0, 100));
        console.error("End of content:", jsonString.substring(jsonString.length - 100));
      }
      
      return null;
    }
  };
  
  /**
   * Safe localStorage access
   */
  export const safeStorage = {
    getItem: (key) => {
      try {
        const value = localStorage.getItem(key);
        console.log(`LocalStorage.getItem("${key}") returned:`, value ? `${value.substring(0, 20)}...` : value);
        return value;
      } catch (e) {
        console.error(`Error in localStorage.getItem("${key}"):`, e);
        return null;
      }
    },
    
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error(`Error in localStorage.setItem("${key}"):`, e);
        return false;
      }
    },
    
    getObject: (key) => {
      const value = safeStorage.getItem(key);
      return safeJsonParse(value);
    }
  };
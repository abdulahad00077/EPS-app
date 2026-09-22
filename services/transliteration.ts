export const transliterateToHindi = async (text: string): Promise<string> => {
  if (!text) return text;
  
  try {
    const response = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=hi-t-i0-und&num=1`);
    const data = await response.json();
    
    if (data[0] === 'SUCCESS') {
      return data[1][0][1][0];
    }
    return text;
  } catch (error) {
    console.error("Transliteration failed:", error);
    return text;
  }
};

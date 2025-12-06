export const downloadPDF = async (url) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  try {
    const response = await fetch(`${backendUrl}${url}`);
    if (!response.ok) throw new Error('PDF oluşturulamadı');
    
    const data = await response.json();
    
    if (data.success && data.content) {
      const byteChars = atob(data.content);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = data.filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('PDF download error:', error);
    alert('PDF indirilemedi: ' + error.message);
    return false;
  }
};

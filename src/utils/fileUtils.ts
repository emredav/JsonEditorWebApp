// Dosyayı JSON olarak indirme fonksiyonu
export function downloadJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = href;
  link.download = filename || 'data.json';
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

// Kopyalama işlemi için geliştirilmiş mobil uyumlu fonksiyon
export function copyToClipboard(text: string) {
  // Bildirim gösterme fonksiyonu - kopyalama sonrası kullanıcıya bilgi verir
  const showNotification = (success: boolean) => {
    const notification = document.createElement('div');
    notification.textContent = success ? '✓ Copied' : '✗ Copy failed';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${success ? '#10b981' : '#ef4444'};
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
      opacity: 1;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    // Notification'ı temiz şekilde kaldır
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 1700);
  };

  // Modern Clipboard API ile deneme
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification(true);
      })
      .catch((err) => {
        console.error("Clipboard API error:", err);
        // Modern API başarısız olursa yedek yöntemi dene
        fallbackCopyToClipboard(text, showNotification);
      });
  } else {
    // Clipboard API desteklenmiyorsa yedek yöntemi kullan
    fallbackCopyToClipboard(text, showNotification);
  }
}

// Eski tarayıcılar ve mobil için yedek kopyalama metodu
function fallbackCopyToClipboard(text: string, callback: (success: boolean) => void) {
  try {
    // Geçici textarea elementi oluştur
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Mobil ve masaüstünde çalışması için stil ayarları
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-1';
    
    document.body.appendChild(textArea);
    
    // Metin alanını seç ve kopyala
    textArea.focus();
    textArea.select();
    
    // Kopyalama komutu çalıştır
    const successful = document.execCommand('copy');
    
    // Geçici elementi temizle
    document.body.removeChild(textArea);
    
    // Sonucu bildir
    callback(successful);
  } catch (err) {
    console.error("Copying text failed:", err);
    callback(false);
  }
}

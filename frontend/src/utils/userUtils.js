// Utility functions for user management

export const generateUsername = (firstName, lastName) => {
  // Convert to lowercase and remove Turkish characters
  const cleanName = (name) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z]/g, '');
  };

  const cleanFirstName = cleanName(firstName);
  const cleanLastName = cleanName(lastName);
  
  // First 3 characters of first name + first character of last name
  const firstPart = cleanFirstName.substring(0, 3).padEnd(3, 'x');
  const lastPart = cleanLastName.substring(0, 1) || 'x';
  
  return firstPart + lastPart;
};

export const generatePassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ensure at least one of each required type
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(specialChars);
  
  // Fill the rest randomly (minimum 6 characters total)
  const allChars = lowercase + uppercase + numbers + specialChars;
  const remainingLength = Math.max(3, Math.floor(Math.random() * 4) + 3); // 6-9 characters total
  
  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(allChars);
  }
  
  // Shuffle the password
  password = shuffleString(password);
  
  // Check if password meets criteria, regenerate if not
  if (!isValidPassword(password)) {
    return generatePassword(); // Recursive call if invalid
  }
  
  return password;
};

const getRandomChar = (charset) => {
  return charset.charAt(Math.floor(Math.random() * charset.length));
};

const shuffleString = (str) => {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
};

const isValidPassword = (password) => {
  // Check minimum length
  if (password.length < 6) return false;
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) return false;
  
  // Check that no character appears more than 2 times consecutively
  const charCounts = {};
  let maxConsecutive = 1;
  let currentChar = password[0];
  let currentCount = 1;
  
  for (let i = 1; i < password.length; i++) {
    if (password[i] === currentChar) {
      currentCount++;
      maxConsecutive = Math.max(maxConsecutive, currentCount);
    } else {
      currentChar = password[i];
      currentCount = 1;
    }
    
    charCounts[password[i]] = (charCounts[password[i]] || 0) + 1;
  }
  
  // Check no character appears more than 2 times total
  const maxCharCount = Math.max(...Object.values(charCounts));
  
  return maxConsecutive <= 2 && maxCharCount <= 2;
};

export const departments = [
  { value: 'customer-service', label: 'Müşteri Temsilcisi' },
  { value: 'accounting', label: 'Muhasebe' },
  { value: 'senior-management', label: 'Üst Yönetim' },
  { value: 'management', label: 'Yönetim' },
  { value: 'sales', label: 'Satış' },
  { value: 'design', label: 'Tasarım' },
  { value: 'marketing', label: 'Pazarlama' }
];

export const sendWelcomeEmail = async (userData, generatedPassword) => {
  // In a real application, this would call your backend API
  const emailData = {
    to: userData.email,
    subject: 'Vitingo CRM - Hesabınız Oluşturuldu',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Vitingo CRM - Hoş Geldiniz</title>
        <style>
          .email-container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .email-header {
            background: linear-gradient(135deg, #3B82F6, #1E40AF);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .email-body {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .credentials-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .button {
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>🎉 Vitingo CRM'e Hoş Geldiniz!</h1>
            <p>Merhaba ${userData.firstName} ${userData.lastName}</p>
          </div>
          
          <div class="email-body">
            <p><strong>Tebrikler!</strong></p>
            <p>Vitingo CRM sisteminde yeni bir kullanıcı hesabı oluşturuldu ve size özel yetkilendirme yapıldı.</p>
            
            <div class="credentials-box">
              <h3>🔐 Giriş Bilgileriniz:</h3>
              <p><strong>Kullanıcı Adı:</strong> <code>${userData.username}</code></p>
              <p><strong>Geçici Şifre:</strong> <code>${generatedPassword}</code></p>
              <p><strong>Departman:</strong> ${userData.department}</p>
            </div>

            <p><strong>📋 Önemli Bilgiler:</strong></p>
            <ul>
              <li>Bu geçici şifrenizi ilk girişinizde mutlaka değiştirmeniz gerekmektedir</li>
              <li>Güvenliğiniz için şifrenizi kimseyle paylaşmayınız</li>
              <li>Profil bilgilerinizi tamamlayarak sistemden daha verimli yararlanabilirsiniz</li>
            </ul>

            <div style="text-align: center;">
              <a href="${window.location.origin}/profile/${userData.username}" class="button">
                🚀 Profilimi Düzenle ve Şifremi Değiştir
              </a>
            </div>

            <p><strong>💡 İlk Adımlarınız:</strong></p>
            <ol>
              <li>Yukarıdaki butona tıklayarak profil sayfanıza gidin</li>
              <li>Güvenli bir şifre belirleyin</li>
              <li>İletişim bilgilerinizi güncelleyin</li>
              <li>CRM sistemini keşfetmeye başlayın!</li>
            </ol>

            <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
            
            <p>CRM sistemimizi kullanırken başarılar dileriz!</p>
            
            <div class="footer">
              <p><strong>Vitingo CRM Ekibi</strong></p>
              <p>Bu e-posta otomatik olarak oluşturulmuştur.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  // Simulate email sending (in real app, call your email service)
  console.log('📧 Welcome email would be sent:', emailData);
  
  // Return a promise for consistent async handling
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Welcome email sent successfully' });
    }, 1000);
  });
};
/**
 * Waheim SDK - Standalone Mode Detection & Drawer with Theme Support
 * Automatically opens drawer when app is not in standalone mode
 * Adapts to device light/dark theme preference
 */

((window) => {
  // Utility functions
  const utils = {
    // Check if app is in standalone mode
    isStandalone: () => {
      // Only check actual PWA display modes - NOT navigation type or service worker
      const displayModeStandalone = window.matchMedia(
        '(display-mode: standalone)',
      ).matches;
      const displayModeFullscreen = window.matchMedia(
        '(display-mode: fullscreen)',
      ).matches;
      const displayModeMinimalUI = window.matchMedia(
        '(display-mode: minimal-ui)',
      ).matches;
      const iosStandalone = window.navigator.standalone === true;

      // Only these checks are reliable for detecting actual PWA standalone mode
      const isStandalone =
        displayModeStandalone ||
        displayModeFullscreen ||
        displayModeMinimalUI ||
        iosStandalone;

      return isStandalone;
    },

    // Check if running on mobile
    isMobile: () =>
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent,
      ),

    // Check if device prefers dark mode
    isDarkMode: () => window.matchMedia('(prefers-color-scheme: dark)').matches,

    // Get theme colors based on device preference
    getThemeColors: function () {
      const isDark = this.isDarkMode();
      return {
        background: isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
        foreground: isDark ? 'hsl(0 0% 98%)' : 'hsl(0 0% 3.9%)',
        muted: isDark ? 'hsl(0 0% 15%)' : 'hsl(0 0% 98%)',
        mutedForeground: isDark ? 'hsl(0 0% 64%)' : 'hsl(0 0% 46%)',
        border: isDark ? 'hsl(0 0% 15%)' : 'hsl(0 0% 89.8%)',
        input: isDark ? 'hsl(0 0% 9%)' : 'hsl(0 0% 98%)',
        ring: isDark ? 'hsl(0 0% 64%)' : 'hsl(0 0% 46%)',
        overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
        handle: isDark ? 'hsl(0 0% 25%)' : 'hsl(0 0% 88%)',
        gradient: isDark
          ? 'linear-gradient(135deg, hsl(262.1 83.3% 57.8%) 0%, hsl(262.1 83.3% 57.8% / 0.6) 100%)'
          : 'linear-gradient(135deg, hsl(262.1 83.3% 57.8%) 0%, hsl(262.1 83.3% 57.8% / 0.8) 100%)',
      };
    },

    // Get manifest URL from HTML link tag
    getManifestUrl: () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink && manifestLink.href) {
        return manifestLink.href;
      }
      // Fallback to default paths
      return '/manifest.json';
    },

    // Get favicon URL from HTML link tags
    getFaviconFromHtml: () => {
      // Look for various favicon link types
      const selectors = [
        'link[rel="apple-touch-icon"]',
        'link[rel="icon"][type="image/png"]',
        'link[rel="icon"][type="image/x-icon"]',
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
      ];

      for (const selector of selectors) {
        const link = document.querySelector(selector);
        if (link && link.href) {
          return link.href;
        }
      }

      // Fallback to common favicon paths
      return null;
    },

    // Load manifest and get app info
    loadManifest: async () => {
      try {
        const manifestUrl = utils.getManifestUrl();
        const response = await fetch(manifestUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const manifest = await response.json();
        console.log('[Waheim SDK] Manifest loaded:', manifest);
        return manifest;
      } catch (error) {
        console.warn('[Waheim SDK] Could not load manifest:', error);
        // Return default manifest with favicon from HTML if available
        const htmlFavicon = utils.getFaviconFromHtml();
        return {
          name: 'React PWA',
          short_name: 'ReactPWA',
          icons: htmlFavicon
            ? [{ src: htmlFavicon, sizes: '192x192', type: 'image/png' }]
            : [{ src: '/favicon.png', sizes: '192x192', type: 'image/png' }],
        };
      }
    },

    // Get app icon URL from manifest or HTML
    getAppIcon: async function (size = 192) {
      try {
        const manifest = await this.loadManifest();

        // First try manifest icons
        if (manifest && manifest.icons && manifest.icons.length > 0) {
          // Find best icon size
          let icon = manifest.icons.find(
            (i) => i.sizes && i.sizes.split(' ').includes(`${size}x${size}`),
          );

          if (!icon) {
            // Try to find an icon with the desired size
            icon = manifest.icons.find(
              (i) => i.sizes && i.sizes.includes(size.toString()),
            );
          }

          if (!icon) {
            // Fallback to any available icon
            icon = manifest.icons[0];
          }

          if (icon && icon.src) {
            // Test if icon exists
            try {
              const response = await fetch(icon.src, { method: 'HEAD' });
              if (response.ok) {
                return icon.src;
              }
            } catch (e) {
              // Icon fetch failed, continue to HTML favicon fallback
            }
          }
        }

        // Fallback to HTML favicon
        const htmlFavicon = this.getFaviconFromHtml();
        if (htmlFavicon) {
          // Test if HTML favicon exists
          try {
            const response = await fetch(htmlFavicon, { method: 'HEAD' });
            if (response.ok) {
              return htmlFavicon;
            }
          } catch (e) {
            // HTML favicon fetch failed
          }
        }

        console.warn('[Waheim SDK] No valid icon found, using fallback');
        return this.createFallbackIcon();
      } catch (error) {
        console.warn('[Waheim SDK] Error loading app icon:', error);
        // Try HTML favicon as last resort
        const htmlFavicon = this.getFaviconFromHtml();
        if (htmlFavicon) {
          return htmlFavicon;
        }
        return this.createFallbackIcon();
      }
    },

    // Create fallback icon
    createFallbackIcon: () => {
      // Create a data URL with a simple icon
      const svgIcon = `
        <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="192" height="192" rx="32"/>
          <path d="M96 48C80 48 64 56 56 68C48 80 48 96 48 112H64C64 96 64 80 72 68C80 56 88 48 96 48V48Z" fill="white"/>
          <circle cx="96" cy="96" r="32" fill="white"/>
          <circle cx="96" cy="96" r="16"/>
        </svg>
      `;

      return 'data:image/svg+xml;base64,' + btoa(svgIcon);
    },

    // Get device language and translate text
    translateText: (key, fallbackText) => {
      const deviceLang = navigator.language || navigator.userLanguage || 'en';

      // Translation map for comprehensive language support
      const translations = {
        en: {
          clickOnBrowser: 'Click',
          shareIcon: 'on menu of browser',
          scrollAndSelect: 'Scroll and select',
          addToHomeScreen: 'Add to Home Screen',
          openApp: 'Open app',
          fromHomeScreen: 'from your home screen',
        },
        es: {
          clickOnBrowser: 'Haz clic',
          shareIcon: 'en el menú del navegador',
          scrollAndSelect: 'Desplázate y selecciona',
          addToHomeScreen: 'Añadir a pantalla de inicio',
          openApp: 'Abrir app',
          fromHomeScreen: 'desde tu pantalla de inicio',
        },
        fr: {
          clickOnBrowser: 'Cliquez',
          shareIcon: 'sur le menu du navigateur',
          scrollAndSelect: 'Faites défiler et sélectionnez',
          addToHomeScreen: "Ajouter à l'écran d'accueil",
          openApp: "Ouvrir l'app",
          fromHomeScreen: "depuis votre écran d'accueil",
        },
        de: {
          clickOnBrowser: 'Klicken',
          shareIcon: 'im Browser-Menü',
          scrollAndSelect: 'Scrollen und auswählen',
          addToHomeScreen: 'Zum Startbildschirm hinzufügen',
          openApp: 'App öffnen',
          fromHomeScreen: 'vom Startbildschirm aus',
        },
        it: {
          clickOnBrowser: 'Clicca',
          shareIcon: 'sul menu del browser',
          scrollAndSelect: 'Scorri e seleziona',
          addToHomeScreen: 'Aggiungi alla schermata principale',
          openApp: 'Apri app',
          fromHomeScreen: 'dalla tua schermata principale',
        },
        pt: {
          clickOnBrowser: 'Clique',
          shareIcon: 'no menu do navegador',
          scrollAndSelect: 'Role e selecione',
          addToHomeScreen: 'Adicionar à tela inicial',
          openApp: 'Abrir app',
          fromHomeScreen: 'da sua tela inicial',
        },
        ja: {
          clickOnBrowser: 'クリック',
          shareIcon: 'ブラウザのメニューで',
          scrollAndSelect: 'スクロールして選択',
          addToHomeScreen: 'ホーム画面に追加',
          openApp: 'アプリを開く',
          fromHomeScreen: 'ホーム画面から',
        },
        ko: {
          clickOnBrowser: '클릭',
          shareIcon: '브라우저 메뉴에서',
          scrollAndSelect: '스크롤하여 선택',
          addToHomeScreen: '홈 화면에 추가',
          openApp: '앱 열기',
          fromHomeScreen: '홈 화면에서',
        },
        zh: {
          clickOnBrowser: '点击',
          shareIcon: '在浏览器菜单中',
          scrollAndSelect: '滚动并选择',
          addToHomeScreen: '添加到主屏幕',
          openApp: '打开应用',
          fromHomeScreen: '从主屏幕',
        },
        ru: {
          clickOnBrowser: 'Нажмите',
          shareIcon: 'в меню браузера',
          scrollAndSelect: 'Прокрутите и выберите',
          addToHomeScreen: 'Добавить на главный экран',
          openApp: 'Открыть приложение',
          fromHomeScreen: 'с главного экрана',
        },
        ar: {
          clickOnBrowser: 'انقر',
          shareIcon: 'في قائمة المتصفح',
          scrollAndSelect: 'قم بالتمرير وحدد',
          addToHomeScreen: 'إضافة إلى الشاشة الرئيسية',
          openApp: 'فتح التطبيق',
          fromHomeScreen: 'من الشاشة الرئيسية',
        },
        vi: {
          clickOnBrowser: 'Nhấn vào',
          shareIcon: 'trên menu của trình duyệt',
          scrollAndSelect: 'Cuộn và chọn',
          addToHomeScreen: 'Thêm vào Màn hình chính',
          openApp: 'Mở ứng dụng',
          fromHomeScreen: 'từ Màn hình chính của bạn',
        },
        hi: {
          clickOnBrowser: 'क्लिक करें',
          shareIcon: 'ब्राउज़र मेनू पर',
          scrollAndSelect: 'स्क्रॉल करें और चुनें',
          addToHomeScreen: 'होम स्क्रीन पर जोड़ें',
          openApp: 'ऐप खोलें',
          fromHomeScreen: 'अपनी होम स्क्रीन से',
        },
        th: {
          clickOnBrowser: 'คลิก',
          shareIcon: 'บนเมนูของเบราว์เซอร์',
          scrollAndSelect: 'เลื่อนและเลือก',
          addToHomeScreen: 'เพิ่มลงหน้าจอหลัก',
          openApp: 'เปิดแอป',
          fromHomeScreen: 'จากหน้าจอหลักของคุณ',
        },
        id: {
          clickOnBrowser: 'Klik',
          shareIcon: 'pada menu browser',
          scrollAndSelect: 'Gulir dan pilih',
          addToHomeScreen: 'Tambahkan ke Layar Utama',
          openApp: 'Buka aplikasi',
          fromHomeScreen: 'dari layar utama Anda',
        },
        ms: {
          clickOnBrowser: 'Klik',
          shareIcon: 'pada menu pelayar',
          scrollAndSelect: 'Skrol dan pilih',
          addToHomeScreen: 'Tambah ke Skrin Utama',
          openApp: 'Buka aplikasi',
          fromHomeScreen: 'dari skrin utama anda',
        },
        tr: {
          clickOnBrowser: 'Tıklayın',
          shareIcon: 'tarayıcı menüsünde',
          scrollAndSelect: 'Kaydırın ve seçin',
          addToHomeScreen: 'Ana Ekrana Ekle',
          openApp: 'Uygulamayı aç',
          fromHomeScreen: 'ana ekranınızdan',
        },
        pl: {
          clickOnBrowser: 'Kliknij',
          shareIcon: 'w menu przeglądarki',
          scrollAndSelect: 'Przewiń i wybierz',
          addToHomeScreen: 'Dodaj do ekranu głównego',
          openApp: 'Otwórz aplikację',
          fromHomeScreen: 'ze swojego ekranu głównego',
        },
        nl: {
          clickOnBrowser: 'Klik',
          shareIcon: 'in het browsermenu',
          scrollAndSelect: 'Scroll en selecteer',
          addToHomeScreen: 'Toevoegen aan startscherm',
          openApp: 'App openen',
          fromHomeScreen: 'vanaf je startscherm',
        },
        sv: {
          clickOnBrowser: 'Klicka',
          shareIcon: 'i webbläsarmenyn',
          scrollAndSelect: 'Bläddra och välj',
          addToHomeScreen: 'Lägg till på hemskärmen',
          openApp: 'Öppna app',
          fromHomeScreen: 'från din hemskärm',
        },
        da: {
          clickOnBrowser: 'Klik',
          shareIcon: 'i browsermenuen',
          scrollAndSelect: 'Rul og vælg',
          addToHomeScreen: 'Tilføj til startskærm',
          openApp: 'Åbn app',
          fromHomeScreen: 'fra din startskærm',
        },
        no: {
          clickOnBrowser: 'Klikk',
          shareIcon: 'i nettlesermenyen',
          scrollAndSelect: 'Rull og velg',
          addToHomeScreen: 'Legg til på startskjerm',
          openApp: 'Åpne app',
          fromHomeScreen: 'fra startskjermen din',
        },
        fi: {
          clickOnBrowser: 'Napsauta',
          shareIcon: 'selainvalikossa',
          scrollAndSelect: 'Vieritä ja valitse',
          addToHomeScreen: 'Lisää aloitusnäytölle',
          openApp: 'Avaa sovellus',
          fromHomeScreen: 'aloitusnäytöltäsi',
        },
        he: {
          clickOnBrowser: 'לחץ',
          shareIcon: 'בתפריט הדפדפן',
          scrollAndSelect: 'גלול ובחר',
          addToHomeScreen: 'הוסף למסך הבית',
          openApp: 'פתח אפליקציה',
          fromHomeScreen: 'ממסך הבית שלך',
        },
        fa: {
          clickOnBrowser: 'کلیک کنید',
          shareIcon: 'در منوی مرورگر',
          scrollAndSelect: 'اسکرول و انتخاب کنید',
          addToHomeScreen: 'افزودن به صفحه اصلی',
          openApp: 'باز کردن برنامه',
          fromHomeScreen: 'از صفحه اصلی شما',
        },
        ur: {
          clickOnBrowser: 'کلک کریں',
          shareIcon: 'براؤزر مینو میں',
          scrollAndSelect: 'اسکرول کریں اور منتخب کریں',
          addToHomeScreen: 'ہوم اسکرین پر شامل کریں',
          openApp: 'ایپ کھولیں',
          fromHomeScreen: 'آپ کی ہوم اسکرین سے',
        },
        bn: {
          clickOnBrowser: 'ক্লিক করুন',
          shareIcon: 'ব্রাউজার মেনুতে',
          scrollAndSelect: 'স্ক্রোল করুন এবং নির্বাচন করুন',
          addToHomeScreen: 'হোম স্ক্রিনে যোগ করুন',
          openApp: 'অ্যাপ খুলুন',
          fromHomeScreen: 'আপনার হোম স্ক্রিন থেকে',
        },
        ta: {
          clickOnBrowser: 'சொடுக்கவும்',
          shareIcon: 'உலாவி மெனுவில்',
          scrollAndSelect: 'உருட்டி தேர்ந்தெடுக்கவும்',
          addToHomeScreen: 'முகப்புத்திரையில் சேர்க்கவும்',
          openApp: 'ஆப் திறக்கவும்',
          fromHomeScreen: 'உங்கள் முகப்புத்திரையில் இருந்து',
        },
        te: {
          clickOnBrowser: 'క్లిక్ చేయండి',
          shareIcon: 'బ్రౌజర్ మెనులో',
          scrollAndSelect: 'స్క్రోల్ చేసి ఎంచుకోండి',
          addToHomeScreen: 'హోమ్ స్క్రీన్‌కి జోడించండి',
          openApp: 'యాప్ తెరవండి',
          fromHomeScreen: 'మీ హోమ్ స్క్రీన్ నుండి',
        },
        mr: {
          clickOnBrowser: 'क्लिक करा',
          shareIcon: 'ब्राउझर मेनूमध्ये',
          scrollAndSelect: 'स्क्रोल करून निवडा',
          addToHomeScreen: 'होम स्क्रीनवर जोडा',
          openApp: 'अॅप उघडा',
          fromHomeScreen: 'तुमच्या होम स्क्रीनवरून',
        },
        gu: {
          clickOnBrowser: 'ક્લિક કરો',
          shareIcon: 'બ્રાઉઝર મેનુમાં',
          scrollAndSelect: 'સ્ક્રોલ કરો અને પસંદ કરો',
          addToHomeScreen: 'હોમ સ્ક્રીન પર ઉમેરો',
          openApp: 'એપ ખોલો',
          fromHomeScreen: 'તમારા હોમ સ્ક્રીન પરથી',
        },
        pa: {
          clickOnBrowser: 'ਕਲਿੱਕ ਕਰੋ',
          shareIcon: 'ਬਰਾਊਜ਼ਰ ਮੀਨੂ ਵਿੱਚ',
          scrollAndSelect: 'ਸਕ੍ਰੋਲ ਕਰੋ ਅਤੇ ਚੁਣੋ',
          addToHomeScreen: 'ਹੋਮ ਸਕ੍ਰੀਨ ਤੇ ਸ਼ਾਮਲ ਕਰੋ',
          openApp: 'ਐਪ ਖੋਲ੍ਹੋ',
          fromHomeScreen: 'ਤੁਹਾਡੀ ਹੋਮ ਸਕ੍ਰੀਨ ਤੋਂ',
        },
        kn: {
          clickOnBrowser: 'ಕ್ಲಿಕ್ ಮಾಡಿ',
          shareIcon: 'ಬ್ರೌಸರ್ ಮೆನುವಿನಲ್ಲಿ',
          scrollAndSelect: 'ಸ್ಕ್ರೋಲ್ ಮಾಡಿ ಆಯ್ಕೆಮಾಡಿ',
          addToHomeScreen: 'ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ',
          openApp: 'ಅಪ್ ತೆರೆಯಿರಿ',
          fromHomeScreen: 'ನಿಮ್ಮ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ನಿಂದ',
        },
        ml: {
          clickOnBrowser: 'ക്ലിക്ക് ചെയ്യുക',
          shareIcon: 'ബ്രൗസർ മെനുവിൽ',
          scrollAndSelect: 'സ്ക്രോൾ ചെയ്ത് തിരഞ്ഞെടുക്കുക',
          addToHomeScreen: 'ഹോം സ്ക്രീനിൽ ചേർക്കുക',
          openApp: 'ആപ്പ് തുറക്കുക',
          fromHomeScreen: 'നിങ്ങളുടെ ഹോം സ്ക്രീനിൽ നിന്ന്',
        },
        si: {
          clickOnBrowser: 'එබ්බන්න',
          shareIcon: 'බ්රව්සර් මෙනුවේ',
          scrollAndSelect: 'ස්ක්රෝල් කර තෝරන්න',
          addToHomeScreen: 'මුල් තිරයට එකතු කරන්න',
          openApp: 'යෙදුම විවෘත කරන්න',
          fromHomeScreen: 'ඔබගේ මුල් තිරයෙන්',
        },
        my: {
          clickOnBrowser: 'နှိပ်ပါ',
          shareIcon: 'ဘရောက်ဇာမီနူးတွင်',
          scrollAndSelect: 'စက្ឱးော့လုပ်ပြီးရွေးချယ်ပါ',
          addToHomeScreen: 'ပင်မစာမျက်နှာသို့ထည့်ပါ',
          openApp: 'အက်ပ်ဖွင့်ပါ',
          fromHomeScreen: 'သင့်ပင်မစာမျက်နှာမှ',
        },
        km: {
          clickOnBrowser: 'ចុច',
          shareIcon: 'នៅក្នុងម៉ឺនុយកម្មវិធីរុករក',
          scrollAndSelect: 'រមូរហើយជ្រើសរើស',
          addToHomeScreen: 'បន្ថែមទៅអេក្រង់ដើម',
          openApp: 'បើកកម្មវិធី',
          fromHomeScreen: 'ពីអេក្រង់ដើមរបស់អ្នក',
        },
        lo: {
          clickOnBrowser: 'ກົດ',
          shareIcon: 'ໃນເມນູບຣາວເຊີ',
          scrollAndSelect: 'ເລື່ອນ ແລະ ເລືອກ',
          addToHomeScreen: 'ເພີ່ມໃສ່ໜ້າຈໍຫຼັກ',
          openApp: 'ເປີດແອັບ',
          fromHomeScreen: 'ຈາກໜ້າຈໍຫຼັກຂອງທ່ານ',
        },
        ne: {
          clickOnBrowser: 'क्लिक गर्नुहोस्',
          shareIcon: 'ब्राउजर मेनुमा',
          scrollAndSelect: 'स्क्रोल गर्नुहोस् र छनोट गर्नुहोस्',
          addToHomeScreen: 'होम स्क्रिनमा थप्नुहोस्',
          openApp: 'एप खोल्नुहोस्',
          fromHomeScreen: 'तपाईंको होम स्क्रिनबाट',
        },
        as: {
          clickOnBrowser: 'ক্লিক কৰক',
          shareIcon: 'ব্ৰাউজাৰ মেনুত',
          scrollAndSelect: 'স্ক্ৰল কৰক আৰু নিৰ্বাচন কৰক',
          addToHomeScreen: 'হোম স্ক্ৰীণলৈ যোগ কৰক',
          openApp: 'এপ খোলক',
          fromHomeScreen: 'আপোনাৰ হোম স্ক্ৰীণৰ পৰা',
        },
        or: {
          clickOnBrowser: 'କ୍ଲିକ କରନ୍ତୁ',
          shareIcon: 'ବ୍ରାଉଜର ମେନୁରେ',
          scrollAndSelect: 'ସ୍କ୍ରୋଲ କରନ୍ତୁ ଏବଂ ଚୟନ କରନ୍ତୁ',
          addToHomeScreen: 'ହୋମ ସ୍କ୍ରିନରେ ଯୋଡନ୍ତୁ',
          openApp: 'ଆପ୍ ଖୋଲନ୍ତୁ',
          fromHomeScreen: 'ଆପଣଙ୍କ ହୋମ ସ୍କ୍ରିନରୁ',
        },
      };

      // Get language code (first 2 characters)
      const langCode = deviceLang.substring(0, 2);

      // Return translation if available, otherwise fallback to English
      if (translations[langCode] && translations[langCode][key]) {
        return translations[langCode][key];
      }

      // Fallback to English or provided fallback
      return fallbackText || translations['en'][key] || fallbackText;
    },

    // Generate unique ID
    generateId: (prefix) =>
      prefix + '_' + Math.random().toString(36).substr(2, 9),

    // Debounce function
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction() {
        const args = arguments;
        const later = () => {
          clearTimeout(timeout);
          func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
  };

  // Drawer Component
  const Drawer = {
    isOpen: false,
    element: null,
    overlay: null,
    content: null,
    themeListener: null,

    // Create drawer HTML with theme support
    create: async function (options = {}) {
      const id = utils.generateId('waheim-drawer');
      const overlayId = utils.generateId('waheim-overlay');
      const colors = utils.getThemeColors();

      // Get app info from manifest
      const manifest = await utils.loadManifest();
      const appIcon = await utils.getAppIcon();
      const appName = manifest
        ? manifest.short_name || manifest.name
        : 'This App';

      // Get app URL from window.location
      const appUrl = window.location.hostname;

      // Default options
      const config = {
        title: `Install ${appName}`,
        description: `Get best experience by installing ${appName} on your device.`,
        buttonText: `Install ${appName}`,
        position: 'bottom',
        ...options,
      };

      // Create drawer HTML with theme colors
      const drawerHTML = `
        <div id="${overlayId}" class="waheim-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${colors.overlay};
          z-index: 9998;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
          backdrop-filter: blur(8px);
        "></div>
        
        <div id="${id}" class="waheim-drawer" style="
          position: fixed;
          ${config.position === 'bottom' ? 'bottom: 0; left: 0; right: 0;' : 'top: 0; left: 0; right: 0;'}
          background: ${colors.background};
          z-index: 9999;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 90vh;
          overflow-y: auto;
          border-radius: ${config.position === 'bottom' ? '12px 12px 0 0' : '0 0 12px 12px'};
          box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid ${colors.border};
        ">
          <div style="
            padding: 20px 24px 24px;
            max-width: 440px;
            margin: 0 auto;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <!-- Handle -->
            <div style="
              width: 100px;
              height: 8px;
              background: ${colors.handle};
              border-radius: 9999px;
              margin: 0px auto 20px;
              cursor: pointer;
              transition: background 0.2s ease;
            " onclick="window.waheimSDK.closeDrawer()" 
            onmouseover="this.style.background='${colors.mutedForeground}'" 
            onmouseout="this.style.background='${colors.handle}'"></div>
            
            <!-- Apple Store Style App Tag -->
            <div style="
              background: ${colors.background};
              border: 1px solid ${colors.border};
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 32px;
              display: flex;
              align-items: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            ">
              <!-- App Icon -->
              <img src="${appIcon}" alt="${appName}" style="
                width: 60px;
                height: 60px;
                border-radius: 12px;
                margin-right: 16px;
                object-fit: cover;
                background: ${colors.muted};
                border: 1px solid ${colors.border};
              " onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iIzYxZGFmYiIvPgogIDxwYXRoIGQ9Ik0zMCAxNUMyNSAxNSAyMCAxOCAxNy4gMjJDMTQgMjYgMTQgMzAgMTQgMzZIMTlDMTkgMzAgMTkgMjYgMjEgMjJDMjMgMTggMjYgMTUgMzAgMTVWMTVaIiBmaWxsPSJ3aGl0ZSIvPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIvPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjUiIGZpbGw9IiM2MWRhZmIiLz4KPC9zdmc+';">
              
              <!-- App Info -->
              <div style="flex: 1;">
                <span style="
                  display: block;
                  font-size: 16px;
                  font-weight: 600;
                  color: ${colors.foreground};
                  margin-bottom: 2px;
                  line-height: 1.2;
                ">${appName}</span>
                <span style="
                  display: block;
                  font-size: 13px;
                  color: ${colors.mutedForeground};
                  line-height: 1.2;
                ">${appUrl}</span>
              </div>
            </div>
            
            <!-- Installation Steps -->
            <div style="text-align: left; margin-bottom: 24px;">
              
              <!-- Step 1 -->
              <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                <div style="
                  background: ${colors.muted};
                  color: ${colors.foreground};
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: 600;
                  margin-right: 12px;
                  flex-shrink: 0;
                ">1</div>
                <div style="flex: 1;">
                  <span style="
                    color: ${colors.foreground};
                    font-size: 14px;
                    line-height: 1.5;
                  ">${utils.translateText('clickOnBrowser', 'Click')} 
                    <svg width="18" height="18" viewBox="0 0 256 256" style="display: inline-block; vertical-align: middle; margin: 0 2px; fill: #007AFF;">
                      <path d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"></path>
                    </svg> 
                    ${utils.translateText('shareIcon', 'on menu of browser')}
                  </span>
                </div>
              </div>
              
              <!-- Step 2 -->
              <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                <div style="
                  background: ${colors.muted};
                  color: ${colors.foreground};
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: 600;
                  margin-right: 12px;
                  flex-shrink: 0;
                ">2</div>
                <div style="flex: 1;">
                  <span style="
                    color: ${colors.foreground};
                    font-size: 14px;
                    line-height: 1.5;
                  ">${utils.translateText('scrollAndSelect', 'Scroll and select')} 
                    <code style="
                      background: ${colors.muted};
                      color: ${colors.foreground};
                      padding: 2px 6px;
                      border-radius: 4px;
                      font-size: 13px;
                      font-family: system-ui, -apple-system, sans-serif;
                      display: inline-flex;
                      align-items: center;
                      vertical-align: middle;
                      margin: 0 2px;
                    ">
                      <svg width="14" height="14" viewBox="0 0 256 256" style="margin-right: 4px; fill: ${colors.foreground};">
                        <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32-80a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path>
                      </svg>
                      ${utils.translateText('addToHomeScreen', 'Add to Home Screen')}
                    </code>
                  </span>
                </div>
              </div>
              
              <!-- Step 3 -->
              <div style="display: flex; align-items: flex-start;">
                <div style="
                  background: ${colors.muted};
                  color: ${colors.foreground};
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: 600;
                  margin-right: 12px;
                  flex-shrink: 0;
                ">3</div>
                <div style="flex: 1;">
                  <span style="
                    color: ${colors.foreground};
                    font-size: 14px;
                    line-height: 1.5;
                  ">${utils.translateText('openApp', 'Open app')} 
                    <img src="${appIcon}" alt="${appName}" style="
                      width: 16px;
                      height: 16px;
                      border-radius: 4px;
                      display: inline-block;
                      vertical-align: middle;
                      margin: 0 2px;
                      background: ${colors.muted};
                      border: 1px solid ${colors.border};
                    " onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSI0IiBmaWxsPSIjNjFkYWZiIi8+CiAgPHBhdGggZD0iTTggNEM2LjY3IDQgNS42NyA0LjY3IDUuMzMgNi41QzUgOC4zMyA1IDkuMzMgNSAxMC44SDYuNjdDNi42NyA5LjMzIDYuNjcgOC4zMyA2LjY3IDYuNUM3IDQuNjcgNy4zMyA0IDggNFY0WiIgZmlsbD0id2hpdGUiLz4KICA8Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iMyIgZmlsbD0id2hpdGUiLz4KICA8Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iMS41IiBmaWxsPSIjNjFkYWZiIi8+Cjwvc3ZnPg==';">
                    ${utils.translateText('fromHomeScreen', 'from your home screen')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Insert into DOM
      document.body.insertAdjacentHTML('beforeend', drawerHTML);

      // Store references
      this.element = document.getElementById(id);
      this.overlay = document.getElementById(overlayId);
      this.content = this.element;

      // Add theme change listener
      this.addThemeListener();

      // Add event listeners
      this.addEventListeners(config);

      return this;
    },

    // Add theme change listener
    addThemeListener: function () {
      this.themeListener = (e) => {
        if (this.element) {
          this.updateTheme();
        }
      };

      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', this.themeListener);
    },

    // Update theme colors
    updateTheme: function () {
      const colors = utils.getThemeColors();

      // Update overlay
      if (this.overlay) {
        this.overlay.style.background = colors.overlay;
      }

      // Update drawer background
      if (this.element) {
        this.element.style.background = colors.background;
        this.element.style.borderColor = colors.border;
      }

      // Update handle
      const handle = this.element.querySelector('div[onclick*="closeDrawer"]');
      if (handle) {
        handle.style.background = colors.handle;
      }

      // Update icon container
      const iconContainer = this.element.querySelector(
        'div[style*="overflow: hidden"]',
      );
      if (iconContainer) {
        iconContainer.style.background = colors.muted;
        iconContainer.style.borderColor = colors.border;
      }

      // Update fallback icon
      const fallbackIcon = iconContainer?.querySelector('svg');
      if (fallbackIcon) {
        fallbackIcon.style.stroke = colors.mutedForeground;
      }

      // Update text colors
      const title = this.element.querySelector('h3');
      if (title) {
        title.style.color = colors.foreground;
      }

      const description = this.element.querySelector('p');
      if (description) {
        description.style.color = colors.mutedForeground;
      }
    },

    // Add event listeners
    addEventListeners: function (config) {
      // Close on overlay click
      this.overlay.addEventListener('click', () => this.close());

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    },

    // Open drawer
    open: async function () {
      if (this.isOpen || !this.element) return;

      this.isOpen = true;

      // Show overlay
      this.overlay.style.opacity = '1';
      this.overlay.style.visibility = 'visible';

      // Show drawer with animation
      setTimeout(() => {
        this.element.style.transform = 'translateY(0)';
      }, 10);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    },

    // Close drawer
    close: function () {
      if (!this.isOpen || !this.element) return;

      this.isOpen = false;

      // Hide drawer
      this.element.style.transform = 'translateY(100%)';

      // Hide overlay
      this.overlay.style.opacity = '0';
      this.overlay.style.visibility = 'hidden';

      // Restore body scroll
      document.body.style.overflow = '';

      // Remove theme listener
      if (this.themeListener) {
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .removeEventListener('change', this.themeListener);
        this.themeListener = null;
      }

      // Remove from DOM after animation
      setTimeout(() => {
        if (this.element) {
          this.element.remove();
          this.element = null;
        }
        if (this.overlay) {
          this.overlay.remove();
          this.overlay = null;
        }
      }, 300);
    },
  };

  // Main SDK
  const WaheimSDK = {
    version: '1.0.0',
    drawer: Drawer,
    utils: utils,

    // Initialize SDK
    init: function (options = {}) {
      const config = {
        autoShow: true,
        delay: 500,
        showOnce: false,
        ...options,
      };

      // Multiple PWA detection methods to prevent drawer when app is installed
      const isStandaloneMode = utils.isStandalone();
      const isStandaloneDisplayMode = window.matchMedia(
        '(display-mode: standalone)',
      ).matches;
      const isFullscreenDisplayMode = window.matchMedia(
        '(display-mode: fullscreen)',
      ).matches;
      const isMinimalUIDisplayMode = window.matchMedia(
        '(display-mode: minimal-ui)',
      ).matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const hasPWAFeatures =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;

      const isAlreadyInstalled =
        isStandaloneMode ||
        isStandaloneDisplayMode ||
        isFullscreenDisplayMode ||
        isMinimalUIDisplayMode ||
        isIOSStandalone ||
        hasPWAFeatures;

      console.log('[Waheim SDK] PWA Detection Results:');
      console.log('  - isStandalone():', isStandaloneMode);
      console.log('  - display-mode standalone:', isStandaloneDisplayMode);
      console.log('  - display-mode fullscreen:', isFullscreenDisplayMode);
      console.log('  - display-mode minimal-ui:', isMinimalUIDisplayMode);
      console.log('  - iOS standalone:', isIOSStandalone);
      console.log('  - hasPWAFeatures:', hasPWAFeatures);
      console.log('  - Final decision - skip init:', isAlreadyInstalled);

      if (isAlreadyInstalled) {
        console.log(
          '[Waheim SDK] App already installed/PWA mode - skipping initialization',
        );
        return this;
      }

      // Check if should show drawer
      if (config.autoShow && this.shouldShowDrawer(config)) {
        setTimeout(async () => {
          await this.showDrawer(config);
        }, config.delay);
      }

      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
      });

      return this;
    },

    // Check if should show drawer
    shouldShowDrawer: (config) => {
      console.log('[Waheim SDK] shouldShowDrawer check:');

      // Detailed standalone mode debugging
      const isStandaloneMode = utils.isStandalone();
      const displayModeMatch = window.matchMedia(
        '(display-mode: standalone)',
      ).matches;
      const fullscreenModeMatch = window.matchMedia(
        '(display-mode: fullscreen)',
      ).matches;
      const iosStandalone = window.navigator.standalone === true;
      const userAgent = window.navigator.userAgent;
      const hasWebView =
        userAgent &&
        (userAgent.includes('wv') || userAgent.includes('WebView'));

      console.log('  - Standalone mode:', isStandaloneMode);
      console.log('  - Display mode standalone:', displayModeMatch);
      console.log('  - Display mode fullscreen:', fullscreenModeMatch);
      console.log('  - iOS standalone:', iosStandalone);
      console.log('  - User Agent:', userAgent);
      console.log('  - Has WebView:', hasWebView);
      console.log('  - Mobile:', utils.isMobile());
      console.log('  - Dark mode:', utils.isDarkMode());
      console.log('  - Mobile only:', config.mobileOnly);
      console.log('  - Show once:', config.showOnce);

      // Don't show if in standalone mode
      if (isStandaloneMode) {
        console.log('  - ❌ Blocked: Running in standalone mode');
        return false;
      }

      // Don't show if not mobile (optional)
      if (config.mobileOnly && !utils.isMobile()) {
        console.log('  - ❌ Blocked: Not mobile and mobileOnly is true');
        return false;
      }

      console.log('  - ✅ Should show drawer');
      return true;
    },

    // Show drawer
    showDrawer: async function (options = {}) {
      // Final failsafe check - don't show if in any PWA mode
      if (utils.isStandalone()) {
        console.log(
          '[Waheim SDK] Final check: Standalone mode detected - aborting drawer show',
        );
        return this;
      }

      const drawerOptions = {
        title: 'Install This App',
        description:
          'Get best experience by installing this app on your device.',
        buttonText: 'Install App',
        ...options,
      };

      await this.drawer.create(drawerOptions);
      this.drawer.open();

      return this;
    },

    // Close drawer
    closeDrawer: function () {
      this.drawer.close();
      return this;
    },

    // Force show drawer (for testing)
    forceShowDrawer: async function (options = {}) {
      console.log('[Waheim SDK] Force showing drawer...');
      return this.showDrawer({
        showOnce: false,
        ...options,
      });
    },

    // Check if standalone
    isStandalone: () => utils.isStandalone(),

    // Check if mobile
    isMobile: () => utils.isMobile(),

    // Check if dark mode
    isDarkMode: () => utils.isDarkMode(),
  };

  // Export to global scope
  window.WaheimSDK = WaheimSDK;
  window.waheimSDK = WaheimSDK;

  // Initialize function with standalone check
  const initializeSDK = () => {
    // Check if app is already in standalone mode
    if (utils.isStandalone()) {
      console.log(
        '[Waheim SDK] App running in standalone mode - skipping initialization',
      );
      return;
    }

    // Debug info
    console.log('[Waheim SDK] Initializing...');
    console.log('[Waheim SDK] Standalone mode:', utils.isStandalone());
    console.log('[Waheim SDK] Mobile:', utils.isMobile());
    console.log('[Waheim SDK] Dark mode:', utils.isDarkMode());

    // Auto-initialize
    WaheimSDK.init();
  };

  // Track if SDK has been initialized
  let sdkInitialized = false;

  // Wrapper to prevent multiple initializations
  const safeInitialize = () => {
    if (sdkInitialized) {
      return;
    }
    sdkInitialized = true;
    initializeSDK();
  };

  // Simple initialization: wait for DOM to be ready
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', safeInitialize);
  } else {
    // DOM is already ready, initialize immediately
    safeInitialize();
  }
})(window);
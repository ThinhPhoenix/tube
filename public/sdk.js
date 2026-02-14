/**
 * Waheim SDK - Standalone Mode Detection & Drawer with Theme Support
 * ES5 compatible for old devices (iOS 12, older Android)
 */

(function(window) {
  'use strict';

  var utils = {
    isStandalone: function() {
      var displayModeStandalone = window.matchMedia ? window.matchMedia('(display-mode: standalone)').matches : false;
      var displayModeFullscreen = window.matchMedia ? window.matchMedia('(display-mode: fullscreen)').matches : false;
      var displayModeMinimalUI = window.matchMedia ? window.matchMedia('(display-mode: minimal-ui)').matches : false;
      var iosStandalone = window.navigator.standalone === true;

      return displayModeStandalone || displayModeFullscreen || displayModeMinimalUI || iosStandalone;
    },

    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent || '');
    },

    isDarkMode: function() {
      return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    },

    getThemeColors: function() {
      var isDark = this.isDarkMode();
      return {
        background: isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
        foreground: isDark ? 'hsl(0 0% 98%)' : 'hsl(0 0% 3.9%)',
        muted: isDark ? 'hsl(0 0% 15%)' : 'hsl(0 0% 98%)',
        mutedForeground: isDark ? 'hsl(0 0% 64%)' : 'hsl(0 0% 46%)',
        border: isDark ? 'hsl(0 0% 15%)' : 'hsl(0 0% 89.8%)',
        input: isDark ? 'hsl(0 0% 9%)' : 'hsl(0 0% 98%)',
        ring: isDark ? 'hsl(0 0% 64%)' : 'hsl(0 0% 46%)',
        overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
        handle: isDark ? 'hsl(0 0% 25%)' : 'hsl(0 0% 88%)'
      };
    },

    getManifestUrl: function() {
      var manifestLink = document.querySelector ? document.querySelector('link[rel="manifest"]') : null;
      if (manifestLink && manifestLink.href) {
        return manifestLink.href;
      }
      return '/manifest.json';
    },

    getFaviconFromHtml: function() {
      var selectors = [
        'link[rel="apple-touch-icon"]',
        'link[rel="icon"][type="image/png"]',
        'link[rel="icon"][type="image/x-icon"]',
        'link[rel="icon"]',
        'link[rel="shortcut icon"]'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var link = document.querySelector ? document.querySelector(selectors[i]) : null;
        if (link && link.href) {
          return link.href;
        }
      }
      return null;
    },

    loadManifest: function(callback) {
      var self = this;
      var manifestUrl = this.getManifestUrl();
      var xhr = new XMLHttpRequest();
      xhr.open('GET', manifestUrl, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var manifest = JSON.parse(xhr.responseText);
              callback(manifest);
            } catch(e) {
              callback(self.getDefaultManifest());
            }
          } else {
            callback(self.getDefaultManifest());
          }
        }
      };
      xhr.onerror = function() {
        callback(self.getDefaultManifest());
      };
      xhr.send();
    },

    getDefaultManifest: function() {
      var htmlFavicon = this.getFaviconFromHtml();
      return {
        name: 'React PWA',
        short_name: 'ReactPWA',
        icons: htmlFavicon
          ? [{ src: htmlFavicon, sizes: '192x192', type: 'image/png' }]
          : [{ src: '/favicon.png', sizes: '192x192', type: 'image/png' }]
      };
    },

    getAppIcon: function(callback) {
      var self = this;
      this.loadManifest(function(manifest) {
        if (manifest && manifest.icons && manifest.icons.length > 0) {
          var icon = manifest.icons[0];
          if (icon && icon.src) {
            callback(icon.src);
            return;
          }
        }
        var htmlFavicon = self.getFaviconFromHtml();
        if (htmlFavicon) {
          callback(htmlFavicon);
        } else {
          callback(self.createFallbackIcon());
        }
      });
    },

    createFallbackIcon: function() {
      var svgIcon = '<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="192" height="192" rx="32"/>' +
        '<path d="M96 48C80 48 64 56 56 68C48 80 48 96 48 112H64C64 96 64 80 72 68C80 56 88 48 96 48V48Z" fill="white"/>' +
        '<circle cx="96" cy="96" r="32" fill="white"/>' +
        '<circle cx="96" cy="96" r="16"/>' +
        '</svg>';
      return 'data:image/svg+xml;base64,' + btoa(svgIcon);
    },

    translateText: function(key, fallbackText) {
      var deviceLang = navigator.language || navigator.userLanguage || 'en';
      var langCode = deviceLang.substring(0, 2);

      var translations = {
        en: { clickOnBrowser: 'Click', shareIcon: 'on menu of browser', scrollAndSelect: 'Scroll and select', addToHomeScreen: 'Add to Home Screen', openApp: 'Open app', fromHomeScreen: 'from your home screen' },
        es: { clickOnBrowser: 'Haz clic', shareIcon: 'en el menú del navegador', scrollAndSelect: 'Desplázate y selecciona', addToHomeScreen: 'Añadir a pantalla de inicio', openApp: 'Abrir app', fromHomeScreen: 'desde tu pantalla de inicio' },
        fr: { clickOnBrowser: 'Cliquez', shareIcon: 'sur le menu du navigateur', scrollAndSelect: 'Faites défiler et sélectionnez', addToHomeScreen: "Ajouter à l'écran d'accueil", openApp: "Ouvrir l'app", fromHomeScreen: "depuis votre écran d'accueil" },
        de: { clickOnBrowser: 'Klicken', shareIcon: 'im Browser-Menü', scrollAndSelect: 'Scrollen und auswählen', addToHomeScreen: 'Zum Startbildschirm hinzufügen', openApp: 'App öffnen', fromHomeScreen: 'vom Startbildschirm aus' },
        it: { clickOnBrowser: 'Clicca', shareIcon: 'sul menu del browser', scrollAndSelect: 'Scorri e seleziona', addToHomeScreen: 'Aggiungi alla schermata principale', openApp: 'Apri app', fromHomeScreen: 'dalla tua schermata principale' },
        pt: { clickOnBrowser: 'Clique', shareIcon: 'no menu do navegador', scrollAndSelect: 'Role e selecione', addToHomeScreen: 'Adicionar à tela inicial', openApp: 'Abrir app', fromHomeScreen: 'da sua tela inicial' },
        ja: { clickOnBrowser: 'クリック', shareIcon: 'ブラウザのメニューで', scrollAndSelect: 'スクロールして選択', addToHomeScreen: 'ホーム画面に追加', openApp: 'アプリを開く', fromHomeScreen: 'ホーム画面から' },
        ko: { clickOnBrowser: '클릭', shareIcon: '브라우저 메뉴에서', scrollAndSelect: '스크롤하여 선택', addToHomeScreen: '홈 화면에 추가', openApp: '앱 열기', fromHomeScreen: '홈 화면에서' },
        zh: { clickOnBrowser: '点击', shareIcon: '在浏览器菜单中', scrollAndSelect: '滚动并选择', addToHomeScreen: '添加到主屏幕', openApp: '打开应用', fromHomeScreen: '从主屏幕' },
        vi: { clickOnBrowser: 'Nhấn vào', shareIcon: 'trên menu của trình duyệt', scrollAndSelect: 'Cuộn và chọn', addToHomeScreen: 'Thêm vào Màn hình chính', openApp: 'Mở ứng dụng', fromHomeScreen: 'từ Màn hình chính của bạn' }
      };

      if (translations[langCode] && translations[langCode][key]) {
        return translations[langCode][key];
      }
      return fallbackText || (translations.en[key]) || fallbackText;
    },

    generateId: function(prefix) {
      return prefix + '_' + Math.random().toString(36).substr(2, 9);
    }
  };

  var Drawer = {
    isOpen: false,
    element: null,
    overlay: null,
    themeListener: null,

    create: function(options, callback) {
      var self = this;
      var id = utils.generateId('waheim-drawer');
      var overlayId = utils.generateId('waheim-overlay');
      var colors = utils.getThemeColors();
      var config = {
        title: 'Install This App',
        description: 'Get best experience by installing this app on your device.',
        buttonText: 'Install App',
        position: 'bottom'
      };
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          config[key] = options[key];
        }
      }

      utils.loadManifest(function(manifest) {
        utils.getAppIcon(function(appIcon) {
          var appName = manifest ? (manifest.short_name || manifest.name) : 'This App';
          var appUrl = window.location.hostname;

          var drawerHTML = '<div id="' + overlayId + '" class="waheim-overlay" style="' +
            'position: fixed; top: 0; left: 0; right: 0; bottom: 0; ' +
            'background: ' + colors.overlay + '; z-index: 9998; ' +
            'opacity: 0; visibility: hidden; ' +
            'transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;"></div>' +
            '<div id="' + id + '" class="waheim-drawer" style="' +
            'position: fixed; bottom: 0; left: 0; right: 0; ' +
            'background: ' + colors.background + '; z-index: 9999; ' +
            'transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); ' +
            'max-height: 90vh; overflow-y: auto; border-radius: 12px 12px 0 0; ' +
            'box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.12); border: 1px solid ' + colors.border + ';">' +
            '<div style="padding: 20px 24px 24px; max-width: 440px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">' +
            '<div style="width: 100px; height: 8px; background: ' + colors.handle + '; border-radius: 9999px; margin: 0px auto 20px; cursor: pointer;" onclick="window.waheimSDK.closeDrawer()"></div>' +
            '<div style="background: ' + colors.background + '; border: 1px solid ' + colors.border + '; border-radius: 16px; padding: 16px; margin-bottom: 32px; display: flex; align-items: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">' +
            '<img src="' + appIcon + '" alt="' + appName + '" style="width: 60px; height: 60px; border-radius: 12px; margin-right: 16px; object-fit: cover; background: ' + colors.muted + '; border: 1px solid ' + colors.border + ';">' +
            '<div style="flex: 1;">' +
            '<span style="display: block; font-size: 16px; font-weight: 600; color: ' + colors.foreground + '; margin-bottom: 2px; line-height: 1.2;">' + appName + '</span>' +
            '<span style="display: block; font-size: 13px; color: ' + colors.mutedForeground + '; line-height: 1.2;">' + appUrl + '</span>' +
            '</div></div>' +
            '<div style="text-align: left; margin-bottom: 24px;">' +
            '<div style="display: flex; align-items: flex-start; margin-bottom: 16px;">' +
            '<div style="background: ' + colors.muted + '; color: ' + colors.foreground + '; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; flex-shrink: 0;">1</div>' +
            '<div style="flex: 1;"><span style="color: ' + colors.foreground + '; font-size: 14px; line-height: 1.5;">' + utils.translateText('clickOnBrowser', 'Click') + ' <svg width="18" height="18" viewBox="0 0 256 256" style="display: inline-block; vertical-align: middle; margin: 0 2px; fill: #007AFF;"><path d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"></path></svg> ' + utils.translateText('shareIcon', 'on menu of browser') + '</span></div></div>' +
            '<div style="display: flex; align-items: flex-start; margin-bottom: 16px;">' +
            '<div style="background: ' + colors.muted + '; color: ' + colors.foreground + '; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; flex-shrink: 0;">2</div>' +
            '<div style="flex: 1;"><span style="color: ' + colors.foreground + '; font-size: 14px; line-height: 1.5;">' + utils.translateText('scrollAndSelect', 'Scroll and select') + ' <code style="background: ' + colors.muted + '; color: ' + colors.foreground + '; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: system-ui, -apple-system, sans-serif; display: inline-flex; align-items: center; vertical-align: middle; margin: 0 2px;"><svg width="14" height="14" viewBox="0 0 256 256" style="margin-right: 4px; fill: ' + colors.foreground + ';"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32-80a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path></svg> ' + utils.translateText('addToHomeScreen', 'Add to Home Screen') + '</code></span></div></div>' +
            '<div style="display: flex; align-items: flex-start;">' +
            '<div style="background: ' + colors.muted + '; color: ' + colors.foreground + '; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; margin-right: 12px; flex-shrink: 0;">3</div>' +
            '<div style="flex: 1;"><span style="color: ' + colors.foreground + '; font-size: 14px; line-height: 1.5;">' + utils.translateText('openApp', 'Open app') + ' ' + utils.translateText('fromHomeScreen', 'from your home screen') + '</span></div></div>' +
            '</div></div></div>';

          if (document.body) {
            document.body.insertAdjacentHTML('beforeend', drawerHTML);
            self.element = document.getElementById(id);
            self.overlay = document.getElementById(overlayId);
            self.addEventListeners();
            callback(self);
          }
        });
      });
    },

    addEventListeners: function() {
      var self = this;
      if (this.overlay && this.overlay.addEventListener) {
        this.overlay.addEventListener('click', function() {
          self.close();
        });
      }
      if (document.addEventListener) {
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && self.isOpen) {
            self.close();
          }
        });
      }
    },

    open: function() {
      var self = this;
      if (this.isOpen || !this.element) return;
      this.isOpen = true;
      if (this.overlay) {
        this.overlay.style.opacity = '1';
        this.overlay.style.visibility = 'visible';
      }
      setTimeout(function() {
        if (self.element) {
          self.element.style.transform = 'translateY(0)';
        }
      }, 10);
      if (document.body) {
        document.body.style.overflow = 'hidden';
      }
    },

    close: function() {
      var self = this;
      if (!this.isOpen || !this.element) return;
      this.isOpen = false;
      if (this.element) {
        this.element.style.transform = 'translateY(100%)';
      }
      if (this.overlay) {
        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
      }
      if (document.body) {
        document.body.style.overflow = '';
      }
      setTimeout(function() {
        if (self.element && self.element.parentNode) {
          self.element.parentNode.removeChild(self.element);
        }
        if (self.overlay && self.overlay.parentNode) {
          self.overlay.parentNode.removeChild(self.overlay);
        }
        self.element = null;
        self.overlay = null;
      }, 300);
    }
  };

  var WaheimSDK = {
    version: '1.0.0',
    drawer: Drawer,

    init: function(options) {
      var config = {
        autoShow: true,
        delay: 500,
        showOnce: false
      };
      if (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            config[key] = options[key];
          }
        }
      }

      if (utils.isStandalone()) {
        return this;
      }

      if (config.autoShow && this.shouldShowDrawer(config)) {
        var self = this;
        setTimeout(function() {
          self.showDrawer(config);
        }, config.delay);
      }

      return this;
    },

    shouldShowDrawer: function(config) {
      if (utils.isStandalone()) {
        return false;
      }
      if (config.mobileOnly && !utils.isMobile()) {
        return false;
      }
      return true;
    },

    showDrawer: function(options, callback) {
      var self = this;
      if (utils.isStandalone()) {
        if (callback) callback(this);
        return this;
      }

      var drawerOptions = {
        title: 'Install This App',
        description: 'Get best experience by installing this app on your device.',
        buttonText: 'Install App'
      };
      if (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            drawerOptions[key] = options[key];
          }
        }
      }

      this.drawer.create(drawerOptions, function(drawer) {
        drawer.open();
        if (callback) callback(self);
      });
      return this;
    },

    closeDrawer: function() {
      this.drawer.close();
      return this;
    },

    isStandalone: function() {
      return utils.isStandalone();
    },

    isMobile: function() {
      return utils.isMobile();
    },

    isDarkMode: function() {
      return utils.isDarkMode();
    }
  };

  window.WaheimSDK = WaheimSDK;
  window.waheimSDK = WaheimSDK;

  var initializeSDK = function() {
    if (utils.isStandalone()) {
      return;
    }
    WaheimSDK.init();
  };

  var sdkInitialized = false;
  var safeInitialize = function() {
    if (sdkInitialized) {
      return;
    }
    sdkInitialized = true;
    initializeSDK();
  };

  if (document.readyState === 'loading') {
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', safeInitialize);
    } else {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
          safeInitialize();
        }
      });
    }
  } else {
    safeInitialize();
  }

})(window);

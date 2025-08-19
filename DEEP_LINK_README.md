# 🔗 Deep Link System - Regalbuto Heritage App

## 📖 Panoramica del Sistema

Il sistema di deep link dell'app Regalbuto Heritage consente di aprire direttamente specifici monumenti tramite QR code, supportando sia Android App Links che iOS Universal Links. Il sistema è composto da:

1. **WebView JavaScript Router** - Gestisce i deep link nell'app web
2. **Server LAMP con PHP** - API endpoint per routing e verifica 
3. **Google Search Console** - Configurazione Android App Links
4. **Apple Developer** - Configurazione iOS Universal Links
5. **Implementazione Native** - Codice APK Android e app iOS

---

## 🌐 1. WebView JavaScript Router

### Struttura del Router (`js/deep-link-router.js`)

Il Deep Link Router v2.1 gestisce tutti i deep link lato client:

```javascript
class DeepLinkRouter {
    constructor() {
        this.baseWebURL = 'https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/';
        this.appDomain = 'itinerarioregalbuto.magnetico.cloud';
    }
}
```

### Formati URL Supportati

Il router supporta multipli formati di URL per massima compatibilità:

1. **`?deep=monument-id`** - Da App Links/Universal Links
2. **`?monument=monument-id`** - Da redirect web  
3. **`?qr=monument-id`** - Da QR code redirect
4. **`#monument-id`** - Da hash fragment
5. **`/monument-id`** - Da path API redirect

### Flusso di Apertura Monumento

```javascript
async openMonumentInApp(monumentId) {
    // 1. Carica dati monumenti da data/monuments.json
    await this.ensureMonumentData();
    
    // 2. Trova il monumento specifico
    const monument = await this.findMonument(monumentId);
    
    // 3. Naviga alla sezione 'tappe'
    window.switchTab('tappe');
    
    // 4. Aspetta rendering card monumenti
    await this.waitForMonumentCards();
    
    // 5. Scrolla e evidenzia la card
    await this.scrollToMonument(monument);
    
    // 6. Apre automaticamente la card (toggleMonument)
    this.expandMonumentCard(monument.id);
    
    // 7. Mostra feedback di successo
    this.showSuccessFeedback(monument);
}
```

### Funzioni di Test Disponibili

```javascript
// Test deep link completo
window.deepLinkUtils.testDeepLink("chiesa-santa-maria-croce")

// Forza apertura monumento
window.deepLinkUtils.forceOpenMonument("chiesa-santa-maria-croce")

// Test solo espansione card
window.deepLinkUtils.testExpansion("chiesa-santa-maria-croce")

// Debug stato sistema
window.deepLinkUtils.debugStatus()

// Genera CSV per QR codes
window.deepLinkUtils.generateQRCodeCSV()
```

---

## 🖥️ 2. Server LAMP con PHP

### Configurazione Apache Virtual Host

```apache
<VirtualHost *:443>
    ServerName itinerarioregalbuto.magnetico.cloud
    DocumentRoot /var/www/html/regalbuto
    
    # SSL Configuration (Let's Encrypt)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/itinerarioregalbuto.magnetico.cloud/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/itinerarioregalbuto.magnetico.cloud/privkey.pem
    
    # Headers per CORS
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type"
    
    # Rewrite Rules per Deep Links
    RewriteEngine On
    
    # App Link verification per Android
    RewriteRule ^\.well-known/assetlinks\.json$ /assetlinks.json [L]
    
    # Universal Link verification per iOS  
    RewriteRule ^\.well-known/apple-app-site-association$ /apple-app-site-association [L]
    
    # Redirect monumenti con user-agent detection
    RewriteCond %{HTTP_USER_AGENT} "magnetico-heritage-android" [NC]
    RewriteRule ^([a-zA-Z0-9\-]+)/?$ magneticoheritagescheme://monument/$1 [R=302,L]
    
    RewriteCond %{HTTP_USER_AGENT} "magnetico-heritage-ios" [NC]  
    RewriteRule ^([a-zA-Z0-9\-]+)/?$ magneticoheritage://monument/$1 [R=302,L]
    
    # Fallback web per browser normali
    RewriteRule ^([a-zA-Z0-9\-]+)/?$ https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/?deep=$1 [R=302,L]
    
    # Root redirect
    RewriteRule ^/?$ https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/ [R=302,L]
</VirtualHost>
```

### File di Verifica

#### Android App Links (`assetlinks.json`)
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.magnetico.heritage",
      "sha256_cert_fingerprints": [
        "output_omitted"
      ]
    }
  }
]
```

#### iOS Universal Links (`apple-app-site-association`)
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["ABC123DEF4.org.magnetico.heritage"],
        "components": [
          {
            "/": "/*",
            "comment": "Tutti i deep link ai monumenti"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["ABC123DEF4.org.magnetico.heritage"]
  }
}
```

### Comandi SSL Let's Encrypt

```bash
# Installazione certificato SSL
sudo certbot --apache -d itinerarioregalbuto.magnetico.cloud

# Rinnovo automatico
sudo crontab -e
# Aggiungi: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Test Server

```bash
# Verifica configurazione Apache
sudo apache2ctl configtest

# Riavvio Apache
sudo systemctl restart apache2

# Test App Links verification
curl https://itinerarioregalbuto.magnetico.cloud/.well-known/assetlinks.json

# Test Universal Links verification  
curl https://itinerarioregalbuto.magnetico.cloud/.well-known/apple-app-site-association

# Test redirect monumento
curl -L https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-croce
```

---

## 📱 3. Google Search Console - Android App Links

### Passaggi di Configurazione

#### 3.1 Accesso a Google Search Console
1. Vai su [Google Search Console](https://search.google.com/search-console)
2. Aggiungi la proprietà `itinerarioregalbuto.magnetico.cloud`
3. Verifica la proprietà del dominio

#### 3.2 Configurazione App Links
1. **Sezione "App Links"** nel menu laterale
2. **Aggiungi App Android**:
   - Package Name: `org.magnetico.heritage`
   - SHA-256 Fingerprint: `output omitted`

#### 3.3 Verifica Associazione
1. **Test URL**: `https://itinerarioregalbuto.magnetico.cloud/.well-known/assetlinks.json`
2. **Stato**: ✅ Verificato
3. **Pattern URL**: `https://itinerarioregalbuto.magnetico.cloud/*`

#### 3.4 Test Funzionalità
```bash
# Test con ADB Android
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-croce" \
  org.magnetico.heritage
```

---

## 🍎 4. Apple Developer - iOS Universal Links

### Passaggi di Configurazione

#### 4.1 Apple Developer Console
1. Accedi ad [Apple Developer](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles**
3. **App IDs** → Seleziona `org.magnetico.heritage`

#### 4.2 Abilitazione Associated Domains
1. **Capabilities** → **Associated Domains**: ✅ Enabled
2. **Domains**:
   - `applinks:itinerarioregalbuto.magnetico.cloud`
   - `webcredentials:itinerarioregalbuto.magnetico.cloud`

#### 4.3 Configurazione Entitlements
```xml
<!-- org.magnetico.heritage.entitlements -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:itinerarioregalbuto.magnetico.cloud</string>
    <string>webcredentials:itinerarioregalbuto.magnetico.cloud</string>
</array>
```

#### 4.4 Verifica File Association
1. **Test URL**: `https://itinerarioregalbuto.magnetico.cloud/.well-known/apple-app-site-association`
2. **Validazione**: [Apple App Site Association Validator](https://branch.io/resources/aasa-validator/)
3. **Team ID**: Sostituisci `ABC123DEF4` con il tuo Team ID

---

## 📱 5. Implementazione APK Android

### 5.1 Manifest Configuration

```xml
<!-- AndroidManifest.xml -->
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTop">
    
    <!-- Intent Filter per App Links -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https"
              android:host="itinerarioregalbuto.magnetico.cloud" />
    </intent-filter>
    
    <!-- Intent Filter per Custom Scheme (fallback) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="magneticoheritagescheme" />
    </intent-filter>
</activity>
```

### 5.2 MainActivity Java/Kotlin Code

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Setup WebView
        setupWebView()
        
        // Handle deep link intent
        handleDeepLinkIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleDeepLinkIntent(it) }
    }
    
    private fun setupWebView() {
        webView = findViewById(R.id.webview)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            userAgentString = "$userAgentString magnetico-heritage-android"
        }
        
        // Aggiungi JavaScript Interface
        webView.addJavascriptInterface(DeepLinkHandler(), "Android")
        
        // Carica app
        webView.loadUrl("https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/")
    }
    
    private fun handleDeepLinkIntent(intent: Intent) {
        val data = intent.data
        data?.let { uri ->
            val monumentId = extractMonumentId(uri)
            monumentId?.let { id ->
                // Passa deep link data al WebView
                val deepLinkData = JSONObject().apply {
                    put("monumentId", id)
                    put("source", "android_app_link")
                }
                
                webView.evaluateJavascript(
                    "if(window.handleiOSDeepLink) window.handleiOSDeepLink('$deepLinkData');",
                    null
                )
            }
        }
    }
    
    private fun extractMonumentId(uri: Uri): String? {
        return when {
            uri.pathSegments.isNotEmpty() -> uri.pathSegments.last()
            uri.getQueryParameter("deep") != null -> uri.getQueryParameter("deep")
            uri.getQueryParameter("monument") != null -> uri.getQueryParameter("monument")
            else -> null
        }
    }
    
    // JavaScript Interface per WebView
    inner class DeepLinkHandler {
        @JavascriptInterface
        fun getDeepLinkData(): String? {
            return intent.data?.let { uri ->
                extractMonumentId(uri)?.let { monumentId ->
                    JSONObject().apply {
                        put("monumentId", monumentId)
                        put("source", "android_intent")
                    }.toString()
                }
            }
        }
    }
}
```

### 5.3 Generazione SHA-256 Fingerprint

```bash
# Per debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Per release keystore  
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias

# Output SHA-256 da inserire in assetlinks.json
```

---

## 🍎 6. Implementazione App iOS

### 6.1 Info.plist Configuration

```xml
<!-- Info.plist -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>org.magnetico.heritage.deeplink</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>magneticoheritage</string>
        </array>
    </dict>
</array>

<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:itinerarioregalbuto.magnetico.cloud</string>
    <string>webcredentials:itinerarioregalbuto.magnetico.cloud</string>
</array>
```

### 6.2 AppDelegate Swift Code

```swift
import UIKit
import WebKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(_ application: UIApplication, 
                    continue userActivity: NSUserActivity, 
                    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        
        // Handle Universal Links
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            return handleDeepLink(url: url, source: "universal_link")
        }
        
        return false
    }
    
    func application(_ app: UIApplication, 
                    open url: URL, 
                    options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        
        // Handle Custom URL Schemes
        return handleDeepLink(url: url, source: "custom_scheme")
    }
    
    private func handleDeepLink(url: URL, source: String) -> Bool {
        guard let monumentId = extractMonumentId(from: url) else { return false }
        
        // Trova il WebView controller
        if let webViewController = findWebViewController(),
           let webView = webViewController.webView {
            
            let deepLinkData = [
                "monumentId": monumentId,
                "source": source
            ]
            
            // Invia deep link al WebView
            let jsonData = try? JSONSerialization.data(withJSONObject: deepLinkData)
            let jsonString = String(data: jsonData!, encoding: .utf8)!
            
            let script = "if(window.handleiOSDeepLink) window.handleiOSDeepLink('\(jsonString)');"
            webView.evaluateJavaScript(script, completionHandler: nil)
            
            return true
        }
        
        return false
    }
    
    private func extractMonumentId(from url: URL) -> String? {
        // Da path: /monument-id
        if !url.pathComponents.isEmpty {
            let lastComponent = url.pathComponents.last!
            if lastComponent != "/" {
                return lastComponent
            }
        }
        
        // Da query parameters
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        return components?.queryItems?.first(where: { 
            $0.name == "deep" || $0.name == "monument" 
        })?.value
    }
}
```

### 6.3 WebView Controller

```swift
class WebViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    
    @IBOutlet weak var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Setup WebView
        setupWebView()
        
        // Load app
        let url = URL(string: "https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/")!
        webView.load(URLRequest(url: url))
    }
    
    private func setupWebView() {
        // Custom User Agent
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 magnetico-heritage-ios"
        
        // JavaScript message handler
        webView.configuration.userContentController.add(self, name: "deepLink")
    }
    
    // Handle messages from WebView
    func userContentController(_ userContentController: WKUserContentController, 
                             didReceive message: WKScriptMessage) {
        if message.name == "deepLink" {
            // Handle requests from WebView if needed
        }
    }
}
```

---

## 🔍 7. Google Search Console - Configurazione Completa

### 7.1 Verifica Proprietà

1. **Metodo DNS**:
   ```
   TXT record: google-site-verification=ABC123DEF456...
   ```

2. **Metodo HTML File**:
   ```html
   <!-- google123abc.html nel document root -->
   google-site-verification: ABC123DEF456...
   ```

### 7.2 Configurazione App Links

#### Accesso alla Sezione
1. Google Search Console → **Proprietà** → `itinerarioregalbuto.magnetico.cloud`
2. **Indicizzazione** → **App Links Android**

#### Aggiunta App
1. **Package Name**: `org.magnetico.heritage`
2. **SHA-256 Fingerprints**:
   - Debug: `14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5`
   - Release: `[Il tuo fingerprint di release]`

#### Stato Verifica
- ✅ **Associazione verificata**
- ✅ **File assetlinks.json accessibile**
- ✅ **Pattern URL configurati**

### 7.3 Monitoraggio

```bash
# Verifica stato App Links
adb shell dumpsys package domain-preferred-apps

# Test specifico package
adb shell dumpsys package org.magnetico.heritage
```

---

## 🍎 8. Apple Developer - Configurazione Completa

### 8.1 App ID Configuration

#### Accesso Apple Developer
1. [Apple Developer Portal](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** → **App IDs**

#### Configurazione App ID
1. **App ID**: `org.magnetico.heritage`
2. **Capabilities**:
   - ✅ **Associated Domains**
   - ✅ **Web Credentials** (opzionale)

### 8.2 Associated Domains

#### Configurazione nei Capabilities
```
Domains:
- applinks:itinerarioregalbuto.magnetico.cloud
- webcredentials:itinerarioregalbuto.magnetico.cloud
```

#### Xcode Project Settings
1. **Target** → **Signing & Capabilities**
2. **+ Capability** → **Associated Domains**
3. Aggiungi domini sopra

### 8.3 Testing iOS Universal Links

```bash
# Test dal Simulatore iOS
xcrun simctl openurl booted "https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-croce"

# Test da dispositivo fisico
# Invia URL via iMessage/Notes e tappa per testare
```

---

## 🎯 9. URL Structure e QR Codes

### Struttura URL per QR Codes

Ogni QR code contiene un URL nel formato:
```
https://itinerarioregalbuto.magnetico.cloud/[monument-id]
```

### Esempi URL Monumenti

```
https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-croce
https://itinerarioregalbuto.magnetico.cloud/chiesa-madre-san-basilio
https://itinerarioregalbuto.magnetico.cloud/convento-sant-agostino
https://itinerarioregalbuto.magnetico.cloud/palazzo-comunale
https://itinerarioregalbuto.magnetico.cloud/monumento-ai-caduti
https://itinerarioregalbuto.magnetico.cloud/cineteatro-urania
```

### Generazione QR Codes

```javascript
// Genera CSV con tutti gli URL per QR codes
window.deepLinkUtils.generateQRCodeCSV()

// Mostra tutti gli URL disponibili
window.deepLinkUtils.showAllQRUrls()
```

---

## 🧪 10. Testing e Debug

### Test Completi del Sistema

#### Test da Browser Web
```javascript
// Test deep link base
window.deepLinkUtils.testDeepLink("chiesa-santa-maria-croce")

// Test tutti i formati URL
window.deepLinkUtils.testAllUrlFormats("chiesa-santa-maria-croce")

// Debug stato sistema
window.deepLinkUtils.debugStatus()
```

#### Test da Device Android
```bash
# Test App Link
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-croce" \
  org.magnetico.heritage

# Test Custom Scheme
adb shell am start -W -a android.intent.action.VIEW \
  -d "magneticoheritagescheme://monument/chiesa-santa-maria-croce" \
  org.magnetico.heritage
```

#### Test da Device iOS
```bash
# Test Universal Link (Simulatore)
xcrun simctl openurl booted "https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-croce"

# Test Custom Scheme (Simulatore)
xcrun simctl openurl booted "magneticoheritage://monument/chiesa-santa-maria-croce"
```

### Debugging Tools

#### Console Browser
```javascript
// Stato del sistema
window.deepLinkUtils.debugStatus()

// Force opening di un monumento
window.deepLinkUtils.forceOpenMonument("chiesa-santa-maria-croce")

// Test solo espansione card
window.deepLinkUtils.testExpansion("chiesa-santa-maria-croce")
```

#### Log Files Server
```bash
# Apache access log
sudo tail -f /var/log/apache2/access.log

# Apache error log  
sudo tail -f /var/log/apache2/error.log

# SSL certificate status
sudo certbot certificates
```

---

## 🔧 11. Troubleshooting

### Problemi Comuni

#### 11.1 App Links Android Non Funzionano
```bash
# Check App Links verification
adb shell dumpsys package domain-preferred-apps

# Re-verify in Google Search Console
# Check assetlinks.json accessibility
curl https://itinerarioregalbuto.magnetico.cloud/.well-known/assetlinks.json
```

#### 11.2 Universal Links iOS Non Funzionano  
```bash
# Validate apple-app-site-association
curl https://itinerarioregalbuto.magnetico.cloud/.well-known/apple-app-site-association

# Check Associated Domains in Xcode
# Verify Team ID in apple-app-site-association
```

#### 11.3 WebView Non Riceve Deep Link
```javascript
// Check if router is loaded
console.log(typeof window.deepLinkRouter)

// Check monument data
console.log(window.monumentsData?.length)

// Check navigation function
console.log(typeof window.switchTab)

// Manual debug
window.deepLinkUtils.debugStatus()
```

### Log Debugging

```javascript
// Enable verbose logging
localStorage.setItem('deeplink_debug', 'true')

// Check all available monument IDs
window.monumentsData?.map(m => m.id)

// Test specific monument exists
window.monumentsData?.find(m => m.id === 'chiesa-santa-maria-croce')
```

---

## 📊 12. Monitoraggio e Analytics

### Google Search Console Monitoring
- **Performance** → **URL con App Links**
- **Coverage** → **App Links Status**
- **Mobile Usability** → **App Links Funzionality**

### Custom Analytics
```javascript
// Track deep link usage
gtag('event', 'deep_link_used', {
    'monument_id': monumentId,
    'source': 'qr_code',
    'success': true
});
```

---

## 🎯 13. Deployment Checklist

### Pre-Release
- [ ] SSL certificati configurati e funzionanti
- [ ] File assetlinks.json e apple-app-site-association accessibili
- [ ] Google Search Console App Links verificati
- [ ] Apple Developer Associated Domains configurati
- [ ] Test su dispositivi fisici Android e iOS

### Post-Release
- [ ] Monitor Google Search Console per errori
- [ ] Test QR codes in produzione
- [ ] Verifica analytics deep link usage
- [ ] Update documentazione se necessario

---

## 📝 Note Tecniche

### Limitazioni e Considerazioni

1. **Android**: App Links richiedono Android 6.0+
2. **iOS**: Universal Links richiedono iOS 9.0+
3. **HTTPS**: Obbligatorio per App Links e Universal Links
4. **Caching**: I file di verifica possono essere cached, aspetta propagazione
5. **User Agent**: Important per distinguere app native da browser

### Best Practices

1. **Fallback sempre disponibile**: URL web funziona anche senza app
2. **User Experience**: Feedback visivo immediato per deep links
3. **Error Handling**: Gestione elegante di monumenti non trovati
4. **Performance**: Caricamento dati ottimizzato
5. **Cross-Platform**: Compatibilità Android e iOS garantita

---

**🏛️ Sistema Deep Link Regalbuto Heritage - Versione 2.1**  
*Documentazione completa aggiornata ad Agosto 2025*

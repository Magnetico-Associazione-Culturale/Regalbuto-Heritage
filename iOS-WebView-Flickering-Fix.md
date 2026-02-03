# iOS WebView Flickering - Soluzione Nativa

## 🔍 Problema Identificato

Il flickering sui tap è presente **SOLO** nell'app iOS WebView, non su:
- ✅ Android WebView
- ✅ Safari browser
- ✅ Web desktop

Questo conferma che è un problema di **configurazione WebView nativa iOS**.

## ❌ Soluzioni CSS/JS Tentate (Inefficaci)

- Disabilitazione tap-highlight-color
- Prevenzione eventi touch 
- Accelerazione hardware forzata
- Disabilitazione backdrop-filter
- Override stati CSS :active

**Risultato**: Nessuna soluzione CSS/JS ha risolto il flickering.

## ✅ Soluzioni Native iOS (Da Implementare)

### 1. WKWebView Configuration

```swift
// Assicurarsi di usare WKWebView (non UIWebView deprecato)
import WebKit

let webView = WKWebView(frame: .zero, configuration: configuration)

// Disabilita l'opacità del WebView
webView.isOpaque = false
webView.backgroundColor = UIColor.clear

// Configurazione scroll
webView.scrollView.backgroundColor = UIColor.clear
webView.scrollView.isOpaque = false
```

### 2. WKWebViewConfiguration

```swift
let configuration = WKWebViewConfiguration()

// Disabilita alcune funzionalità che possono causare flickering
configuration.allowsInlineMediaPlayback = true
configuration.suppressesIncrementalRendering = false

// Media types configuration
configuration.mediaTypesRequiringUserActionForPlayback = []
```

### 3. Rendering Performance

```swift
// In Info.plist aggiungere:
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>

// Disabilitare hardware acceleration temporaneamente se necessario
webView.layer.shouldRasterize = false
webView.layer.rasterizationScale = UIScreen.main.scale
```

### 4. ViewDidLoad Configuration

```swift
override func viewDidLoad() {
    super.viewDidLoad()
    
    // Assicurarsi che il background del controller sia settato
    view.backgroundColor = UIColor.systemBackground
    
    // WebView setup
    webView.isOpaque = false
    webView.backgroundColor = UIColor.clear
    webView.scrollView.backgroundColor = UIColor.clear
    
    // Prevent bouncing
    webView.scrollView.bounces = false
    webView.scrollView.showsVerticalScrollIndicator = false
    webView.scrollView.showsHorizontalScrollIndicator = false
}
```

## 🎯 Test per Verificare la Soluzione

1. Implementare le configurazioni native sopra
2. Testare l'app con la WebView
3. Verificare che il flickering sui tap sia risolto
4. Controllare che la funzionalità rimanga intatta

## 📝 Note per il Team

- Il problema è **specifico iOS WebView nativo**
- **Non richiede modifiche al codice web** (HTML/CSS/JS)
- La soluzione deve essere implementata nell'**app iOS nativa**
- Il WebView deve essere configurato con le proprietà anti-flickering

## 🔗 Riferimenti Utili

- [Apple WKWebView Documentation](https://developer.apple.com/documentation/webkit/wkwebview)
- [WebKit Rendering Performance](https://webkit.org/blog/6161/unobtrusive-page-transitions-with-webkit-page-cache/)
- [iOS WebView Best Practices](https://developer.apple.com/documentation/webkit/wkwebviewconfiguration)
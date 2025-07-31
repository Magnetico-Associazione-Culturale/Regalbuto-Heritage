# Sistema di Fallback per Immagini 360° - A-Frame

## 📋 Panoramica

Il sistema di fallback implementato per il tour virtuale 360° di Regalbuto Heritage utilizza un meccanismo intelligente per selezionare automaticamente il formato di immagine più efficiente supportato dal browser dell'utente.

## 🎯 Priorità dei Formati

Il sistema testa e seleziona i formati in questo ordine di priorità:

1. **AVIF** - Formato più moderno e compresso (fino al 50% più piccolo di JPEG)
2. **WebP** - Formato Google con buona compressione (20-35% più piccolo di JPEG)
3. **JPG** - Formato di fallback universale sempre supportato

## 🔧 Implementazione Tecnica

### Rilevamento Supporto Browser

```javascript
// Test supporto AVIF
function checkAvifSupport() {
    return new Promise((resolve) => {
        const avif = new Image();
        avif.onload = avif.onerror = () => resolve(avif.height === 2);
        avif.src = 'data:image/avif;base64,...'; // Data URI di test
    });
}

// Test supporto WebP  
function checkWebpSupport() {
    return new Promise((resolve) => {
        const webp = new Image();
        webp.onload = webp.onerror = () => resolve(webp.height === 2);
        webp.src = 'data:image/webp;base64,...'; // Data URI di test
    });
}
```

### Selezione Automatica del Formato

```javascript
async function getImageWithFallback(originalPath) {
    // Estrae il nome base del file
    const nameWithoutExt = fileName.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '');
    
    // Crea array dei formati da testare
    const formatOptions = [];
    if (avifSupported) formatOptions.push('avif');
    if (webpSupported) formatOptions.push('webp');
    formatOptions.push('JPG', 'jpg'); // Fallback
    
    // Testa ogni formato fino a trovarne uno disponibile
    for (const format of formatOptions) {
        const testPath = basePath + '/' + nameWithoutExt + '.' + format;
        if (await imageExists(testPath)) {
            return testPath; // Restituisce il primo formato disponibile
        }
    }
    
    return originalPath; // Fallback finale
}
```

## 📁 Struttura File Necessaria

Per ogni immagine 360°, devono esistere questi file nella cartella `src/imgs/360/`:

```
nome-immagine.avif   # Formato AVIF (opzionale)
nome-immagine.webp   # Formato WebP (opzionale) 
nome-immagine.JPG    # Formato JPG (obbligatorio come fallback)
```

Esempio:
```
smaria-ingresso.avif
smaria-ingresso.webp
smaria-ingresso.JPG
```

## 🚀 Vantaggi

### Performance
- **Riduzione dimensioni**: AVIF può ridurre le dimensioni del file fino al 50%
- **Caricamento più veloce**: File più piccoli = tempi di caricamento ridotti
- **Compatibilità universale**: Fallback garantito per tutti i browser

### Esperienza Utente
- **Selezione automatica**: Nessuna configurazione necessaria
- **Qualità ottimale**: Sempre il miglior formato disponibile
- **Compatibilità**: Funziona su tutti i browser e dispositivi

### SEO e Accessibilità  
- **Core Web Vitals**: Miglioramento dei punteggi di velocità
- **Risparmio dati**: Importante per utenti con connessioni limitate
- **Sostenibilità**: Minore consumo di banda = minore impatto ambientale

## 🧪 Testing

### Pagina di Test

È disponibile una pagina di test dedicata: `panoramas/test-fallback.html`

Questa pagina permette di:
- Verificare il supporto formati del browser
- Testare il fallback su diverse immagini
- Monitorare i log del sistema in tempo reale

### Come Testare

1. Apri `http://localhost:8000/panoramas/test-fallback.html`
2. Verifica il supporto formati mostrato in alto
3. Clicca sui link di test per vedere il sistema in azione
4. Controlla la console del browser (F12) per i log dettagliati

## 🔍 Debugging

### Console Logs

Il sistema produce log dettagliati per il debugging:

```
🔍 Checking image format support...
📊 Format support results: { avif: true, webp: true }
Testing image formats for: smaria-ingresso
Format options to test: ['avif', 'webp', 'JPG', 'jpg']
Testing: ../src/imgs/360/smaria-ingresso.avif
✅ Found working image: ../src/imgs/360/smaria-ingresso.avif
```

### Indicatori Status

- ✅ = Formato trovato e utilizzato
- ❌ = Formato non disponibile  
- ⚠️ = Errore nel test del formato
- 🔄 = Utilizzo del fallback originale

## 📊 Compatibilità Browser

| Formato | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| AVIF    | 85+    | 93+     | 16.1+  | 85+  | Variabile |
| WebP    | 23+    | 65+     | 14+    | 18+  | Buona |
| JPG     | ✅     | ✅      | ✅     | ✅   | ✅ |

## 🛠️ Manutenzione

### Aggiunta Nuove Immagini

1. Converti l'immagine JPG originale in AVIF e WebP
2. Mantieni la stessa denominazione (solo estensione diversa)
3. Posiziona tutti i formati in `src/imgs/360/`
4. Il sistema selezionerà automaticamente il formato migliore

### Strumenti di Conversione

- **AVIF**: `avif-cli`, ImageMagick, Squoosh
- **WebP**: `cwebp`, ImageMagick, Photoshop, Squoosh  
- **Online**: Squoosh.app, Convertio, CloudConvert

### Comando Example (ImageMagick)

```bash
# Converti JPG in WebP
magick input.JPG -quality 80 output.webp

# Converti JPG in AVIF  
magick input.JPG -quality 80 output.avif
```

## 🎨 Integrazione A-Frame

Il sistema è completamente integrato con A-Frame e non richiede modifiche al codice esistente. L'immagine selezionata viene automaticamente caricata nell'elemento `<img>` degli assets A-Frame:

```html
<a-scene>
    <a-assets>
        <img id="panorama" crossorigin="anonymous" />
    </a-assets>
    <a-sky id="sky" src="#panorama"></a-sky>
</a-scene>
```

Il sistema modifica dinamicamente l'attributo `src` dell'immagine prima che A-Frame la carichi.

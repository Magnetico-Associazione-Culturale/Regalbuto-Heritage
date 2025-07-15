# Audio Guide Files

Questa cartella contiene i file audio per le guide audio dei monumenti di Regalbuto.

## Struttura dei file

I file devono essere in formato MP3 per la massima compatibilità con i browser.

### File attualmente definiti in monuments.json:

- chiesa-maria-ss-della-croce.mp3
- chiesa-san-basilio.mp3
- monumento-ai-caduti.mp3
- cine-teatro-urania.mp3
- convento-sant-agostino.mp3

### Formato consigliato:

- **Formato**: MP3
- **Qualità**: 128 kbps (buon compromesso tra qualità e dimensioni)
- **Durata**: 2-5 minuti per monumento
- **Lingua**: Italiano

### Esempio di utilizzo:

Ogni file audio deve essere referenziato nel campo `audio_guide` del monuments.json:

```json
"audio_guide": {
    "path": "src/audio/nome-monumento.mp3",
    "duration": 180,
    "language": "it",
    "narrator": "Sistema Audio Guida Regalbuto",
    "description": "Audio guida per il monumento"
}
```

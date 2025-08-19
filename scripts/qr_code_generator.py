import pandas as pd
import qrcode
import qrcode.image.svg

def genera_qr_da_csv(percorso_csv, colonna_url="url", colonna_id="id", percorso_output="src/imgs/qr"):
    """
    Genera codici QR da un file CSV.

    Args:
        percorso_csv (str): Il percorso del file CSV.
        colonna_url (str): Il nome della colonna contenente gli URL. Default è "URL".
        colonna_id (str): Il nome della colonna contenente gli ID per i nomi dei file. Default è "ID".
        percorso_output (str): La directory dove salvare i file SVG. Default è "qr_codes".
    """
    try:
        df = pd.read_csv(percorso_csv)
    except FileNotFoundError:
        print(f"Errore: Il file CSV '{percorso_csv}' non trovato.")
        return
    except KeyError as e:
        print(f"Errore: Colonna mancante nel CSV: {e}. Assicurati che '{colonna_url}' e '{colonna_id}' esistano.")
        return

    # Crea la directory di output se non esiste
    import os
    if not os.path.exists(percorso_output):
        os.makedirs(percorso_output)

    # Imposta la factory per SVG con linee arrotondate
    factory = qrcode.image.svg.SvgPathImage # SvgPathImage produce linee più arrotondate e pulite

    for index, row in df.iterrows():
        url = row[colonna_url]
        # Assicurati che l'ID sia una stringa per il nome del file
        file_id = str(row[colonna_id])
        nome_file_svg = os.path.join(percorso_output, f"{file_id}.svg")

        try:
            # Genera il QR code
            qr_img = qrcode.make(url, image_factory=factory)

            # Salva il QR code come file SVG
            with open(nome_file_svg, 'wb') as f:
                qr_img.save(f)
            print(f"QR code per '{url}' salvato come '{nome_file_svg}'")
        except Exception as e:
            print(f"Errore nella generazione del QR code per '{url}' (ID: {file_id}): {e}")

# Esempio di utilizzo:
if __name__ == "__main__":
    
    csv_path = "data/urls.csv"

    # Esegui la funzione per generare i QR code
    genera_qr_da_csv(csv_path)
    print("\nGenerazione QR code completata. Controlla la cartella 'qr_codes'.")
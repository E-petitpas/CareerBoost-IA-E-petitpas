const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentParsingService {
  /**
   * Extrait le texte d'un document selon son type
   * @param {string} filePath - Chemin vers le fichier
   * @param {string} mimeType - Type MIME du fichier
   * @returns {Promise<string>} Contenu textuel du document
   */
  async extractTextFromDocument(filePath, mimeType) {
    try {
      console.log(`📄 Extraction de texte depuis: ${filePath} (${mimeType})`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${filePath}`);
      }

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractTextFromPDF(filePath);
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractTextFromWord(filePath);
        
        default:
          throw new Error(`Type de fichier non supporté: ${mimeType}`);
      }
    } catch (error) {
      console.error('Erreur extraction texte:', error);
      throw error;
    }
  }

  /**
   * Extrait le texte d'un fichier PDF
   * @param {string} filePath - Chemin vers le fichier PDF
   * @returns {Promise<string>} Contenu textuel
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      console.log(`✅ PDF analysé: ${data.numpages} pages, ${data.text.length} caractères`);
      return data.text;
    } catch (error) {
      console.error('Erreur extraction PDF:', error);
      throw new Error('Impossible d\'extraire le texte du PDF');
    }
  }

  /**
   * Extrait le texte d'un fichier Word (DOC/DOCX)
   * @param {string} filePath - Chemin vers le fichier Word
   * @returns {Promise<string>} Contenu textuel
   */
  async extractTextFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      console.log(`✅ Document Word analysé: ${result.value.length} caractères`);
      
      if (result.messages.length > 0) {
        console.log('Messages mammoth:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('Erreur extraction Word:', error);
      throw new Error('Impossible d\'extraire le texte du document Word');
    }
  }

  /**
   * Nettoie et normalise le texte extrait
   * @param {string} text - Texte brut
   * @returns {string} Texte nettoyé
   */
  cleanExtractedText(text) {
    if (!text) return '';

    return text
      // Supprimer les caractères de contrôle
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      // Normaliser les espaces
      .replace(/\s+/g, ' ')
      // Supprimer les espaces en début/fin
      .trim()
      // Limiter la taille pour éviter les textes trop longs
      .substring(0, 50000); // Limite à 50k caractères
  }
}

module.exports = DocumentParsingService;

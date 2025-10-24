const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Service d'extraction de texte depuis différents formats de fichiers
 * Supporte PDF, DOC et DOCX
 */
class TextExtractionService {
  
  /**
   * Extrait le texte d'un fichier selon son type
   * @param {string} filePath - Chemin vers le fichier
   * @param {string} mimeType - Type MIME du fichier
   * @returns {Promise<string>} - Texte extrait
   */
  async extractText(filePath, mimeType) {
    try {
      console.log(`🔍 Extraction de texte depuis: ${filePath} (${mimeType})`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${filePath}`);
      }

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromWord(filePath);
        
        default:
          throw new Error(`Type de fichier non supporté: ${mimeType}`);
      }
    } catch (error) {
      console.error('❌ Erreur extraction texte:', error);
      throw new Error(`Erreur lors de l'extraction du texte: ${error.message}`);
    }
  }

  /**
   * Extrait le texte d'un fichier PDF
   * @param {string} filePath - Chemin vers le fichier PDF
   * @returns {Promise<string>} - Texte extrait
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('Aucun texte trouvé dans le PDF');
      }
      
      console.log(`✅ PDF analysé: ${data.numpages} pages, ${data.text.length} caractères`);
      return this.cleanText(data.text);
    } catch (error) {
      console.error('❌ Erreur extraction PDF:', error);
      throw new Error(`Erreur lors de l'extraction du PDF: ${error.message}`);
    }
  }

  /**
   * Extrait le texte d'un fichier Word (DOC/DOCX)
   * @param {string} filePath - Chemin vers le fichier Word
   * @returns {Promise<string>} - Texte extrait
   */
  async extractFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('Aucun texte trouvé dans le document Word');
      }
      
      if (result.messages && result.messages.length > 0) {
        console.log('⚠️ Messages d\'extraction Word:', result.messages);
      }
      
      console.log(`✅ Document Word analysé: ${result.value.length} caractères`);
      return this.cleanText(result.value);
    } catch (error) {
      console.error('❌ Erreur extraction Word:', error);
      throw new Error(`Erreur lors de l'extraction du document Word: ${error.message}`);
    }
  }

  /**
   * Nettoie et normalise le texte extrait
   * @param {string} text - Texte brut
   * @returns {string} - Texte nettoyé
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      // Supprimer les caractères de contrôle et espaces multiples
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      // Normaliser les espaces
      .replace(/\s+/g, ' ')
      // Supprimer les espaces en début/fin
      .trim()
      // Supprimer les lignes vides multiples
      .replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  /**
   * Valide le type de fichier supporté
   * @param {string} mimeType - Type MIME du fichier
   * @returns {boolean} - True si supporté
   */
  isSupportedFileType(mimeType) {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    return supportedTypes.includes(mimeType);
  }

  /**
   * Obtient l'extension de fichier recommandée pour un type MIME
   * @param {string} mimeType - Type MIME
   * @returns {string} - Extension de fichier
   */
  getFileExtension(mimeType) {
    const extensions = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };
    
    return extensions[mimeType] || '.unknown';
  }

  /**
   * Valide la taille du fichier (max 10MB)
   * @param {number} fileSize - Taille du fichier en bytes
   * @returns {boolean} - True si valide
   */
  isValidFileSize(fileSize) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return fileSize <= maxSize;
  }

  /**
   * Obtient des statistiques sur le texte extrait
   * @param {string} text - Texte à analyser
   * @returns {object} - Statistiques
   */
  getTextStats(text) {
    if (!text) return { characters: 0, words: 0, lines: 0 };
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return {
      characters: text.length,
      words: words.length,
      lines: lines.length,
      estimatedReadingTime: Math.ceil(words.length / 200) // 200 mots/minute
    };
  }
}

module.exports = new TextExtractionService();

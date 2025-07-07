import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Inicializa o diretório de uploads
 */
export async function initializeUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  // Criar subdiretórios
  const subdirs = ['avatars', 'establishments', 'temp'];
  for (const subdir of subdirs) {
    const subdirPath = path.join(UPLOAD_DIR, subdir);
    try {
      await fs.access(subdirPath);
    } catch {
      await fs.mkdir(subdirPath, { recursive: true });
    }
  }
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validateImageFile(file) {
  const errors = [];

  if (!file) {
    errors.push('Nenhum arquivo fornecido');
    return errors;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  if (file.file && file.file.bytesRead > MAX_FILE_SIZE) {
    errors.push(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return errors;
}

/**
 * Gera nome único para o arquivo
 */
export function generateUniqueFileName(originalName) {
  const ext = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * Salva arquivo de imagem
 */
export async function saveImageFile(file, category = 'temp') {
  const validationErrors = validateImageFile(file);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(', '));
  }

  const fileName = generateUniqueFileName(file.filename);
  const categoryDir = path.join(UPLOAD_DIR, category);
  const filePath = path.join(categoryDir, fileName);

  // Garantir que o diretório da categoria existe
  try {
    await fs.access(categoryDir);
  } catch {
    await fs.mkdir(categoryDir, { recursive: true });
  }

  // Salvar arquivo
  const buffer = await file.toBuffer();
  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    originalName: file.filename,
    mimetype: file.mimetype,
    size: buffer.length,
    path: filePath,
    url: `/uploads/${category}/${fileName}`
  };
}

/**
 * Remove arquivo
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

/**
 * Move arquivo de uma categoria para outra
 */
export async function moveFile(fileName, fromCategory, toCategory) {
  const fromPath = path.join(UPLOAD_DIR, fromCategory, fileName);
  const toPath = path.join(UPLOAD_DIR, toCategory, fileName);
  const toCategoryDir = path.join(UPLOAD_DIR, toCategory);

  // Garantir que o diretório de destino existe
  try {
    await fs.access(toCategoryDir);
  } catch {
    await fs.mkdir(toCategoryDir, { recursive: true });
  }

  try {
    await fs.rename(fromPath, toPath);
    return {
      success: true,
      newPath: toPath,
      newUrl: `/uploads/${toCategory}/${fileName}`
    };
  } catch (error) {
    console.error('Erro ao mover arquivo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lista arquivos em uma categoria
 */
export async function listFiles(category) {
  const categoryDir = path.join(UPLOAD_DIR, category);
  
  try {
    const files = await fs.readdir(categoryDir);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(categoryDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          url: `/uploads/${category}/${file}`
        };
      })
    );
    
    return fileStats;
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return [];
  }
}

/**
 * Limpa arquivos temporários antigos (mais de 24 horas)
 */
export async function cleanupTempFiles() {
  const tempDir = path.join(UPLOAD_DIR, 'temp');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const files = await fs.readdir(tempDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.birthtime < oneDayAgo) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    console.log(`Limpeza de arquivos temporários: ${deletedCount} arquivos removidos`);
    return deletedCount;
  } catch (error) {
    console.error('Erro na limpeza de arquivos temporários:', error);
    return 0;
  }
}


import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CardTemplate, UploadedBackground, SavedMergeLayout } from '../types';

interface IDBTemplateStudioDB extends DBSchema {
  templates: {
    key: string;
    value: CardTemplate;
    indexes: { 'by-updated': string };
  };
  generatedCards: {
    key: string;
    value: {
      id: string;
      templateId: string;
      templateName: string;
      data: Record<string, string>;
      generatedAt: string;
      previewImage?: string;
    };
    indexes: { 'by-generated': string };
  };
  backgrounds: {
    key: string;
    value: UploadedBackground;
    indexes: { 'by-created': string };
  };
  mergeLayouts: {
    key: string;
    value: SavedMergeLayout;
    indexes: { 'by-updated': string };
  };
}

const DB_NAME = 'IDTemplateStudioDB';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<IDBTemplateStudioDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<IDBTemplateStudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1 || !db.objectStoreNames.contains('templates')) {
          const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
          templateStore.createIndex('by-updated', 'updatedAt');
        }

        if (oldVersion < 1 || !db.objectStoreNames.contains('generatedCards')) {
          const generatedStore = db.createObjectStore('generatedCards', { keyPath: 'id' });
          generatedStore.createIndex('by-generated', 'generatedAt');
        }

        if (oldVersion < 2 || !db.objectStoreNames.contains('backgrounds')) {
          const bgStore = db.createObjectStore('backgrounds', { keyPath: 'id' });
          bgStore.createIndex('by-created', 'createdAt');
        }

        if (!db.objectStoreNames.contains('mergeLayouts')) {
          const mergeStore = db.createObjectStore('mergeLayouts', { keyPath: 'id' });
          mergeStore.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveTemplateDB(template: CardTemplate): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

export async function getAllTemplatesDB(): Promise<CardTemplate[]> {
  const db = await getDB();
  const templates = await db.getAllFromIndex('templates', 'by-updated');
  return templates.reverse(); // Most recent first
}

export async function getTemplateByIdDB(id: string): Promise<CardTemplate | undefined> {
  const db = await getDB();
  return db.get('templates', id);
}

export async function deleteTemplateDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

export async function saveGeneratedCardDB(cardRecord: {
  id: string;
  templateId: string;
  templateName: string;
  data: Record<string, string>;
  generatedAt: string;
  previewImage?: string;
}): Promise<void> {
  const db = await getDB();
  await db.put('generatedCards', cardRecord);
}

export async function getAllGeneratedCardsDB() {
  const db = await getDB();
  const cards = await db.getAllFromIndex('generatedCards', 'by-generated');
  return cards.reverse();
}

export async function deleteGeneratedCardDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('generatedCards', id);
}

export async function saveBackgroundDB(bg: UploadedBackground): Promise<void> {
  const db = await getDB();
  await db.put('backgrounds', bg);
}

export async function getAllBackgroundsDB(): Promise<UploadedBackground[]> {
  const db = await getDB();
  const bgs = await db.getAllFromIndex('backgrounds', 'by-created');
  return bgs.reverse();
}

export async function deleteBackgroundDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('backgrounds', id);
}

export async function saveMergeLayoutDB(layout: SavedMergeLayout): Promise<void> {
  const db = await getDB();
  await db.put('mergeLayouts', layout);
}

export async function getAllMergeLayoutsDB(): Promise<SavedMergeLayout[]> {
  const db = await getDB();
  const layouts = await db.getAllFromIndex('mergeLayouts', 'by-updated');
  return layouts.reverse();
}

export async function deleteMergeLayoutDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('mergeLayouts', id);
}
